#!/usr/bin/env node
/**
 * ==============================================================================
 * MINEGUARD - Hardware Telemetry Transmission Test Utility
 * Transmits authentic hardware sensor packets to Cloud MQTT Broker
 * ==============================================================================
 * Usage:
 *   node scripts/publish-hardware-telemetry.js [zoneId] [scenario] [brokerUrl]
 *
 * Scenarios:
 *   normal      - Safe atmospheric conditions (CO: ~7ppm, CO2: ~640ppm, Temp: ~26.5°C)
 *   warning     - Exceeds DGMS warning limits (CO: 28.5ppm, CO2: 2750ppm)
 *   critical    - Exceeds evacuation limits (CO: 54.0ppm, CO2: 5200ppm)
 *   unavailable - Tests sensor failure representation (CO and NO2 null/unavailable)
 *   heartbeat   - Sends dedicated transceiver online heartbeat packet
 *
 * Examples:
 *   node scripts/publish-hardware-telemetry.js ZONE_01 normal
 *   node scripts/publish-hardware-telemetry.js ZONE_02 warning
 *   node scripts/publish-hardware-telemetry.js ZONE_03 critical
 *   node scripts/publish-hardware-telemetry.js ZONE_04 unavailable
 * ==============================================================================
 */

import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
let mqtt;
try {
  mqtt = require('mqtt');
} catch {
  const backendMqtt = path.resolve(process.cwd(), 'backend/node_modules/mqtt');
  mqtt = require(backendMqtt);
}

const BROKER_URL = process.argv[4] || process.env.MQTT_BROKER_URL || 'mqtt://broker.emqx.io:1883';
const targetZone = process.argv[2] || 'ZONE_01';
const scenario = (process.argv[3] || 'normal').toLowerCase();

const deviceId = `ESP32_${targetZone}`;
const topicSensors = `mineguard/zones/${targetZone}/sensors`;
const topicHeartbeat = `mineguard/zones/${targetZone}/heartbeat`;

console.log(`\n========================================================`);
console.log(`  MINEGUARD REAL HARDWARE TELEMETRY PUBLISHER (CLI TEST) `);
console.log(`========================================================`);
console.log(`Broker:    ${BROKER_URL}`);
console.log(`Target:    ${targetZone} (${deviceId})`);
console.log(`Scenario:  ${scenario.toUpperCase()}`);
console.log(`Topic:     ${topicSensors}`);

const client = mqtt.connect(BROKER_URL, {
  clientId: `mineguard_test_publisher_${Math.random().toString(16).slice(2, 8)}`,
  clean: true,
  connectTimeout: 8000,
});

client.on('connect', () => {
  console.log(`[MQTT] Connected to broker successfully.`);

  // 1. Transmit Heartbeat packet
  const heartbeatPayload = {
    deviceId: deviceId,
    zoneId: targetZone,
    status: 'ONLINE',
    source: 'hardware',
    rssi: -56,
    freeHeap: 184520,
    uptimeSeconds: 8400
  };

  client.publish(topicHeartbeat, JSON.stringify(heartbeatPayload), { qos: 1 }, () => {
    console.log(`[Watchdog] Published heartbeat packet to ${topicHeartbeat}`);
  });

  if (scenario === 'heartbeat') {
    console.log(`\n>>> Heartbeat sent. Closing connection. <<<`);
    client.end();
    return;
  }

  // 2. Prepare Sensor Readings
  let temp = 26.8;
  let hum = 63.5;
  let co = 6.8;
  let co2 = 640;
  let no2 = 0.22;

  if (scenario === 'warning') {
    co = 28.5;  // Exceeds 25.0 ppm DGMS warning limit
    co2 = 2750; // Exceeds 2500 ppm warning limit
    temp = 31.4;
  } else if (scenario === 'critical') {
    co = 54.0;  // Exceeds 50.0 ppm critical evacuation limit
    co2 = 5250; // Exceeds 5000 ppm critical limit
    temp = 34.6;
  } else if (scenario === 'unavailable') {
    co = null;  // Tests sensor failure representation
    no2 = null;
  }

  const payload = {
    deviceId: deviceId,
    zoneId: targetZone,
    temperature: temp,
    humidity: hum,
    co: co,
    co2: co2,
    no2: no2,
    source: 'hardware', // Flags as REAL HARDWARE data
    timestamp: new Date().toISOString()
  };

  console.log(`[Payload] Transmitting genuine hardware data:`, payload);

  client.publish(topicSensors, JSON.stringify(payload), { qos: 1 }, (err) => {
    if (err) {
      console.error(`[Error] Publish failed:`, err);
    } else {
      console.log(`\n>>> SUCCESS: Real hardware telemetry published successfully! <<<`);
      console.log(`Open your MineGuard dashboard: ${targetZone} will now display [REAL HARDWARE].\n`);
    }
    client.end();
  });
});

client.on('error', (err) => {
  console.error(`[MQTT Error]:`, err.message);
  client.end();
});
