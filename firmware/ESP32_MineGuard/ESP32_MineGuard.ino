/*
  ================================================================================
  MINEGUARD - Production ESP32 Underground Mine Safety Transceiver Node
  Compatible with: ESP32-WROOM-32, ESP32-S3, ESP32-C3
  Protocol: Wi-Fi (802.11 b/g/n) -> Cloud MQTT Broker -> MineGuard Platform
  ================================================================================
*/

#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

#include "config.h"
#include "SensorDrivers.h"

#if USE_TLS_MQTT
#include <WiFiClientSecure.h>
WiFiClientSecure espClient;
#else
WiFiClient espClient;
#endif

PubSubClient mqttClient(espClient);

// Timing variables
unsigned long lastSensorPublishTime = 0;
unsigned long lastHeartbeatPublishTime = 0;
unsigned long lastMqttRetryTime = 0;

// Topic Buffers
char topicSensors[96];
char topicHeartbeat[96];

void setupTopics() {
  snprintf(topicSensors, sizeof(topicSensors), "mineguard/zones/%s/sensors", ZONE_ID);
  snprintf(topicHeartbeat, sizeof(topicHeartbeat), "mineguard/zones/%s/heartbeat", ZONE_ID);
}

void connectWiFi() {
  if (WiFi.status() == WL_CONNECTED) return;

  Serial.println();
  Serial.print("[Wi-Fi] Connecting to access point: ");
  Serial.println(WIFI_SSID);

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 25) {
    delay(400);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n[Wi-Fi] Connected successfully!");
    Serial.print("[Wi-Fi] Transceiver IP Address: ");
    Serial.println(WiFi.localIP());
    Serial.print("[Wi-Fi] Signal Strength (RSSI): ");
    Serial.print(WiFi.RSSI());
    Serial.println(" dBm");
  } else {
    Serial.println("\n[Wi-Fi] Initial Wi-Fi attempt timed out. Non-blocking reconnect active.");
  }
}

void connectMQTT() {
  if (mqttClient.connected()) return;
  if (WiFi.status() != WL_CONNECTED) return;

  unsigned long now = millis();
  if (now - lastMqttRetryTime < 5000) return; // Non-blocking 5s retry throttle
  lastMqttRetryTime = now;

  Serial.print("[MQTT] Connecting to broker ");
  Serial.print(MQTT_BROKER);
  Serial.print(":");
  Serial.print(MQTT_PORT);
  Serial.print(" as ");
  Serial.print(DEVICE_ID);
  Serial.print("... ");

  // Client ID with unique hardware MAC suffix for collision avoidance
  String clientId = String(DEVICE_ID) + "_" + String((uint32_t)ESP.getEfuseMac(), HEX);

  bool connected = false;
  if (strlen(MQTT_USERNAME) > 0) {
    connected = mqttClient.connect(clientId.c_str(), MQTT_USERNAME, MQTT_PASSWORD);
  } else {
    connected = mqttClient.connect(clientId.c_str());
  }

  if (connected) {
    Serial.println("CONNECTED!");
    // Transmit initial heartbeat immediately
    publishHeartbeat();
  } else {
    Serial.print("FAILED (state rc=");
    Serial.print(mqttClient.state());
    Serial.println("). Retrying in 5 seconds...");
  }
}

void publishTelemetry() {
  EnvironmentalReadings data = sensors.readAll();

  // Create JSON document matching MineGuard Contract:
  // Missing or failed sensor readings are encoded as null (not zero!)
  StaticJsonDocument<384> doc;
  doc["deviceId"] = DEVICE_ID;
  doc["zoneId"]   = ZONE_ID;

  if (data.tempValid) doc["temperature"] = serialized(String(data.temperature, 1));
  else doc["temperature"] = nullptr;

  if (data.humValid) doc["humidity"] = serialized(String(data.humidity, 1));
  else doc["humidity"] = nullptr;

  if (data.coValid) doc["co"] = serialized(String(data.co, 1));
  else doc["co"] = nullptr;

  if (data.co2Valid) doc["co2"] = (int)data.co2;
  else doc["co2"] = nullptr;

  if (data.no2Valid) doc["no2"] = serialized(String(data.no2, 2));
  else doc["no2"] = nullptr;

  doc["source"] = "hardware"; // Distinguishes real hardware from demo simulator
  doc["timestamp"] = "";      // Authoritative UTC assigned by backend if blank

  char buffer[384];
  size_t bytes = serializeJson(doc, buffer);

  Serial.print("[TELEMETRY] Transmitting to ");
  Serial.print(topicSensors);
  Serial.print(" (");
  Serial.print(bytes);
  Serial.println(" bytes):");
  Serial.println(buffer);

  mqttClient.publish(topicSensors, buffer, false);
}

void publishHeartbeat() {
  StaticJsonDocument<256> doc;
  doc["deviceId"]      = DEVICE_ID;
  doc["zoneId"]        = ZONE_ID;
  doc["status"]        = "ONLINE";
  doc["source"]        = "hardware";
  doc["rssi"]          = WiFi.RSSI();
  doc["freeHeap"]      = ESP.getFreeHeap();
  doc["uptimeSeconds"] = millis() / 1000;

  char buffer[256];
  serializeJson(doc, buffer);

  Serial.print("[HEARTBEAT] Publishing watchdog packet to ");
  Serial.println(topicHeartbeat);

  mqttClient.publish(topicHeartbeat, buffer, false);
}

void setup() {
  Serial.begin(SERIAL_BAUD_RATE);
  delay(500);

  Serial.println("\n========================================================");
  Serial.println("   MINEGUARD INDUSTRIAL ESP32 UNDERGROUND NODE FIRMWARE  ");
  Serial.print("   Node ID:  "); Serial.println(DEVICE_ID);
  Serial.print("   Zone ID:  "); Serial.println(ZONE_ID);
  Serial.println("========================================================");

  setupTopics();
  sensors.begin();

#if USE_TLS_MQTT
  espClient.setInsecure(); // Permits cloud MQTT brokers with self-signed or CA certs
#endif

  mqttClient.setServer(MQTT_BROKER, MQTT_PORT);
  mqttClient.setBufferSize(512);

  connectWiFi();
}

void loop() {
  // Keep Wi-Fi connected
  if (WiFi.status() != WL_CONNECTED) {
    connectWiFi();
  }

  // Keep MQTT connected
  if (WiFi.status() == WL_CONNECTED) {
    if (!mqttClient.connected()) {
      connectMQTT();
    } else {
      mqttClient.loop();
    }
  }

  unsigned long currentMillis = millis();

  // 1. Regular Environmental Sensor Readings Transmission Cycle (every 3s)
  if (currentMillis - lastSensorPublishTime >= SENSOR_INTERVAL_MS) {
    lastSensorPublishTime = currentMillis;
    if (mqttClient.connected()) {
      publishTelemetry();
    }
  }

  // 2. Periodic Heartbeat Watchdog Transmission (every 10s)
  if (currentMillis - lastHeartbeatPublishTime >= HEARTBEAT_INTERVAL_MS) {
    lastHeartbeatPublishTime = currentMillis;
    if (mqttClient.connected()) {
      publishHeartbeat();
    }
  }
}
