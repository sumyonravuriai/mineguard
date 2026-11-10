import { db } from '../database/db.js';
import { SensorReading, Zone, ZoneStatus } from '../types/index.js';
import { SettingsService } from './settingsService.js';
import { AlertService } from './alertService.js';
import { DeviceService } from './deviceService.js';
import { socketService } from './socketService.js';

export class ZoneService {
  static async getAllZones() {
    const zones = await db.query<Zone>('SELECT * FROM zones ORDER BY id ASC');
    const settings = SettingsService.getSettings();
    const heartbeatLimitMs = (settings.heartbeatTimeoutSeconds || 15) * 1000;
    const now = Date.now();

    const results = [];
    for (const zone of zones) {
      const device = await db.queryOne<any>('SELECT * FROM devices WHERE device_id = ?', [zone.device_id]);
      const latestReading = await db.queryOne<SensorReading>(`
        SELECT * FROM sensor_readings 
        WHERE zone_id = ? 
        ORDER BY timestamp DESC LIMIT 1
      `, [zone.id]);

      const isOnline = device && device.connection_status === 'ONLINE' && device.last_seen && (now - new Date(device.last_seen).getTime() <= heartbeatLimitMs);
      const isStale = !latestReading || (now - new Date(latestReading.timestamp).getTime() > heartbeatLimitMs);

      let status: ZoneStatus = 'UNKNOWN';
      if (!isOnline) {
        status = 'OFFLINE';
      } else if (latestReading) {
        status = AlertService.computeSeverity(latestReading);
      }

      results.push({
        ...zone,
        status,
        device_status: isOnline ? 'ONLINE' : 'OFFLINE',
        is_stale: isStale,
        latest_reading: latestReading ? {
          ...latestReading,
          is_stale: isStale
        } : null,
        device_info: device || null
      });
    }

    return results;
  }

  static async getOverallMineStatus() {
    const zones = await this.getAllZones();
    let overallStatus: ZoneStatus = 'NORMAL';

    let total = zones.length;
    let active = 0;
    let offline = 0;
    let normal = 0;
    let warning = 0;
    let critical = 0;
    let unknownOrStale = 0;

    zones.forEach(z => {
      if (z.device_status === 'ONLINE') active++;
      else offline++;

      if (z.is_stale || z.status === 'UNKNOWN') unknownOrStale++;

      if (z.status === 'CRITICAL') critical++;
      else if (z.status === 'WARNING') warning++;
      else if (z.status === 'NORMAL') normal++;
    });

    if (critical > 0) {
      overallStatus = 'CRITICAL';
    } else if (warning > 0) {
      overallStatus = 'WARNING';
    } else if (offline > 0 || unknownOrStale > 0) {
      overallStatus = 'WARNING'; // Caution: stale or offline zones mean cannot guarantee normal
    } else {
      overallStatus = 'NORMAL';
    }

    return {
      overallStatus,
      totalZones: total,
      activeZones: active,
      offlineZones: offline,
      normalZones: normal,
      warningZones: warning,
      criticalZones: critical,
      unknownOrStaleZones: unknownOrStale
    };
  }

  static async getZoneById(zoneId: string) {
    const zone = await db.queryOne<Zone>('SELECT * FROM zones WHERE id = ?', [zoneId]);
    if (!zone) return null;

    const device = await db.queryOne<any>('SELECT * FROM devices WHERE device_id = ?', [zone.device_id]);
    const latestReading = await db.queryOne<SensorReading>(`
      SELECT * FROM sensor_readings 
      WHERE zone_id = ? 
      ORDER BY timestamp DESC LIMIT 1
    `, [zone.id]);

    const settings = SettingsService.getSettings();
    const heartbeatLimitMs = (settings.heartbeatTimeoutSeconds || 15) * 1000;
    const now = Date.now();

    const isOnline = device && device.connection_status === 'ONLINE' && device.last_seen && (now - new Date(device.last_seen).getTime() <= heartbeatLimitMs);
    const isStale = !latestReading || (now - new Date(latestReading.timestamp).getTime() > heartbeatLimitMs);

    let status: ZoneStatus = 'UNKNOWN';
    if (!isOnline) {
      status = 'OFFLINE';
    } else if (latestReading) {
      status = AlertService.computeSeverity(latestReading);
    }

    return {
      ...zone,
      status,
      device_status: isOnline ? 'ONLINE' : 'OFFLINE',
      is_stale: isStale,
      latest_reading: latestReading ? { ...latestReading, is_stale: isStale } : null,
      device_info: device || null
    };
  }

