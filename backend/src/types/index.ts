export type ZoneStatus = 'NORMAL' | 'WARNING' | 'CRITICAL' | 'OFFLINE' | 'UNKNOWN';

export type AlertSeverity = 'NORMAL' | 'WARNING' | 'CRITICAL' | 'OFFLINE' | 'SENSOR_FAILURE';

export interface Zone {
  id: string; // e.g., 'ZONE_01'
  zone_name: string; // e.g., 'Zone 01 – Main Entrance'
  location: string; // e.g., 'Portal Shaft, Level 0'
  device_id: string; // e.g., 'ESP32_ZONE_01'
  status?: ZoneStatus;
  last_updated?: string;
  created_at: string;
}

export interface Device {
  id: number;
  device_id: string;
  assigned_zone: string;
  connection_status: 'ONLINE' | 'OFFLINE';
  last_seen: string | null;
  firmware_version?: string;
  ip_address?: string;
  rssi?: number;
  created_at: string;
}

export interface SensorReading {
  id?: number;
  zone_id: string;
  device_id: string;
  temperature: number | null;
  humidity: number | null;
  co: number | null; // ppm
  co2: number | null; // ppm
  no2: number | null; // ppm
  timestamp: string;
  is_stale?: boolean;
  source?: 'hardware' | 'simulated';
  sensor_status?: {
    temperature?: 'active' | 'unavailable' | 'malfunction';
    humidity?: 'active' | 'unavailable' | 'malfunction';
    co?: 'active' | 'unavailable' | 'malfunction';
    co2?: 'active' | 'unavailable' | 'malfunction';
    no2?: 'active' | 'unavailable' | 'malfunction';
  };
}

export interface Alert {
  id: number;
  zone_id: string;
  zone_name?: string;
  sensor_type: 'temperature' | 'humidity' | 'co' | 'co2' | 'no2' | 'device' | 'sensor_failure';
  severity: AlertSeverity;
  current_value: number | null;
  threshold: number | null;
  description: string;
  acknowledged: number; // 0 or 1
  acknowledged_by?: string | null;
  acknowledged_at?: string | null;
  created_at: string;
}

export interface SensorThresholds {
  temperature: { warning: number; critical: number; unit: string; minNormal: number };
  humidity: { warning: number; critical: number; unit: string };
  co: { warning: number; critical: number; unit: string };
  co2: { warning: number; critical: number; unit: string };
  no2: { warning: number; critical: number; unit: string };
}

export interface AppSettings {
  demoMode: boolean;
  heartbeatTimeoutSeconds: number;
  mqttBrokerUrl: string;
  mqttTopicPrefix: string;
  thresholds: SensorThresholds;
  regulatoryStandard: string;
  disclaimerNotice: string;
}
