export type ZoneStatus = 'NORMAL' | 'WARNING' | 'CRITICAL' | 'OFFLINE' | 'UNKNOWN';
export type DeviceStatus = 'ONLINE' | 'OFFLINE';
export type AlertSeverity = 'NORMAL' | 'WARNING' | 'CRITICAL' | 'OFFLINE' | 'SENSOR_FAILURE';

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
  status?: ZoneStatus;
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

export interface Zone {
  id: string;
  zone_name: string;
  location: string;
  device_id: string;
  status: ZoneStatus;
  device_status: DeviceStatus;
  is_stale: boolean;
  latest_reading: SensorReading | null;
  device_info: Device | null;
  created_at: string;
}

export interface Device {
  id: number;
  device_id: string;
  assigned_zone: string;
  connection_status: DeviceStatus;
  last_seen: string | null;
  firmware_version?: string;
  ip_address?: string;
  rssi?: number;
  created_at: string;
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

export interface OverallSummary {
  overallStatus: ZoneStatus;
  totalZones: number;
  activeZones: number;
  offlineZones: number;
  normalZones: number;
  warningZones: number;
  criticalZones: number;
  unknownOrStaleZones: number;
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

export interface AnalyticsData {
  timeRange: string;
  cutoffTime: string;
  mineAverages: {
    temperature: number;
    humidity: number;
    co: number;
    co2: number;
    no2: number;
    totalReadings: number;
  };
  zoneAverages: {
    zoneId: string;
    zoneName: string;
    avgTemp: number;
    avgHum: number;
    avgCo: number;
    avgCo2: number;
    avgNo2: number;
    maxTemp: number;
    maxCo: number;
    maxCo2: number;
    maxNo2: number;
  }[];
  alertFrequency: {
    CRITICAL: number;
    WARNING: number;
    OFFLINE: number;
    NORMAL: number;
    total: number;
  };
  deviceHealth: {
    total: number;
    online: number;
    offline: number;
    systemUptime: number;
  };
  zoneUptimes: {
    zoneId: string;
    zoneName: string;
    uptimePercentage: number;
  }[];
}
