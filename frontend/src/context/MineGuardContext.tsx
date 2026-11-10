import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Alert, AppSettings, OverallSummary, SensorReading, Zone } from '../types';
import { api } from '../services/api';
import { socketClient } from '../services/socket';

export interface ToastItem {
  id: string;
  type: 'success' | 'warning' | 'critical' | 'info';
  title: string;
  message: string;
  timestamp: Date;
}

interface MineGuardContextType {
  zones: Zone[];
  summary: OverallSummary;
  alerts: Alert[];
  unreadAlertCount: number;
  isConnected: boolean;
  demoMode: boolean;
  lastSync: Date;
  settings: AppSettings | null;
  toasts: ToastItem[];
  toggleDemoMode: () => Promise<void>;
  refreshData: () => Promise<void>;
  acknowledgeAlert: (id: number) => Promise<void>;
  acknowledgeAllAlerts: () => Promise<void>;
  addToast: (type: ToastItem['type'], title: string, message: string) => void;
  removeToast: (id: string) => void;
  triggerScenario: (zoneId: string, scenario: 'NORMAL' | 'WARNING' | 'CRITICAL' | 'OFFLINE', durationSeconds?: number) => Promise<void>;
}

const defaultSummary: OverallSummary = {
  overallStatus: 'NORMAL',
  totalZones: 6,
  activeZones: 6,
  offlineZones: 0,
  normalZones: 6,
  warningZones: 0,
  criticalZones: 0,
  unknownOrStaleZones: 0,
};

const MineGuardContext = createContext<MineGuardContextType | undefined>(undefined);

