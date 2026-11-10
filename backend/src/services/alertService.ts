import { db } from '../database/db.js';
import { Alert, AlertSeverity, SensorReading, ZoneStatus } from '../types/index.js';
import { SettingsService } from './settingsService.js';
import { socketService } from './socketService.js';

// Alert throttle map to avoid duplicate alerts every tick: key => timestamp
const alertThrottleMap = new Map<string, number>();

export class AlertService {
  static computeSeverity(reading: SensorReading): ZoneStatus {
    const settings = SettingsService.getSettings();
    const { thresholds } = settings;
    let worstSeverity: ZoneStatus = 'NORMAL';

    const checks: {
      value: number | null | undefined;
      warn: number;
      crit: number;
    }[] = [
      { value: reading.co, warn: thresholds.co.warning, crit: thresholds.co.critical },
      { value: reading.co2, warn: thresholds.co2.warning, crit: thresholds.co2.critical },
      { value: reading.no2, warn: thresholds.no2.warning, crit: thresholds.no2.critical },
      { value: reading.temperature, warn: thresholds.temperature.warning, crit: thresholds.temperature.critical },
      { value: reading.humidity, warn: thresholds.humidity.warning, crit: thresholds.humidity.critical }
    ];

    for (const check of checks) {
      if (check.value === null || check.value === undefined || isNaN(check.value)) {
        continue;
      }
      if (check.value >= check.crit) {
        return 'CRITICAL';
      } else if (check.value >= check.warn) {
        worstSeverity = 'WARNING';
      }
    }

    return worstSeverity;
  }

  static async evaluateAndRecordAlerts(reading: SensorReading): Promise<{ severity: ZoneStatus; alerts: Alert[] }> {
    const settings = SettingsService.getSettings();
    const { thresholds } = settings;
    const nowIso = new Date().toISOString();
    const newAlerts: Alert[] = [];
    let worstSeverity: ZoneStatus = 'NORMAL';

    const checks: {
      sensor: 'temperature' | 'humidity' | 'co' | 'co2' | 'no2';
      value: number | null | undefined;
      warn: number;
      crit: number;
      unit: string;
      label: string;
    }[] = [
      { sensor: 'co', value: reading.co, warn: thresholds.co.warning, crit: thresholds.co.critical, unit: 'ppm', label: 'Carbon Monoxide (CO)' },
      { sensor: 'co2', value: reading.co2, warn: thresholds.co2.warning, crit: thresholds.co2.critical, unit: 'ppm', label: 'Carbon Dioxide (CO2)' },
      { sensor: 'no2', value: reading.no2, warn: thresholds.no2.warning, crit: thresholds.no2.critical, unit: 'ppm', label: 'Nitrogen Dioxide (NO2)' },
      { sensor: 'temperature', value: reading.temperature, warn: thresholds.temperature.warning, crit: thresholds.temperature.critical, unit: '°C', label: 'Ambient Temperature' },
      { sensor: 'humidity', value: reading.humidity, warn: thresholds.humidity.warning, crit: thresholds.humidity.critical, unit: '%', label: 'Relative Humidity' }
    ];

    for (const check of checks) {
      if (check.value === null || check.value === undefined || isNaN(check.value)) {
        continue; // Sensor unavailable - do not trigger threshold alert
      }

      let severity: AlertSeverity = 'NORMAL';
      let thresholdUsed = 0;

      if (check.value >= check.crit) {
        severity = 'CRITICAL';
        thresholdUsed = check.crit;
        worstSeverity = 'CRITICAL';
      } else if (check.value >= check.warn) {
        severity = 'WARNING';
        thresholdUsed = check.warn;
        if (worstSeverity !== 'CRITICAL') worstSeverity = 'WARNING';
      }

      if (severity === 'WARNING' || severity === 'CRITICAL') {
        const throttleKey = `${reading.zone_id}:${check.sensor}:${severity}`;
        const lastSent = alertThrottleMap.get(throttleKey) || 0;
        const nowMs = Date.now();

        // 60 seconds throttle per unique alert condition to prevent DB flooding
        if (nowMs - lastSent > 60000) {
          alertThrottleMap.set(throttleKey, nowMs);

          const desc = `${check.label} reading ${check.value} ${check.unit} breached ${severity.toLowerCase()} regulatory threshold (${thresholdUsed} ${check.unit}) in ${reading.zone_id}.`;

          const result = await db.execute(
            `INSERT INTO alerts (zone_id, sensor_type, severity, current_value, threshold, description, acknowledged, created_at)
             VALUES (?, ?, ?, ?, ?, ?, 0, ?)`,
            [reading.zone_id, check.sensor, severity, check.value, thresholdUsed, desc, nowIso]
          );

          const alertObj: Alert = {
            id: Number(result.lastInsertRowid || 0),
            zone_id: reading.zone_id,
            sensor_type: check.sensor,
            severity,
            current_value: check.value,
            threshold: thresholdUsed,
            description: desc,
            acknowledged: 0,
            created_at: nowIso
          };

          newAlerts.push(alertObj);
          socketService.broadcastAlert(alertObj);
        }
      }
    }

    return { severity: worstSeverity, alerts: newAlerts };
  }

