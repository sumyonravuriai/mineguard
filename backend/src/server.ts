import express from 'express';
import cors from 'cors';
import { createServer } from 'node:http';
import dotenv from 'dotenv';
import { initDatabase, db } from './database/db.js';
import { socketService } from './services/socketService.js';
import { mqttService } from './services/mqttService.js';
import { DeviceService } from './services/deviceService.js';
import { DemoService } from './services/demoService.js';
import { SettingsService } from './services/settingsService.js';
import { apiRouter } from './routes/api.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 5000;

// Dynamic CORS configuration supporting Vercel previews, production domains, and localhost
const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  process.env.FRONTEND_URL || '',
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, ESP32 curl, or direct tools)
    if (!origin) return callback(null, true);
    if (allowedOrigins.length === 0 || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
      return callback(null, true);
    }
    // Fallback for public demonstration: allow all
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));

app.use(express.json());

// Detailed Production Health-Check Endpoint
app.get(['/health', '/api/health'], async (req, res) => {
  try {
    const mqttStatus = mqttService.getStatus();
    const zoneCountRow = await db.queryOne<{ count: string | number }>('SELECT COUNT(*) as count FROM zones');
    const readingCountRow = await db.queryOne<{ count: string | number }>('SELECT COUNT(*) as count FROM sensor_readings');

    res.json({
      status: 'ONLINE',
      system: 'MineGuard Underground Atmospheric Safety Platform',
      version: '1.2.0-cloud',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.round(process.uptime()),
      database: {
        type: db.isPostgres ? 'postgres-managed-persistent' : 'sqlite-persistent',
        totalZones: Number(zoneCountRow?.count || 0),
        totalReadings: Number(readingCountRow?.count || 0)
      },
      mqtt: {
        connected: mqttStatus.connected,
        brokerUrl: mqttStatus.brokerUrl,
        lastMessageTime: mqttStatus.lastMessageTime,
        lastSource: mqttStatus.lastSource
      },
      operatingMode: SettingsService.getSettings().demoMode ? 'DEMO' : 'LIVE'
    });
  } catch (err: any) {
    res.status(500).json({ status: 'ERROR', message: err.message });
  }
});

// Initialize system asynchronously
async function bootstrap() {
  try {
    console.log('[Database] Initializing persistent database & schema...');
    await initDatabase();

    console.log('[SettingsService] Loading configuration...');
    await SettingsService.init();

    // Initialize Socket.IO with WebSocket + polling transports
    socketService.init(httpServer);

    // Mount API routes
    app.use('/api', apiRouter);

    // Start background services
    console.log('[DeviceService] Starting device heartbeat watchdog...');
    DeviceService.startHeartbeatMonitor();

    console.log('[MQTT] Initializing MQTT client...');
    mqttService.init();

    const settings = SettingsService.getSettings();
    if (settings.demoMode) {
      console.log('[DemoMode] Demo simulator active. Starting physics-based sensor drift...');
      DemoService.start();
    } else {
      console.log('[LiveMode] Demo mode paused. System waiting for physical ESP32 telemetry.');
    }

    // Start HTTP server
    httpServer.listen(PORT, () => {
      console.log(`====================================================`);
      console.log(`  MINEGUARD PRODUCTION BACKEND RUNNING ON PORT ${PORT}`);
      console.log(`  Health Check: http://localhost:${PORT}/health`);
      console.log(`  API Base:     http://localhost:${PORT}/api/overview`);
      console.log(`  Database:     ${db.isPostgres ? 'PostgreSQL (Managed Cloud)' : 'SQLite'}`);
      console.log(`====================================================`);
    });
  } catch (err: any) {
    console.error('[Server] Critical fatal bootstrap error:', err);
    process.exit(1);
  }
}

bootstrap();

// Graceful shutdown on SIGTERM (cloud hosting) and SIGINT (Ctrl+C)
const handleShutdown = (signal: string) => {
  console.log(`\n[Server] Received ${signal}. Shutting down gracefully...`);
  DemoService.stop();
  DeviceService.stopHeartbeatMonitor();
  httpServer.close(() => {
    console.log('[Server] HTTP and Socket.IO server closed.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));
