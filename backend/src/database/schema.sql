-- ==============================================================================
-- MINEGUARD UNDERGROUND MINE SAFETY PLATFORM
-- PRODUCTION POSTGRESQL RELATIONAL SCHEMA
-- ==============================================================================

-- 1. Underground Mine Zones Table
CREATE TABLE IF NOT EXISTS zones (
  id VARCHAR(64) PRIMARY KEY,
  zone_name VARCHAR(128) NOT NULL,
  location VARCHAR(255) NOT NULL,
  device_id VARCHAR(64) NOT NULL,
  created_at VARCHAR(64) NOT NULL
);

-- 2. Transceiver Nodes Table
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

-- 3. High-Frequency Environmental Sensor Readings
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

-- 4. Alerts and Incident Ledger
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

-- 5. Operational Settings & Thresholds Key-Value Store
CREATE TABLE IF NOT EXISTS settings (
  id SERIAL PRIMARY KEY,
  setting_name VARCHAR(128) UNIQUE NOT NULL,
  setting_value TEXT NOT NULL,
  updated_at VARCHAR(64) NOT NULL
);

