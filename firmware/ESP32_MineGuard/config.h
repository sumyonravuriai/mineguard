#ifndef MINEGUARD_CONFIG_H
#define MINEGUARD_CONFIG_H

// ==============================================================================
// MINEGUARD ESP32 INDUSTRIAL HARDWARE CONFIGURATION
// ==============================================================================

// 1. Underground Wi-Fi Network Credentials
// Configure with your local Wi-Fi router / smartphone hotspot:
#define WIFI_SSID             "MINE_AP_LEVEL_01"
#define WIFI_PASSWORD         "MineSafety2026"

// 2. Cloud MQTT Broker Configuration
// For public testing: broker.emqx.io (Port 1883) or broker.hivemq.com (Port 1883)
// For production TLS: your-cluster.hivemq.cloud (Port 8883 with username & password)
#define MQTT_BROKER           "broker.emqx.io"
#define MQTT_PORT             1883
#define MQTT_USERNAME         ""             // Required for HiveMQ Cloud; leave blank for open broker
#define MQTT_PASSWORD         ""             // Required for HiveMQ Cloud; leave blank for open broker
#define USE_TLS_MQTT          false          // Set true to use port 8883 TLS (WiFiClientSecure)

// 3. Node & Zone Identification
// Each physical ESP32 transceiver is assigned to a specific mine sector:
// Examples:
//   "ESP32_ZONE_01" -> "ZONE_01" (Main Entrance / Shaft Portal)
//   "ESP32_ZONE_02" -> "ZONE_02" (Mining Section A)
//   "ESP32_ZONE_03" -> "ZONE_03" (Mining Section B)
//   "ESP32_ZONE_04" -> "ZONE_04" (Underground Tunnel Crosscut)
//   "ESP32_ZONE_05" -> "ZONE_05" (Substation & Pump Bay)
//   "ESP32_ZONE_06" -> "ZONE_06" (Ventilation Section / Exhaust Fan)
#define DEVICE_ID             "ESP32_ZONE_01"
#define ZONE_ID               "ZONE_01"

// 4. Transmission & Watchdog Timing (Milliseconds)
#define SENSOR_INTERVAL_MS    3000           // Sensor acquisition & transmit interval (3s)
#define HEARTBEAT_INTERVAL_MS 10000          // Watchdog heartbeat packet interval (10s)
#define SERIAL_BAUD_RATE      115200

// 5. Hardware Sensor Selection & Communication Protocol
// Temperature & Humidity Sensor:
#define USE_SHT31_I2C         false          // Set true for Sensirion SHT31-D (I2C); false for DHT22
#define PIN_DHT_DATA          23             // Digital pin for DHT22 single-wire bus
#define PIN_I2C_SDA           21             // ESP32 default I2C Data
#define PIN_I2C_SCL           22             // ESP32 default I2C Clock

// Carbon Monoxide (CO) Sensor:
// MQ-7 requires 5V supply. ATTENTION: Use a resistor voltage divider (10k / 20k)
// to drop 5V analog output to max 3.3V for ESP32 ADC input protection!
#define PIN_MQ7_ANALOG        34             // ESP32 ADC1_CH6 (Input only, low noise)
#define MQ7_RL_VALUE          10.0           // Load resistor in kOhms on breakout module
#define MQ7_R0_CLEAN_AIR      3.3            // Calibrated R0 resistance in clean air

// Carbon Dioxide (CO2) Sensor:
// MH-Z19C NDIR Optical Sensor uses UART Serial2
#define PIN_MHZ19_RX          16             // Connect to MH-Z19C TX pin
#define PIN_MHZ19_TX          17             // Connect to MH-Z19C RX pin

// Nitrogen Dioxide (NO2) Sensor:
// MiCS-2714 or MQ-131 / MQ-135 analog breakout
#define PIN_NO2_ANALOG        35             // ESP32 ADC1_CH7 (Input only)
#define NO2_SENSITIVITY_SLOPE 0.75           // Calibrated ppm/volt slope

#endif // MINEGUARD_CONFIG_H
