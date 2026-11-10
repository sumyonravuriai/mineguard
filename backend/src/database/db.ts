import { DatabaseSync } from 'node:sqlite';
import pg from 'pg';
import path from 'node:path';
import fs from 'node:fs';

const { Pool } = pg;

export interface QueryResultInfo {
  lastInsertRowid?: number;
  changes: number;
}

class DatabaseAdapter {
  public isPostgres: boolean = false;
  private pgPool: pg.Pool | null = null;
  private sqliteDb: DatabaseSync | null = null;

  constructor() {
    const databaseUrl = process.env.DATABASE_URL;
    if (databaseUrl && (databaseUrl.startsWith('postgres://') || databaseUrl.startsWith('postgresql://'))) {
      this.isPostgres = true;
      console.log('[Database] Initializing managed PostgreSQL connection pool...');
      const useSsl = process.env.DATABASE_SSL !== 'false' && !databaseUrl.includes('localhost') && !databaseUrl.includes('127.0.0.1');
      this.pgPool = new Pool({
        connectionString: databaseUrl,
        ssl: useSsl ? { rejectUnauthorized: false } : false,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
      });

      this.pgPool.on('error', (err) => {
        console.error('[Database] Unexpected PostgreSQL client error:', err.message);
      });
    } else {
      this.isPostgres = false;
      const dbPath = process.env.DB_PATH || path.resolve(process.cwd(), 'mineguard.db');
      console.log(`[Database] Initializing persistent SQLite database at: ${dbPath}`);
      const dbDir = path.dirname(dbPath);
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }
      this.sqliteDb = new DatabaseSync(dbPath);
      try {
        this.sqliteDb.exec('PRAGMA journal_mode = WAL;');
        this.sqliteDb.exec('PRAGMA foreign_keys = ON;');
      } catch (err: any) {
        console.warn('[Database] WAL PRAGMA notice:', err.message);
      }
    }
  }

  private convertPlaceholders(sql: string): string {
    let index = 1;
    return sql.replace(/\?/g, () => `$${index++}`);
  }

  async query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    if (this.isPostgres && this.pgPool) {
      const pgSql = this.convertPlaceholders(sql);
      const res = await this.pgPool.query(pgSql, params);
      return res.rows as T[];
    } else if (this.sqliteDb) {
      const stmt = this.sqliteDb.prepare(sql);
      return stmt.all(...params) as unknown as T[];
    }
    return [];
  }

  async queryOne<T = any>(sql: string, params: any[] = []): Promise<T | null> {
    const rows = await this.query<T>(sql, params);
    return rows.length > 0 ? rows[0] : null;
  }

  async execute(sql: string, params: any[] = []): Promise<QueryResultInfo> {
    if (this.isPostgres && this.pgPool) {
      let pgSql = this.convertPlaceholders(sql);
      // If INSERT and doesn't have RETURNING, append RETURNING id
      const isInsert = /^\s*INSERT\s+INTO/i.test(pgSql);
      const hasReturning = /\bRETURNING\b/i.test(pgSql);
      if (isInsert && !hasReturning) {
        pgSql += ' RETURNING id';
      }
      const res = await this.pgPool.query(pgSql, params);
      const lastId = res.rows[0]?.id ? Number(res.rows[0].id) : undefined;
      return {
        lastInsertRowid: lastId,
        changes: res.rowCount || 0,
      };
    } else if (this.sqliteDb) {
      const stmt = this.sqliteDb.prepare(sql);
      const info = stmt.run(...params);
      return {
        lastInsertRowid: info.lastInsertRowid !== undefined ? Number(info.lastInsertRowid) : undefined,
        changes: info.changes !== undefined ? Number(info.changes) : 0,
      };
    }
    return { changes: 0 };
  }

  getRawSqlite(): DatabaseSync | null {
    return this.sqliteDb;
  }
}

export const db = new DatabaseAdapter();