  static async getZoneReadings(zoneId: string, range: string = '24h'): Promise<SensorReading[]> {
    let intervalHours = 24;
    if (range === '1h') intervalHours = 1;
    else if (range === '6h') intervalHours = 6;
    else if (range === '24h') intervalHours = 24;
    else if (range === '7d') intervalHours = 168;

    const cutoffIso = new Date(Date.now() - intervalHours * 3600 * 1000).toISOString();

    const readings = await db.query<SensorReading>(`
      SELECT * FROM sensor_readings
      WHERE zone_id = ? AND timestamp >= ?
      ORDER BY timestamp ASC
    `, [zoneId, cutoffIso]);

    return readings;
  }

  static async processIncomingReading(reading: any) {
    // 1. Normalize and validate payload fields
    const zone_id = String(reading.zone_id || reading.zoneId || '');
    const device_id = String(reading.device_id || reading.deviceId || '');

    if (!zone_id || !device_id) {
      console.warn(`[ZoneService] Missing zoneId or deviceId in payload:`, reading);
      return null;
    }

    // Helper to parse individual sensor value: null if missing, NaN, or explicitly null
    const parseSensorVal = (val: any): number | null => {
      if (val === null || val === undefined || val === '') return null;
      const num = Number(val);
      return isNaN(num) ? null : num;
    };

    const temp = parseSensorVal(reading.temperature);
    const hum = parseSensorVal(reading.humidity);
    const co = parseSensorVal(reading.co);
    const co2 = parseSensorVal(reading.co2);
    const no2 = parseSensorVal(reading.no2);

    // If every single sensor reading is null, reject as invalid
    if (temp === null && hum === null && co === null && co2 === null && no2 === null) {
      console.warn(`[ZoneService] Empty sensor telemetry packet (all sensors null):`, reading);
      return null;
    }

    const timestamp = reading.timestamp || new Date().toISOString();
    const source = reading.source === 'simulated' ? 'simulated' : 'hardware';

    // 2. Insert into database
    await db.execute(`
      INSERT INTO sensor_readings (zone_id, device_id, temperature, humidity, co, co2, no2, source, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [zone_id, device_id, temp, hum, co, co2, no2, source, timestamp]);

    // 3. Update device heartbeat
    await DeviceService.recordHeartbeat(device_id, zone_id);

    // 4. Evaluate alerts
    const readingObj: SensorReading = {
      zone_id,
      device_id,
      temperature: temp,
      humidity: hum,
      co,
      co2,
      no2,
      source: source as any,
      timestamp
    };

    const evalResult = await AlertService.evaluateAndRecordAlerts(readingObj);

    const payload = {
      ...readingObj,
      source,
      status: evalResult.severity,
      is_stale: false
    };

    // 5. Broadcast real-time update
    socketService.broadcastReading(payload);
    socketService.broadcastZoneStatus({
      zone_id,
      status: evalResult.severity,
      latest_reading: payload
    });

    return payload;
  }

  static async updateZone(id: string, data: Partial<Zone>): Promise<any> {
    const existing = await db.queryOne<Zone>('SELECT * FROM zones WHERE id = ?', [id]);
    if (!existing) return null;

    const name = data.zone_name || existing.zone_name;
    const location = data.location || existing.location;
    const deviceId = data.device_id || existing.device_id;

    await db.execute(`
      UPDATE zones
      SET zone_name = ?, location = ?, device_id = ?
      WHERE id = ?
    `, [name, location, deviceId, id]);

    return await this.getZoneById(id);
  }

  static async createZone(data: { id: string; zone_name: string; location: string; device_id: string }): Promise<any> {
    const nowIso = new Date().toISOString();
    await db.execute(`
      INSERT INTO zones (id, zone_name, location, device_id, created_at)
      VALUES (?, ?, ?, ?, ?)
    `, [data.id, data.zone_name, data.location, data.device_id, nowIso]);

    return await this.getZoneById(data.id);
  }
}
