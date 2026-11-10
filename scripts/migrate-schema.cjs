const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');

const dbPath = path.resolve(__dirname, '../backend/mineguard.db');
const db = new DatabaseSync(dbPath);

console.log('Migrating SQLite database schema...');
db.exec('PRAGMA foreign_keys = OFF;');

const existingSql = db.prepare('SELECT sql FROM sqlite_master WHERE name = ?').get('sensor_readings');
if (existingSql && existingSql.sql.includes('temperature REAL NOT NULL')) {
  console.log('Found NOT NULL constraint on sensor columns. Migrating to nullable schema...');
  db.exec(`
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

    INSERT INTO sensor_readings_new (id, zone_id, device_id, temperature, humidity, co, co2, no2, source, timestamp)
    SELECT id, zone_id, device_id, temperature, humidity, co, co2, no2, source, timestamp
    FROM sensor_readings;

    DROP TABLE sensor_readings;
    ALTER TABLE sensor_readings_new RENAME TO sensor_readings;
    CREATE INDEX IF NOT EXISTS idx_readings_zone_timestamp ON sensor_readings(zone_id, timestamp);
  `);
  console.log('Migration successfully completed!');
} else {
  console.log('Schema is already up to date.');
}