export async function initDatabase() {
  if (db.isPostgres) {
    console.log('[Database] Verifying PostgreSQL schema tables & indexes...');
    await db.query(`
      CREATE TABLE IF NOT EXISTS zones (
        id VARCHAR(64) PRIMARY KEY,
        zone_name VARCHAR(128) NOT NULL,
        location VARCHAR(255) NOT NULL,
        device_id VARCHAR(64) NOT NULL,
        created_at VARCHAR(64) NOT NULL
      );

      CREATE TABLE IF NOT EXISTS devices (
        id SERIAL PRIMARY KEY,
        device_id VARCHAR(64) UNIQUE NOT NULL,
        assigned_zone VARCHAR(64) NOT NULL,
        connection_status VARCHAR(32) NOT NULL DEFAULT 'ONLINE',
        last_seen VARCHAR(64),
        firmware_version VARCHAR(64) DEFAULT 'v1.4.2-esp32',
        ip_address VARCHAR(64) DEFAULT '192.168.1.101',
        created_at VARCHAR(64) NOT NULL
      );

      CREATE TABLE IF NOT EXISTS sensor_readings (
        id SERIAL PRIMARY KEY,
        zone_id VARCHAR(64) NOT NULL,
        device_id VARCHAR(64) NOT NULL,
        temperature REAL,
        humidity REAL,
        co REAL,
        co2 REAL,
        no2 REAL,
        source VARCHAR(32) DEFAULT 'simulated',
        timestamp VARCHAR(64) NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_readings_zone_timestamp 
        ON sensor_readings(zone_id, timestamp);

      CREATE TABLE IF NOT EXISTS alerts (
        id SERIAL PRIMARY KEY,
        zone_id VARCHAR(64) NOT NULL,
        sensor_type VARCHAR(64) NOT NULL,
        severity VARCHAR(32) NOT NULL,
        current_value REAL,
        threshold REAL,
        description TEXT NOT NULL,
        acknowledged INTEGER NOT NULL DEFAULT 0,
        acknowledged_by VARCHAR(128),
        acknowledged_at VARCHAR(64),
        created_at VARCHAR(64) NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_alerts_created_at 
        ON alerts(created_at DESC);

      CREATE TABLE IF NOT EXISTS settings (
        id SERIAL PRIMARY KEY,
        setting_name VARCHAR(128) UNIQUE NOT NULL,
        setting_value TEXT NOT NULL,
        updated_at VARCHAR(64) NOT NULL
      );
    `);
  } else {
    console.log('[Database] Verifying SQLite schema tables & indexes...');
    const sqlite = db.getRawSqlite();
    if (sqlite) {
      sqlite.exec(`
        CREATE TABLE IF NOT EXISTS zones (
          id TEXT PRIMARY KEY,
          zone_name TEXT NOT NULL,
          location TEXT NOT NULL,
          device_id TEXT NOT NULL,
          created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS devices (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          device_id TEXT UNIQUE NOT NULL,
          assigned_zone TEXT NOT NULL,
          connection_status TEXT NOT NULL DEFAULT 'ONLINE',
          last_seen TEXT,
          firmware_version TEXT DEFAULT 'v1.4.2-esp32',
          ip_address TEXT DEFAULT '192.168.1.101',
          created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS sensor_readings (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          zone_id TEXT NOT NULL,
          device_id TEXT NOT NULL,
          temperature REAL,
          humidity REAL,
          co REAL,
          co2 REAL,
          no2 REAL,
          source TEXT DEFAULT 'simulated',
          timestamp TEXT NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_readings_zone_timestamp 
          ON sensor_readings(zone_id, timestamp);

        CREATE TABLE IF NOT EXISTS alerts (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          zone_id TEXT NOT NULL,
          sensor_type TEXT NOT NULL,
          severity TEXT NOT NULL,
          current_value REAL,
          threshold REAL,
          description TEXT NOT NULL,
          acknowledged INTEGER NOT NULL DEFAULT 0,
          acknowledged_by TEXT,
          acknowledged_at TEXT,
          created_at TEXT NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_alerts_created_at 
          ON alerts(created_at DESC);

        CREATE TABLE IF NOT EXISTS settings (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          setting_name TEXT UNIQUE NOT NULL,
          setting_value TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );
      `);

      try {
        sqlite.exec(`ALTER TABLE sensor_readings ADD COLUMN source TEXT DEFAULT 'simulated';`);
      } catch {
        // column exists
      }

      try {
        const existingTableSql = sqlite.prepare("SELECT sql FROM sqlite_master WHERE name = 'sensor_readings'").get() as any;
        if (existingTableSql && existingTableSql.sql && existingTableSql.sql.includes('temperature REAL NOT NULL')) {
          console.log('[Database] Migrating SQLite sensor_readings table to permit nullable failed sensor readings...');
          sqlite.exec(`
            CREATE TABLE sensor_readings_new (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              zone_id TEXT NOT NULL,
              device_id TEXT NOT NULL,
              temperature REAL,
              humidity REAL,
              co REAL,
              co2 REAL,
              no2 REAL,
              source TEXT DEFAULT 'simulated',
              timestamp TEXT NOT NULL
            );
            INSERT INTO sensor_readings_new SELECT id, zone_id, device_id, temperature, humidity, co, co2, no2, source, timestamp FROM sensor_readings;
            DROP TABLE sensor_readings;
            ALTER TABLE sensor_readings_new RENAME TO sensor_readings;
            CREATE INDEX IF NOT EXISTS idx_readings_zone_timestamp ON sensor_readings(zone_id, timestamp);
          `);
        }
      } catch (err: any) {
        console.warn('[Database] Auto-migration check:', err.message);
      }
    }
  }

  await seedInitialData();
}

