import { db } from '../database/db.js';
import { AppSettings, SensorThresholds } from '../types/index.js';

const defaultSettings: AppSettings = {
  demoMode: true,
  heartbeatTimeoutSeconds: 15,
  mqttBrokerUrl: process.env.MQTT_BROKER_URL || 'mqtt://broker.emqx.io:1883',
  mqttTopicPrefix: 'mineguard/zones',
  regulatoryStandard: 'DGMS Coal Mines Regulations 2017 & OSHA Mining Thresholds',
  disclaimerNotice: 'Advisory safety dashboard. Certified safety instruments must be used for formal compliance signoffs.',
  thresholds: {
    temperature: { warning: 30.5, critical: 33.5, unit: '°C', minNormal: 18.0 },
    humidity: { warning: 85.0, critical: 92.0, unit: '%' },
    co: { warning: 25.0, critical: 50.0, unit: 'ppm' },
    co2: { warning: 2500, critical: 5000, unit: 'ppm' },
    no2: { warning: 2.0, critical: 3.0, unit: 'ppm' }
  }
};

export class SettingsService {
  private static cachedSettings: AppSettings = { ...defaultSettings };
  private static initialized = false;

  static async init(): Promise<void> {
    try {
      const rows = await db.query<{ setting_name: string; setting_value: string }>(
        'SELECT setting_name, setting_value FROM settings'
      );

      const map: Record<string, any> = {};
      rows.forEach(r => {
        try {
          map[r.setting_name] = JSON.parse(r.setting_value);
        } catch {
          if (r.setting_value === 'true') map[r.setting_name] = true;
          else if (r.setting_value === 'false') map[r.setting_name] = false;
          else if (!isNaN(Number(r.setting_value))) map[r.setting_name] = Number(r.setting_value);
          else map[r.setting_name] = r.setting_value;
        }
      });

      this.cachedSettings = {
        demoMode: map.demoMode !== undefined ? map.demoMode : defaultSettings.demoMode,
        heartbeatTimeoutSeconds: map.heartbeatTimeoutSeconds !== undefined ? map.heartbeatTimeoutSeconds : defaultSettings.heartbeatTimeoutSeconds,
        mqttBrokerUrl: map.mqttBrokerUrl || process.env.MQTT_BROKER_URL || defaultSettings.mqttBrokerUrl,
        mqttTopicPrefix: map.mqttTopicPrefix || defaultSettings.mqttTopicPrefix,
        regulatoryStandard: map.regulatoryStandard || defaultSettings.regulatoryStandard,
        disclaimerNotice: map.disclaimerNotice || defaultSettings.disclaimerNotice,
        thresholds: map.thresholds || defaultSettings.thresholds
      };

      // Environment variable override for DEMO_MODE if explicitly provided
      if (process.env.DEMO_MODE !== undefined) {
        this.cachedSettings.demoMode = process.env.DEMO_MODE === 'true';
      }

      this.initialized = true;
      console.log(`[SettingsService] Initialized settings. Operating mode: ${this.cachedSettings.demoMode ? 'DEMO' : 'LIVE'}`);
    } catch (err: any) {
      console.warn('[SettingsService] Failed to load settings from DB, using defaults:', err.message);
    }
  }

  static getSettings(): AppSettings {
    return this.cachedSettings;
  }

  static async updateSettings(partial: Partial<AppSettings>): Promise<AppSettings> {
    const nowIso = new Date().toISOString();
    this.cachedSettings = {
      ...this.cachedSettings,
      ...partial,
    };

    for (const [key, val] of Object.entries(partial)) {
      const valStr = typeof val === 'object' ? JSON.stringify(val) : String(val);
      if (db.isPostgres) {
        await db.execute(`
          INSERT INTO settings (setting_name, setting_value, updated_at)
          VALUES (?, ?, ?)
          ON CONFLICT(setting_name) DO UPDATE SET
            setting_value = EXCLUDED.setting_value,
            updated_at = EXCLUDED.updated_at
        `, [key, valStr, nowIso]);
      } else {
        await db.execute(`
          INSERT INTO settings (setting_name, setting_value, updated_at)
          VALUES (?, ?, ?)
          ON CONFLICT(setting_name) DO UPDATE SET
            setting_value = excluded.setting_value,
            updated_at = excluded.updated_at
        `, [key, valStr, nowIso]);
      }
    }

    return this.cachedSettings;
  }
}