export const MineGuardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [zones, setZones] = useState<Zone[]>([]);
  const [summary, setSummary] = useState<OverallSummary>(defaultSummary);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [demoMode, setDemoMode] = useState<boolean>(true);
  const [lastSync, setLastSync] = useState<Date>(new Date());
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = useCallback((type: ToastItem['type'], title: string, message: string) => {
    const id = `${Date.now()}-${Math.random()}`;
    const newToast: ToastItem = { id, type, title, message, timestamp: new Date() };
    setToasts((prev) => [newToast, ...prev].slice(0, 5));

    // Auto dismiss after 6 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 6000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Fetch full state from backend
  const refreshData = useCallback(async () => {
    try {
      const data = await api.getOverview();
      setSummary(data.summary);
      setZones(data.zones);
      setAlerts(data.recentAlerts);
      setDemoMode(data.settings.demoMode);
      setLastSync(new Date());
      setIsConnected(true);
    } catch (err: any) {
      console.error('Failed to fetch overview data:', err);
      setIsConnected(false);
    }
  }, []);

  // Fetch settings
  const fetchSettings = useCallback(async () => {
    try {
      const s = await api.getSettings();
      setSettings(s);
      setDemoMode(s.demoMode);
    } catch (err) {
      console.error('Failed to fetch settings:', err);
    }
  }, []);

  // Initial load
  useEffect(() => {
    refreshData();
    fetchSettings();
  }, [refreshData, fetchSettings]);

  // Setup Socket.IO real-time subscriptions
  useEffect(() => {
    const socket = socketClient.connect();

    socket.on('connect', () => {
      setIsConnected(true);
      addToast('info', 'System Connected', 'Real-time telemetry stream active.');
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      addToast('warning', 'Connection Interrupted', 'Attempting reconnection to MineGuard server...');
    });

    socket.on('sensor:reading', (reading: SensorReading) => {
      setLastSync(new Date());
      setZones((prevZones) =>
        prevZones.map((z) => {
          if (z.id === reading.zone_id) {
            return {
              ...z,
              status: (reading.status as any) || z.status,
              is_stale: false,
              latest_reading: reading,
            };
          }
          return z;
        })
      );
    });

    socket.on('device:status', (deviceStatus: { deviceId: string; zoneId: string; status: 'ONLINE' | 'OFFLINE' }) => {
      setZones((prevZones) =>
        prevZones.map((z) => {
          if (z.id === deviceStatus.zoneId || z.device_id === deviceStatus.deviceId) {
            return {
              ...z,
              device_status: deviceStatus.status,
              status: deviceStatus.status === 'OFFLINE' ? 'OFFLINE' : z.status,
            };
          }
          return z;
        })
      );
    });

    socket.on('alert:new', (newAlert: Alert) => {
      setAlerts((prev) => [newAlert, ...prev]);

      // Pop toast notification for warnings and critical alerts
      if (newAlert.severity === 'CRITICAL') {
        addToast('critical', `CRITICAL HAZARD - ${newAlert.zone_id}`, newAlert.description);
      } else if (newAlert.severity === 'WARNING') {
        addToast('warning', `Warning Limit Exceeded - ${newAlert.zone_id}`, newAlert.description);
      } else if (newAlert.severity === 'OFFLINE') {
        addToast('warning', `Device Offline - ${newAlert.zone_id}`, newAlert.description);
      }
    });

    socket.on('alert:ack', (ackedAlert: Alert) => {
      setAlerts((prev) => prev.map((a) => (a.id === ackedAlert.id ? ackedAlert : a)));
    });

    socket.on('alert:ack_all', () => {
      setAlerts((prev) => prev.map((a) => ({ ...a, acknowledged: 1 })));
    });

    socket.on('mode:change', (data: { demoMode: boolean }) => {
      setDemoMode(data.demoMode);
      addToast('info', 'Operating Mode Updated', `Switched to ${data.demoMode ? 'DEMO MODE' : 'LIVE HARDWARE MODE'}.`);
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('sensor:reading');
      socket.off('device:status');
      socket.off('alert:new');
      socket.off('alert:ack');
      socket.off('alert:ack_all');
      socket.off('mode:change');
    };
  }, [addToast]);

  // Recalculate summary dynamically whenever zones change
  useEffect(() => {
    if (zones.length === 0) return;

    let active = 0;
    let offline = 0;
    let normal = 0;
    let warning = 0;
    let critical = 0;
    let unknownOrStale = 0;

    zones.forEach((z) => {
      if (z.device_status === 'ONLINE') active++;
      else offline++;

      if (z.is_stale || z.status === 'UNKNOWN') unknownOrStale++;

      if (z.status === 'CRITICAL') critical++;
      else if (z.status === 'WARNING') warning++;
      else if (z.status === 'NORMAL') normal++;
    });

    let overallStatus: OverallSummary['overallStatus'] = 'NORMAL';
    if (critical > 0) overallStatus = 'CRITICAL';
    else if (warning > 0) overallStatus = 'WARNING';
    else if (offline > 0 || unknownOrStale > 0) overallStatus = 'WARNING';

    setSummary({
      overallStatus,
      totalZones: zones.length,
      activeZones: active,
      offlineZones: offline,
      normalZones: normal,
      warningZones: warning,
      criticalZones: critical,
      unknownOrStaleZones: unknownOrStale,
    });
  }, [zones]);

  const toggleDemoMode = async () => {
    try {
      const res = await api.toggleDemoMode(!demoMode);
      setDemoMode(res.demoMode);
      refreshData();
    } catch (err: any) {
      addToast('critical', 'Error', 'Failed to toggle demo mode: ' + err.message);
    }
  };

  const acknowledgeAlert = async (id: number) => {
    try {
      const updated = await api.acknowledgeAlert(id);
      setAlerts((prev) => prev.map((a) => (a.id === id ? updated : a)));
      addToast('success', 'Alert Acknowledged', `Alert #${id} marked as acknowledged.`);
    } catch (err: any) {
      addToast('critical', 'Error', 'Failed to acknowledge alert: ' + err.message);
    }
  };

  const acknowledgeAllAlerts = async () => {
    try {
      await api.acknowledgeAllAlerts();
      setAlerts((prev) => prev.map((a) => ({ ...a, acknowledged: 1 })));
      addToast('success', 'All Alerts Acknowledged', 'All active alerts marked acknowledged.');
    } catch (err: any) {
      addToast('critical', 'Error', 'Failed to acknowledge all alerts: ' + err.message);
    }
  };

  const triggerScenario = async (
    zoneId: string,
    scenario: 'NORMAL' | 'WARNING' | 'CRITICAL' | 'OFFLINE',
    durationSeconds: number = 60
  ) => {
    try {
      await api.triggerScenario(zoneId, scenario, durationSeconds);
      addToast('info', 'Scenario Dispatched', `Applied ${scenario} condition to ${zoneId} for ${durationSeconds}s.`);
    } catch (err: any) {
      addToast('critical', 'Simulation Error', err.message);
    }
  };

  const unreadAlertCount = alerts.filter((a) => a.acknowledged === 0 && (a.severity === 'WARNING' || a.severity === 'CRITICAL' || a.severity === 'OFFLINE')).length;

  return (
    <MineGuardContext.Provider
      value={{
        zones,
        summary,
        alerts,
        unreadAlertCount,
        isConnected,
        demoMode,
        lastSync,
        settings,
        toasts,
        toggleDemoMode,
        refreshData,
        acknowledgeAlert,
        acknowledgeAllAlerts,
        addToast,
        removeToast,
        triggerScenario,
      }}
    >
      {children}
    </MineGuardContext.Provider>
  );
};

export const useMineGuard = () => {
  const context = useContext(MineGuardContext);
  if (!context) {
    throw new Error('useMineGuard must be used within a MineGuardProvider');
  }
  return context;
};
