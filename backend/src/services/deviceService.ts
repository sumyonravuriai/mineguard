import { db } from '../database/db.js';
import { Device } from '../types/index.js';
import { SettingsService } from './settingsService.js';
import { AlertService } from './alertService.js';
import { socketService } from './socketService.js';

export class DeviceService {
  private static timer: NodeJS.Timeout | null = null;

  static startHeartbeatMonitor() {
    if (this.timer) clearInterval(this.timer);

    this.timer = setInterval(async () => {
      try {
        await this.checkHeartbeats();
      } catch (err: any) {
        console.error('[DeviceService] Error during heartbeat check:', err.message);
      }
    }, 5000);
  }

  static stopHeartbeatMonitor() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  static async checkHeartbeats() {
    const settings = SettingsService.getSettings();
    const timeoutMs = (settings.heartbeatTimeoutSeconds || 15) * 1000;
    const now = Date.now();

    const devices = await db.query<Device>('SELECT * FROM devices');

    for (const device of devices) {
      if (!device.last_seen) {
        if (device.connection_status !== 'OFFLINE') {
          await this.setDeviceStatus(device.device_id, 'OFFLINE', device.assigned_zone);
        }
        continue;
      }

      const lastSeenTime = new Date(device.last_seen).getTime();
      const diff = now - lastSeenTime;

      if (diff > timeoutMs && device.connection_status === 'ONLINE') {
        console.log(`[DeviceService] Transceiver timeout: ${device.device_id} in ${device.assigned_zone} marked OFFLINE (${Math.round(diff / 1000)}s since last packet)`);
        await this.setDeviceStatus(device.device_id, 'OFFLINE', device.assigned_zone);
      } else if (diff <= timeoutMs && device.connection_status === 'OFFLINE') {
        console.log(`[DeviceService] Transceiver resumed: ${device.device_id} in ${device.assigned_zone} restored ONLINE`);
        await this.setDeviceStatus(device.device_id, 'ONLINE', device.assigned_zone);
      }
    }
  }

  static async recordHeartbeat(deviceId: string, zoneId: string) {
    const nowIso = new Date().toISOString();
    const device = await db.queryOne<Device>('SELECT * FROM devices WHERE device_id = ?', [deviceId]);

    if (!device) {
      // Auto-register unknown device
      await db.execute(
        `INSERT INTO devices (device_id, assigned_zone, connection_status, last_seen, created_at)
         VALUES (?, ?, 'ONLINE', ?, ?)`,
        [deviceId, zoneId, nowIso, nowIso]
      );
      return;
    }

    const wasOffline = device.connection_status === 'OFFLINE';

    await db.execute(
      `UPDATE devices
       SET last_seen = ?, connection_status = 'ONLINE', assigned_zone = ?
       WHERE device_id = ?`,
      [nowIso, zoneId, deviceId]
    );

    if (wasOffline) {
      await AlertService.recordDeviceAlert(zoneId, deviceId, false);
      socketService.broadcastDeviceStatus({
        deviceId,
        zoneId,
        status: 'ONLINE',
        lastSeen: nowIso
      });
    }
  }

  static async setDeviceStatus(deviceId: string, status: 'ONLINE' | 'OFFLINE', zoneId: string) {
    await db.execute(
      `UPDATE devices
       SET connection_status = ?
       WHERE device_id = ?`,
      [status, deviceId]
    );

    if (status === 'OFFLINE') {
      await AlertService.recordDeviceAlert(zoneId, deviceId, true);
    }

    socketService.broadcastDeviceStatus({
      deviceId,
      zoneId,
      status,
      lastSeen: new Date().toISOString()
    });
  }

  static async getDevices(): Promise<Device[]> {
    return await db.query<Device>('SELECT * FROM devices ORDER BY id ASC');
  }

  static async getDeviceById(deviceId: string): Promise<Device | null> {
    return await db.queryOne<Device>('SELECT * FROM devices WHERE device_id = ?', [deviceId]);
  }

  static async registerDevice(data: { device_id: string; assigned_zone: string; firmware_version?: string; ip_address?: string }): Promise<Device | null> {
    const nowIso = new Date().toISOString();
    await db.execute(
      `INSERT INTO devices (device_id, assigned_zone, connection_status, last_seen, firmware_version, ip_address, created_at)
       VALUES (?, ?, 'ONLINE', ?, ?, ?, ?)`,
      [
        data.device_id,
        data.assigned_zone,
        nowIso,
        data.firmware_version || 'v1.4.2-esp32',
        data.ip_address || '192.168.1.100',
        nowIso
      ]
    );

    // Update zone's device_id reference
    await db.execute('UPDATE zones SET device_id = ? WHERE id = ?', [data.device_id, data.assigned_zone]);

    return await this.getDeviceById(data.device_id);
  }

  static async updateDevice(id: number, data: Partial<Device>): Promise<Device | null> {
    const existing = await db.queryOne<Device>('SELECT * FROM devices WHERE id = ?', [id]);
    if (!existing) return null;

    const deviceId = data.device_id || existing.device_id;
    const assignedZone = data.assigned_zone || existing.assigned_zone;
    const firmware = data.firmware_version || existing.firmware_version || 'v1.4.2-esp32';
    const ip = data.ip_address || existing.ip_address || '192.168.1.100';

    await db.execute(
      `UPDATE devices
       SET device_id = ?, assigned_zone = ?, firmware_version = ?, ip_address = ?
       WHERE id = ?`,
      [deviceId, assignedZone, firmware, ip, id]
    );

    // Update zone mapping
    await db.execute('UPDATE zones SET device_id = ? WHERE id = ?', [deviceId, assignedZone]);

    return await db.queryOne<Device>('SELECT * FROM devices WHERE id = ?', [id]);
  }

  static async deleteDevice(id: number): Promise<boolean> {
    const res = await db.execute('DELETE FROM devices WHERE id = ?', [id]);
    return res.changes > 0;
  }
}