  static async recordDeviceAlert(zoneId: string, deviceId: string, isOffline: boolean) {
    const nowIso = new Date().toISOString();
    const severity: AlertSeverity = isOffline ? 'OFFLINE' : 'NORMAL';
    const throttleKey = `${zoneId}:${deviceId}:offline_status_${isOffline}`;
    const lastSent = alertThrottleMap.get(throttleKey) || 0;
    if (Date.now() - lastSent < 30000) return;
    alertThrottleMap.set(throttleKey, Date.now());

    const desc = isOffline
      ? `Telemetry heartbeat timeout: Device ${deviceId} assigned to ${zoneId} is OFFLINE. Atmospheric data may be stale.`
      : `Telemetry heartbeat restored: Device ${deviceId} assigned to ${zoneId} is back ONLINE.`;

    const result = await db.execute(
      `INSERT INTO alerts (zone_id, sensor_type, severity, current_value, threshold, description, acknowledged, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 0, ?)`,
      [zoneId, 'device', severity, null, null, desc, nowIso]
    );

    const alertObj: Alert = {
      id: Number(result.lastInsertRowid || 0),
      zone_id: zoneId,
      sensor_type: 'device',
      severity,
      current_value: null,
      threshold: null,
      description: desc,
      acknowledged: 0,
      created_at: nowIso
    };

    socketService.broadcastAlert(alertObj);
  }

  static async getAlerts(filter: { severity?: string; zoneId?: string; acknowledged?: number; limit?: number }): Promise<Alert[]> {
    let query = `
      SELECT a.*, z.zone_name 
      FROM alerts a
      LEFT JOIN zones z ON a.zone_id = z.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (filter.severity && filter.severity !== 'ALL') {
      query += ` AND a.severity = ?`;
      params.push(filter.severity);
    }
    if (filter.zoneId && filter.zoneId !== 'ALL') {
      query += ` AND a.zone_id = ?`;
      params.push(filter.zoneId);
    }
    if (filter.acknowledged !== undefined && filter.acknowledged !== -1) {
      query += ` AND a.acknowledged = ?`;
      params.push(filter.acknowledged);
    }

    query += ` ORDER BY a.created_at DESC LIMIT ?`;
    params.push(filter.limit || 50);

    return await db.query<Alert>(query, params);
  }

  static async acknowledgeAlert(alertId: number, acknowledgedBy: string = 'Current Operator'): Promise<Alert | null> {
    const nowIso = new Date().toISOString();
    await db.execute(
      `UPDATE alerts
       SET acknowledged = 1, acknowledged_by = ?, acknowledged_at = ?
       WHERE id = ?`,
      [acknowledgedBy, nowIso, alertId]
    );

    const updated = await db.queryOne<Alert>('SELECT * FROM alerts WHERE id = ?', [alertId]);
    if (updated) {
      socketService.emit('alert:ack', updated);
    }
    return updated;
  }

  static async acknowledgeAllAlerts(acknowledgedBy: string = 'Current Operator'): Promise<{ count: number }> {
    const nowIso = new Date().toISOString();
    const result = await db.execute(
      `UPDATE alerts
       SET acknowledged = 1, acknowledged_by = ?, acknowledged_at = ?
       WHERE acknowledged = 0`,
      [acknowledgedBy, nowIso]
    );

    socketService.emit('alert:ack_all', { acknowledged_by: acknowledgedBy, acknowledged_at: nowIso });
    return { count: result.changes };
  }
}
