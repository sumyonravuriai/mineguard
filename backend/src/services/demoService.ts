import { SettingsService } from './settingsService.js';
import { ZoneService } from './zoneService.js';

interface ZoneSimulationState {
  temp: number;
  humidity: number;
  co: number;
  co2: number;
  no2: number;
  trend: number;
  forcedScenario?: 'NORMAL' | 'WARNING' | 'CRITICAL' | 'OFFLINE';
  forcedUntil?: number;
}

export class DemoService {
  private static timer: NodeJS.Timeout | null = null;
  private static tickCount: number = 0;

  // Internal persistent states for realistic smooth transitions
  private static states: Record<string, ZoneSimulationState> = {
    ZONE_01: { temp: 24.2, humidity: 61.5, co: 3.5, co2: 520, no2: 0.12, trend: 1 },
    ZONE_02: { temp: 28.5, humidity: 72.0, co: 12.0, co2: 950, no2: 0.85, trend: 1 },
    ZONE_03: { temp: 31.0, humidity: 79.5, co: 18.5, co2: 1850, no2: 1.45, trend: 1 },
    ZONE_04: { temp: 26.8, humidity: 68.0, co: 8.2, co2: 780, no2: 0.35, trend: 1 },
    ZONE_05: { temp: 29.5, humidity: 55.0, co: 4.8, co2: 610, no2: 0.22, trend: 1 },
    ZONE_06: { temp: 25.1, humidity: 82.5, co: 6.2, co2: 710, no2: 0.28, trend: 1 },
  };

  static start() {
    if (this.timer) clearInterval(this.timer);

    console.log('[DemoService] Starting realistic underground mine sensor simulation...');
    this.timer = setInterval(async () => {
      try {
        await this.tick();
      } catch (err: any) {
        console.error('[DemoService] Tick error:', err.message);
      }
    }, 4000);
  }

  static stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
      console.log('[DemoService] Sensor simulation stopped. System waiting for physical ESP32 telemetry.');
    }
  }

  static triggerScenario(zoneId: string, scenario: 'NORMAL' | 'WARNING' | 'CRITICAL' | 'OFFLINE', durationSeconds: number = 60) {
    if (this.states[zoneId]) {
      this.states[zoneId].forcedScenario = scenario;
      this.states[zoneId].forcedUntil = Date.now() + durationSeconds * 1000;
      console.log(`[DemoService] Triggered scenario ${scenario} on ${zoneId} for ${durationSeconds}s`);
    }
  }

  private static async tick() {
    const settings = SettingsService.getSettings();
    if (!settings.demoMode) return;

    this.tickCount++;
    const nowIso = new Date().toISOString();
    const nowMs = Date.now();

    const zones = [
      { id: 'ZONE_01', deviceId: 'ESP32_ZONE_01' },
      { id: 'ZONE_02', deviceId: 'ESP32_ZONE_02' },
      { id: 'ZONE_03', deviceId: 'ESP32_ZONE_03' },
      { id: 'ZONE_04', deviceId: 'ESP32_ZONE_04' },
      { id: 'ZONE_05', deviceId: 'ESP32_ZONE_05' },
      { id: 'ZONE_06', deviceId: 'ESP32_ZONE_06' },
    ];

    for (const z of zones) {
      const state = this.states[z.id];
      if (!state) continue;

      // Check if temporary forced scenario expired
      if (state.forcedUntil && nowMs > state.forcedUntil) {
        state.forcedScenario = undefined;
        state.forcedUntil = undefined;
      }

      // Check forced scenario
      if (state.forcedScenario === 'OFFLINE') {
        continue;
      }

      // Programmed periodic demonstration: Zone 04 simulates brief packet loss gap
      if (!state.forcedScenario && z.id === 'ZONE_04' && (this.tickCount % 50 >= 40 && this.tickCount % 50 < 45)) {
        continue;
      }

      // Physics-based gentle oscillation
      const drift = (Math.random() - 0.48) * 0.2;
      state.temp = Math.max(20, Math.min(36, state.temp + drift * 0.3));
      state.humidity = Math.max(45, Math.min(95, state.humidity + drift * 0.5));
      state.co = Math.max(1.0, Math.min(60, state.co + drift * 0.4));
      state.co2 = Math.max(400, Math.min(6000, state.co2 + drift * 15));
      state.no2 = Math.max(0.05, Math.min(4.5, state.no2 + drift * 0.04));

      let currentTemp = state.temp;
      let currentHum = state.humidity;
      let currentCo = state.co;
      let currentCo2 = state.co2;
      let currentNo2 = state.no2;

      if (state.forcedScenario === 'CRITICAL') {
        currentCo = 54.0 + (Math.random() * 4);
        currentCo2 = 5200 + Math.random() * 300;
        currentTemp = 34.2 + Math.random() * 0.8;
      } else if (state.forcedScenario === 'WARNING') {
        currentCo = 28.5 + (Math.random() * 3);
        currentCo2 = 2800 + Math.random() * 200;
        currentTemp = 31.2 + Math.random() * 0.5;
      } else if (state.forcedScenario === 'NORMAL') {
        currentCo = 8.0 + Math.random() * 2;
        currentCo2 = 650 + Math.random() * 50;
        currentTemp = 25.5 + Math.random() * 0.5;
      }

      const reading = {
        zone_id: z.id,
        deviceId: z.deviceId,
        temperature: Number(currentTemp.toFixed(1)),
        humidity: Number(currentHum.toFixed(1)),
        co: Number(currentCo.toFixed(1)),
        co2: Math.round(currentCo2),
        no2: Number(currentNo2.toFixed(2)),
        source: 'simulated', // Distinctly flags simulated demo data
        timestamp: nowIso
      };

      await ZoneService.processIncomingReading(reading as any);
    }
  }
}
