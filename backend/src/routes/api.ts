import { Router, Request, Response } from 'express';
import { ZoneService } from '../services/zoneService.js';
import { DeviceService } from '../services/deviceService.js';
import { AlertService } from '../services/alertService.js';
import { AnalyticsService } from '../services/analyticsService.js';
import { SettingsService } from '../services/settingsService.js';
import { DemoService } from '../services/demoService.js';
import { mqttService } from '../services/mqttService.js';
import { socketService } from '../services/socketService.js';

export const apiRouter = Router();

// --- Overview ---
apiRouter.get('/overview', async (req: Request, res: Response) => {
  try {
    const summary = await ZoneService.getOverallMineStatus();
    const zones = await ZoneService.getAllZones();
    const recentAlerts = await AlertService.getAlerts({ limit: 5 });
    const settings = SettingsService.getSettings();
    const mqttStatus = mqttService.getStatus();

    res.json({
      success: true,
      data: {
        summary,
        zones,
        recentAlerts,
        settings: {
          demoMode: settings.demoMode,
          regulatoryStandard: settings.regulatoryStandard,
          disclaimerNotice: settings.disclaimerNotice
        },
        mqttStatus,
        lastSync: new Date().toISOString()
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- Zones ---
apiRouter.get('/zones', async (req: Request, res: Response) => {
  try {
    const zones = await ZoneService.getAllZones();
    res.json({ success: true, data: zones });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.get('/zones/:id', async (req: Request, res: Response) => {
  try {
    const zone = await ZoneService.getZoneById(req.params.id);
    if (!zone) {
      return res.status(404).json({ success: false, error: 'Zone not found' });
    }
    res.json({ success: true, data: zone });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.post('/zones', async (req: Request, res: Response) => {
  try {
    const { id, zone_name, location, device_id } = req.body;
    if (!id || !zone_name) {
      return res.status(400).json({ success: false, error: 'Zone ID and Name are required' });
    }
    const zone = await ZoneService.createZone({ id, zone_name, location, device_id });
    res.status(201).json({ success: true, data: zone });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.put('/zones/:id', async (req: Request, res: Response) => {
  try {
    const zone = await ZoneService.updateZone(req.params.id, req.body);
    if (!zone) {
      return res.status(404).json({ success: false, error: 'Zone not found' });
    }
    res.json({ success: true, data: zone });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.get('/zones/:id/readings', async (req: Request, res: Response) => {
  try {
    const range = (req.query.range as string) || '24h';
    const readings = await ZoneService.getZoneReadings(req.params.id, range);
    res.json({ success: true, data: readings });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- Devices ---
apiRouter.get('/devices', async (req: Request, res: Response) => {
  try {
    const devices = await DeviceService.getDevices();
    res.json({ success: true, data: devices });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.post('/devices', async (req: Request, res: Response) => {
  try {
    const { device_id, assigned_zone, firmware_version, ip_address } = req.body;
    if (!device_id || !assigned_zone) {
      return res.status(400).json({ success: false, error: 'Device ID and Assigned Zone are required' });
    }
    const device = await DeviceService.registerDevice({ device_id, assigned_zone, firmware_version, ip_address });
    res.status(201).json({ success: true, data: device });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.put('/devices/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const updated = await DeviceService.updateDevice(id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Device not found' });
    }
    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.delete('/devices/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const success = await DeviceService.deleteDevice(id);
    if (!success) {
      return res.status(404).json({ success: false, error: 'Device not found' });
    }
    res.json({ success: true, message: 'Device successfully removed' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- Alerts ---
apiRouter.get('/alerts', async (req: Request, res: Response) => {
  try {
    const { severity, zoneId, acknowledged, limit } = req.query;
    const filter: any = {};
    if (severity) filter.severity = String(severity);
    if (zoneId) filter.zoneId = String(zoneId);
    if (acknowledged !== undefined) filter.acknowledged = parseInt(String(acknowledged), 10);
    if (limit) filter.limit = parseInt(String(limit), 10);

    const alerts = await AlertService.getAlerts(filter);
    res.json({ success: true, data: alerts });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.post('/alerts/:id/acknowledge', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const by = req.body.acknowledged_by || 'Control Room Operator';
    const alert = await AlertService.acknowledgeAlert(id, by);
    if (!alert) {
      return res.status(404).json({ success: false, error: 'Alert not found' });
    }
    res.json({ success: true, data: alert });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.post('/alerts/acknowledge-all', async (req: Request, res: Response) => {
  try {
    const by = req.body.acknowledged_by || 'Control Room Operator';
    const result = await AlertService.acknowledgeAllAlerts(by);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- Analytics ---
apiRouter.get('/analytics', async (req: Request, res: Response) => {
  try {
    const range = (req.query.range as string) || '24h';
    const analytics = await AnalyticsService.getAnalytics(range);
    res.json({ success: true, data: analytics });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- Settings ---
apiRouter.get('/settings', (req: Request, res: Response) => {
  try {
    const settings = SettingsService.getSettings();
    res.json({ success: true, data: settings });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.put('/settings', async (req: Request, res: Response) => {
  try {
    const updated = await SettingsService.updateSettings(req.body);
    socketService.emit('settings:update', updated);
    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- Demo Mode Control & Scenario Trigger ---
apiRouter.post('/demo/toggle', async (req: Request, res: Response) => {
  try {
    const current = SettingsService.getSettings();
    const newMode = req.body.demoMode !== undefined ? req.body.demoMode : !current.demoMode;
    await SettingsService.updateSettings({ demoMode: newMode });

    if (newMode) {
      DemoService.start();
    } else {
      DemoService.stop();
    }

    socketService.broadcastModeChange({ demoMode: newMode });
    res.json({ success: true, data: { demoMode: newMode } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.post('/demo/trigger', (req: Request, res: Response) => {
  try {
    const { zoneId, scenario, durationSeconds } = req.body;
    if (!zoneId || !scenario) {
      return res.status(400).json({ success: false, error: 'zoneId and scenario are required' });
    }
    DemoService.triggerScenario(zoneId, scenario, durationSeconds || 60);
    res.json({ success: true, message: `Scenario ${scenario} initiated on ${zoneId}` });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- MQTT & Direct Telemetry Ingestion ---
apiRouter.get('/mqtt/status', (req: Request, res: Response) => {
  res.json({ success: true, data: mqttService.getStatus() });
});

apiRouter.post('/telemetry', async (req: Request, res: Response) => {
  try {
    const reading = await ZoneService.processIncomingReading(req.body);
    if (!reading) {
      return res.status(400).json({ success: false, error: 'Invalid sensor telemetry payload' });
    }
    res.json({ success: true, data: reading });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
