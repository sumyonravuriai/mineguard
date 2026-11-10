import mqtt, { MqttClient, IClientOptions } from 'mqtt';
import { SettingsService } from './settingsService.js';
import { ZoneService } from './zoneService.js';
import { DeviceService } from './deviceService.js';

class MqttService {
  private client: MqttClient | null = null;
  public isConnected: boolean = false;
  public lastMessageTime: string | null = null;
  public brokerUrl: string = '';
  public lastSource: 'hardware' | 'simulated' | null = null;

  init() {
    const settings = SettingsService.getSettings();
    this.brokerUrl = process.env.MQTT_BROKER_URL || settings.mqttBrokerUrl || 'mqtt://broker.emqx.io:1883';

    try {
      console.log(`[MQTT] Connecting to broker: ${this.brokerUrl}...`);
      
      const options: IClientOptions = {
        clientId: process.env.MQTT_CLIENT_ID || `mineguard_server_${Math.random().toString(16).substring(2, 8)}`,
        clean: true,
        connectTimeout: 10000,
        reconnectPeriod: 5000,
        rejectUnauthorized: false // TLS certificate validation option for cloud brokers
      };

      if (process.env.MQTT_USERNAME) {
        options.username = process.env.MQTT_USERNAME;
      }
      if (process.env.MQTT_PASSWORD) {
        options.password = process.env.MQTT_PASSWORD;
      }

      this.client = mqtt.connect(this.brokerUrl, options);

      this.client.on('connect', () => {
        this.isConnected = true;
        console.log(`[MQTT] Connected successfully to ${this.brokerUrl}`);

        // Subscribe to sensor telemetry topics
        const sensorTopic = 'mineguard/zones/+/sensors';
        this.client?.subscribe(sensorTopic, { qos: 1 }, (err) => {
          if (err) {
            console.error(`[MQTT] Subscription error for ${sensorTopic}:`, err);
          } else {
            console.log(`[MQTT] Subscribed to telemetry pattern: ${sensorTopic}`);
          }
        });

        // Subscribe to dedicated heartbeat topics
        const heartbeatTopic = 'mineguard/zones/+/heartbeat';
        this.client?.subscribe(heartbeatTopic, { qos: 1 }, (err) => {
          if (!err) console.log(`[MQTT] Subscribed to heartbeat pattern: ${heartbeatTopic}`);
        });

        // Subscribe to root telemetry announcement
        this.client?.subscribe('mineguard/telemetry', { qos: 1 });
      });

      this.client.on('message', async (topic: string, message: Buffer) => {
        try {
          await this.handleMessage(topic, message.toString());
        } catch (err: any) {
          console.error(`[MQTT] Message handler error:`, err.message);
        }
      });

      this.client.on('error', (err) => {
        console.error(`[MQTT] Client error:`, err.message);
        this.isConnected = false;
      });

      this.client.on('offline', () => {
        this.isConnected = false;
        console.warn(`[MQTT] Broker connection lost/offline`);
      });

      this.client.on('reconnect', () => {
        console.log(`[MQTT] Attempting reconnection to broker...`);
      });
    } catch (err: any) {
      console.error(`[MQTT] Failed to initialize MQTT client:`, err.message);
      this.isConnected = false;
    }
  }

  private async handleMessage(topic: string, payloadStr: string) {
    this.lastMessageTime = new Date().toISOString();
    try {
      const data = JSON.parse(payloadStr);

      const zoneId = String(data.zoneId || data.zone_id || '');
      const deviceId = String(data.deviceId || data.device_id || '');

      if (!zoneId || !deviceId) {
        console.warn(`[MQTT] Ignored payload with missing zoneId or deviceId on topic ${topic}`);
        return;
      }

      // 1. Dedicated Heartbeat packet
      if (topic.endsWith('/heartbeat')) {
        await DeviceService.recordHeartbeat(deviceId, zoneId);
        return;
      }

      // 2. Sensor reading packet
      this.lastSource = data.source === 'simulated' ? 'simulated' : 'hardware';

      const reading = {
        zone_id: zoneId,
        deviceId: deviceId,
        temperature: data.temperature !== undefined && data.temperature !== null ? Number(data.temperature) : null,
        humidity: data.humidity !== undefined && data.humidity !== null ? Number(data.humidity) : null,
        co: data.co !== undefined && data.co !== null ? Number(data.co) : null,
        co2: data.co2 !== undefined && data.co2 !== null ? Number(data.co2) : null,
        no2: data.no2 !== undefined && data.no2 !== null ? Number(data.no2) : null,
        source: this.lastSource,
        timestamp: data.timestamp || new Date().toISOString()
      };

      await ZoneService.processIncomingReading(reading as any);
    } catch (err: any) {
      console.error(`[MQTT] Error parsing incoming message on ${topic}:`, err.message);
    }
  }

  publish(topic: string, message: object) {
    if (this.client && this.isConnected) {
      this.client.publish(topic, JSON.stringify(message), { qos: 1 });
    }
  }

  getStatus() {
    return {
      connected: this.isConnected,
      brokerUrl: this.brokerUrl,
      lastMessageTime: this.lastMessageTime,
      lastSource: this.lastSource,
      subscribedTopics: [
        'mineguard/zones/+/sensors',
        'mineguard/zones/+/heartbeat',
        'mineguard/telemetry'
      ]
    };
  }
}

export const mqttService = new MqttService();
