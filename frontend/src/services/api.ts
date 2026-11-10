import { Alert, AnalyticsData, AppSettings, Device, OverallSummary, SensorReading, Zone } from '../types';

const rawBase = import.meta.env.VITE_API_URL || '/api';
const baseClean = rawBase.endsWith('/') ? rawBase.slice(0, -1) : rawBase;
const API_BASE = baseClean === '/api' || baseClean.endsWith('/api') ? baseClean : `${baseClean}/api`;

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
  }

  const json = await res.json();
  return json.data !== undefined ? json.data : json;
}

export const api = {
  // Overview
  getOverview: () => fetchJson<{
    summary: OverallSummary;
    zones: Zone[];
    recentAlerts: Alert[];
    settings: { demoMode: boolean; regulatoryStandard: string; disclaimerNotice: string };
    mqttStatus: { connected: boolean; brokerUrl: string; lastMessageTime: string | null };
    lastSync: string;
  }>('/overview'),

  // Zones
  getZones: () => fetchJson<Zone[]>('/zones'),
  getZoneById: (id: string) => fetchJson<Zone>(`/zones/${id}`),
  updateZone: (id: string, data: Partial<Zone>) =>
    fetchJson<Zone>(`/zones/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  createZone: (data: { id: string; zone_name: string; location: string; device_id: string }) =>
    fetchJson<Zone>('/zones', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getZoneReadings: (id: string, range: string = '24h') =>
    fetchJson<SensorReading[]>(`/zones/${id}/readings?range=${range}`),

  // Devices
  getDevices: () => fetchJson<Device[]>('/devices'),
  registerDevice: (data: { device_id: string; assigned_zone: string; firmware_version?: string; ip_address?: string }) =>
    fetchJson<Device>('/devices', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateDevice: (id: number, data: Partial<Device>) =>
    fetchJson<Device>(`/devices/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteDevice: (id: number) =>
    fetchJson<{ success: boolean; message: string }>(`/devices/${id}`, {
      method: 'DELETE',
    }),

  // Alerts
  getAlerts: (params?: { severity?: string; zoneId?: string; acknowledged?: number; limit?: number }) => {
    const search = new URLSearchParams();
    if (params?.severity && params.severity !== 'ALL') search.append('severity', params.severity);
    if (params?.zoneId && params.zoneId !== 'ALL') search.append('zoneId', params.zoneId);
    if (params?.acknowledged !== undefined && params.acknowledged !== -1) search.append('acknowledged', String(params.acknowledged));
    if (params?.limit) search.append('limit', String(params.limit));
    const query = search.toString() ? `?${search.toString()}` : '';
    return fetchJson<Alert[]>(`/alerts${query}`);
  },
  acknowledgeAlert: (id: number, acknowledged_by?: string) =>
    fetchJson<Alert>(`/alerts/${id}/acknowledge`, {
      method: 'POST',
      body: JSON.stringify({ acknowledged_by }),
    }),
  acknowledgeAllAlerts: (acknowledged_by?: string) =>
    fetchJson<{ success: boolean }>('/alerts/acknowledge-all', {
      method: 'POST',
      body: JSON.stringify({ acknowledged_by }),
    }),

  // Analytics
  getAnalytics: (range: string = '24h') =>
    fetchJson<AnalyticsData>(`/analytics?range=${range}`),

  // Settings
  getSettings: () => fetchJson<AppSettings>('/settings'),
  updateSettings: (data: Partial<AppSettings>) =>
    fetchJson<AppSettings>('/settings', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Demo Mode
  toggleDemoMode: (demoMode?: boolean) =>
    fetchJson<{ demoMode: boolean }>('/demo/toggle', {
      method: 'POST',
      body: JSON.stringify({ demoMode }),
    }),
  triggerScenario: (zoneId: string, scenario: 'NORMAL' | 'WARNING' | 'CRITICAL' | 'OFFLINE', durationSeconds: number = 60) =>
    fetchJson<{ success: boolean; message: string }>('/demo/trigger', {
      method: 'POST',
      body: JSON.stringify({ zoneId, scenario, durationSeconds }),
    }),

  // MQTT Status
  getMqttStatus: () => fetchJson<{ connected: boolean; brokerUrl: string; lastMessageTime: string | null; subscribedTopics: string[] }>('/mqtt/status'),
};