async function seedInitialData() {
  const zoneCountRow = await db.queryOne<{ count: string | number }>('SELECT COUNT(*) as count FROM zones');
  const count = Number(zoneCountRow?.count || 0);
  if (count > 0) {
    console.log(`[Database] Database already seeded (${count} zones present).`);
    return;
  }

  console.log('[Database] Seeding initial underground mine zones, devices, and historical records...');
  const now = new Date();
  const nowIso = now.toISOString();

  // 1. Initial 6 Zones
  const initialZones = [
    { id: 'ZONE_01', name: 'Zone 01 – Main Entrance', location: 'Shaft 1 Portal (Level 0)', deviceId: 'ESP32_ZONE_01' },
    { id: 'ZONE_02', name: 'Zone 02 – Mining Section A', location: 'Drift 4 East, Coal Seam 3', deviceId: 'ESP32_ZONE_02' },
    { id: 'ZONE_03', name: 'Zone 03 – Mining Section B', location: 'Longwall Face 2, Level -250m', deviceId: 'ESP32_ZONE_03' },
    { id: 'ZONE_04', name: 'Zone 04 – Underground Tunnel', location: 'Haulage Crosscut B-9', deviceId: 'ESP32_ZONE_04' },
    { id: 'ZONE_05', name: 'Zone 05 – Equipment Room', location: 'Substation & Pump Bay -150m', deviceId: 'ESP32_ZONE_05' },
    { id: 'ZONE_06', name: 'Zone 06 – Ventilation Section', location: 'Return Airway Return-NW Fan', deviceId: 'ESP32_ZONE_06' },
  ];

  for (let idx = 0; idx < initialZones.length; idx++) {
    const z = initialZones[idx];
    await db.execute(
      'INSERT INTO zones (id, zone_name, location, device_id, created_at) VALUES (?, ?, ?, ?, ?)',
      [z.id, z.name, z.location, z.deviceId, nowIso]
    );

    await db.execute(
      'INSERT INTO devices (device_id, assigned_zone, connection_status, last_seen, firmware_version, ip_address, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [z.deviceId, z.id, 'ONLINE', nowIso, 'v1.4.2-esp32', `192.168.4.${10 + idx}`, nowIso]
    );
  }

  // 2. Default Settings & Safety Thresholds
  const defaultSettings = {
    demoMode: true,
    heartbeatTimeoutSeconds: 15,
    mqttBrokerUrl: process.env.MQTT_BROKER_URL || 'mqtt://broker.emqx.io:1883',
    mqttTopicPrefix: 'mineguard/zones',
    regulatoryStandard: 'DGMS (India) Coal Mines Regulations 2017 & OSHA 1910 Mining Thresholds',
    disclaimerNotice: 'Advisory dashboard indicator. Does not replace statutory certified flame safety lamps or certified multi-gas methanometers.',
    thresholds: {
      temperature: { warning: 30.5, critical: 33.5, unit: '°C', minNormal: 18.0 },
      humidity: { warning: 85.0, critical: 92.0, unit: '%' },
      co: { warning: 25.0, critical: 50.0, unit: 'ppm' },
      co2: { warning: 2500, critical: 5000, unit: 'ppm' },
      no2: { warning: 2.0, critical: 3.0, unit: 'ppm' }
    }
  };

  for (const [key, val] of Object.entries(defaultSettings)) {
    const valStr = typeof val === 'object' ? JSON.stringify(val) : String(val);
    await db.execute(
      'INSERT INTO settings (setting_name, setting_value, updated_at) VALUES (?, ?, ?)',
      [key, valStr, nowIso]
    );
  }

  // 3. Seed historical readings for past 24 hours (every 30 mins)
  const pointsCount = 48;
  for (let i = pointsCount; i >= 0; i--) {
    const pointTime = new Date(now.getTime() - i * 30 * 60 * 1000).toISOString();

    for (let zIdx = 0; zIdx < initialZones.length; zIdx++) {
      const z = initialZones[zIdx];
      let baseTemp = 24.5 + zIdx * 1.1 + Math.sin(i / 6) * 1.5;
      let baseHum = 62.0 + (zIdx % 3) * 5.0 + Math.cos(i / 5) * 4.0;
      let baseCo = 4.2 + (zIdx === 1 ? 5.0 : 1.2) + Math.sin(i / 4) * 2.0;
      let baseCo2 = 620 + (zIdx === 2 ? 280 : 80) + Math.sin(i / 3) * 60;
      let baseNo2 = 0.25 + (zIdx === 1 ? 0.35 : 0.08) + Math.cos(i / 4) * 0.1;

      if (i === 12 && zIdx === 1) {
        baseCo = 28.5;
        baseNo2 = 2.2;
      }
      if (i === 4 && zIdx === 2) {
        baseCo2 = 2750;
      }

      await db.execute(
        `INSERT INTO sensor_readings (zone_id, device_id, temperature, humidity, co, co2, no2, source, timestamp)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'simulated', ?)`,
        [
          z.id,
          z.deviceId,
          Number(baseTemp.toFixed(1)),
          Number(baseHum.toFixed(1)),
          Number(baseCo.toFixed(1)),
          Math.round(baseCo2),
          Number(baseNo2.toFixed(2)),
          pointTime,
        ]
      );
    }
  }

  // 4. Initial historical alerts
  const alert1Time = new Date(now.getTime() - 6 * 3600 * 1000).toISOString();
  const alert2Time = new Date(now.getTime() - 2 * 3600 * 1000).toISOString();
  const alert3Time = new Date(now.getTime() - 45 * 60 * 1000).toISOString();

  await db.execute(
    `INSERT INTO alerts (zone_id, sensor_type, severity, current_value, threshold, description, acknowledged, acknowledged_by, acknowledged_at, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      'ZONE_02',
      'co',
      'WARNING',
      28.5,
      25.0,
      'Carbon Monoxide concentration elevated to 28.5 ppm exceeding warning limit (25.0 ppm). Haulage vehicle exhaust suspected.',
      1,
      'Shift Supervisor Kumar',
      new Date(now.getTime() - 5.5 * 3600 * 1000).toISOString(),
      alert1Time
    ]
  );

  await db.execute(
    `INSERT INTO alerts (zone_id, sensor_type, severity, current_value, threshold, description, acknowledged, acknowledged_by, acknowledged_at, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      'ZONE_03',
      'co2',
      'WARNING',
      2750,
      2500,
      'Carbon Dioxide rose to 2750 ppm in Mining Section B. Auxiliary ventilation booster fan activated.',
      1,
      'Mine Ventilation Officer Roy',
      new Date(now.getTime() - 1.5 * 3600 * 1000).toISOString(),
      alert2Time
    ]
  );

  await db.execute(
    `INSERT INTO alerts (zone_id, sensor_type, severity, current_value, threshold, description, acknowledged, acknowledged_by, acknowledged_at, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      'ZONE_05',
      'temperature',
      'NORMAL',
      29.8,
      30.5,
      'Equipment room temperature normalized to 29.8°C following chiller condenser maintenance.',
      0,
      null,
      null,
      alert3Time
    ]
  );

  console.log('[Database] Initial seeding complete.');
}
