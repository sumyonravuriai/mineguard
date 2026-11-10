# MineGuard — IoT-Based Underground Mine Safety & Regulatory Compliance Monitoring System

> **A Production-Grade Atmospheric Surveillance Platform for Underground Mining Operations**  
> *Engineered for Real Physical ESP32 Hardware Deployment & Public HTTPS Cloud Hosting.*

---

## 🛡️ Executive Summary & Statutory Notice

**MineGuard** is an industrial-grade environmental safety surveillance platform built to safeguard underground mining crews. Interfacing with wireless ESP32 edge transceivers and electrochemical/NDIR gas sensors, MineGuard delivers sub-second early warning telemetry for hazardous toxic gases (CO, NO2), asphyxiants (CO2), heat stress, transceiver dropout, and regulatory compliance breaches.

> **Statutory Notice:** This platform is an advisory supervisory control system aligned with the **Directorate General of Mines Safety (DGMS) Coal Mines Regulations 2017 (Regulation 153)** and **OSHA 29 CFR 1910 Mining Thresholds**. In compliance with mining statutes, this system serves as an early-warning telemetry solution and does not replace statutory certified flame safety lamps or certified methanometer shift sign-offs by certified Overmen and Sirdars.

---

## 🏗️ End-to-End System Architecture

```
+-----------------------------------------------------------------------------------+
|                            PHYSICAL SENSOR LAYER                                  |
|   MQ-7 (CO)  |  MH-Z19C (CO2 NDIR)  |  MiCS-2714 (NO2)  |  DHT22 / SHT31 (Temp/RH) |
+-----------------------------------------------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
|                        ESP32 MICROCONTROLLER NODE                                 |
|  - 12-bit ADC Sampling with Voltage Dividers (3.3V ADC Protection)                |
|  - UART2 Hardware Serial for MH-Z19C NDIR Gas Checksum Verification               |
|  - Automatic Wi-Fi Reconnection & Watchdog Heartbeat (QoS 1)                      |
|  - Null-Serialization for Failed/Unavailable Sensors                              |
+-----------------------------------------------------------------------------------+
                                         | 802.11 b/g/n Wi-Fi
                                         v
+-----------------------------------------------------------------------------------+
|                   CLOUD MQTT BROKER (TCP 1883 / TLS 8883)                         |
|   Topics: mineguard/zones/{zoneId}/sensors   |   mineguard/zones/{zoneId}/heartbeat|
+-----------------------------------------------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
|                   MINEGUARD BACKEND (Node.js + Express)                           |
|  - Dual Persistence: Managed Cloud PostgreSQL (Production) / SQLite (Local)       |
|  - Dynamic Sensor Threshold & Regulatory Breach Evaluation                        |
|  - Device Heartbeat Watchdog & Automatic Stale Detection                          |
|  - Multi-Zone Ingestion & Device Mapping                                          |
+-----------------------------------------------------------------------------------+
                                         |
                       Socket.IO Streams | REST API (/api)
                                         v
+-----------------------------------------------------------------------------------+
|               PUBLIC DASHBOARD (React 18 + Vite + Tailwind CSS)                   |
|  - Live Status Banner & Interactive Underground SVG Mine Map                      |
|  - Multi-Zone Continuous Matrix & Recharts 7-Day Analytical Trends               |
|  - Real Hardware vs Demo vs Stale Indicators                                      |
|  - Responsive on Android, iOS, Tablets, Laptops & Desktops                        |
+-----------------------------------------------------------------------------------+
```

---

## 🚀 Part 1: Public Cloud Deployment Guide

The MineGuard platform is decoupled into a high-performance React + Vite frontend and a persistent Node.js backend. Follow the steps below to deploy the system publicly so it runs 24/7 without requiring a personal computer to stay powered on.

### 1. Database Deployment (Managed PostgreSQL)

For persistent cloud hosting without risk of ephemeral filesystem data loss, use a managed PostgreSQL database.

**Option A: Render Managed PostgreSQL (Recommended)**
1. In your [Render Dashboard](https://dashboard.render.com), click **New +** -> **PostgreSQL**.
2. Name: `mineguard-db`, Database: `mineguard`, Plan: `Free`.
3. Once provisioned, copy the **Internal Database URL** (or **External Database URL**).
4. Format: `postgresql://user:password@host/mineguard?sslmode=require`.

**Option B: Neon or Supabase (Free Tier PostgreSQL)**
1. Create a free project on [Neon.tech](https://neon.tech) or [Supabase.com](https://supabase.com).
2. Copy the connection string into your backend environment variable `DATABASE_URL`.
3. Tables and initial mine zones will seed automatically on initial server startup (or run `backend/src/database/schema.sql`).

---

### 2. Backend Deployment (Render / Cloud Host)

1. Push this repository to your GitHub account (`git push origin main`).
2. In [Render Dashboard](https://dashboard.render.com), click **New +** -> **Web Service**.
3. Connect your repository and select the `backend` directory (Root Directory: `backend`).
4. Set the following settings:
   - **Environment:** `Node`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
   - **Health Check Path:** `/health`
5. Configure the **Environment Variables**:
   ```ini
   NODE_ENV=production
   PORT=10000
   DATABASE_URL=postgresql://your_postgres_connection_string
   MQTT_BROKER_URL=mqtt://broker.emqx.io:1883
   MQTT_TOPIC_PREFIX=mineguard/zones
   HEARTBEAT_TIMEOUT_SECONDS=15
   DEMO_MODE=false
   FRONTEND_URL=https://your-frontend.vercel.app
   ```
6. Click **Deploy Web Service**. Render will provision your public HTTPS URL (e.g., `https://mineguard-backend.onrender.com`).
7. Verify health by opening: `https://your-backend.onrender.com/health`.

---

### 3. Frontend Deployment (Vercel)

The frontend is pre-configured with `vercel.json` for single-page routing, caching headers, and responsive asset delivery.

1. Go to [Vercel](https://vercel.com) and click **Add New** -> **Project**.
2. Import your GitHub repository.
3. Configure the Project:
   - **Framework Preset:** `Vite`
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. Add the **Environment Variables**:
   ```ini
   VITE_API_URL=https://your-backend.onrender.com/api
   VITE_SOCKET_URL=https://your-backend.onrender.com
   ```
5. Click **Deploy**. Vercel will build the frontend and provide your shareable HTTPS link (e.g., `https://mineguard.vercel.app`).
6. Update the `FRONTEND_URL` environment variable on your backend to match this URL for secure CORS.

---

## 📡 Part 2: Real ESP32 Hardware Integration

MineGuard is engineered to ingest telemetry directly from physical microcontrollers.

### 1. Arduino IDE Setup

1. Download and install **Arduino IDE (v2.x)** from [arduino.cc](https://www.arduino.cc/en/software).
2. Open **File** -> **Preferences** and paste this URL into **Additional Boards Manager URLs**:
   ```
   https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
   ```
3. Open **Tools** -> **Board** -> **Boards Manager**, search for `esp32` by *Espressif Systems*, and click **Install**.
4. In **Tools** -> **Board**, select your board (e.g. `ESP32 Dev Module`, `ESP32-WROOM-DA`, or `ESP32S3 Dev Module`).

---

### 2. Required Arduino Libraries

In Arduino IDE, open **Tools** -> **Manage Libraries...** and install:

| Library | Author | Purpose |
|---|---|---|
| **PubSubClient** | Nick O'Leary | MQTT client for Wi-Fi and TLS communication |
| **ArduinoJson** | Benoît Blanchon | High-efficiency JSON payload serialization (v6 or v7) |
| **DHT sensor library** (Optional) | Adafruit | For DHT22 digital temperature & humidity |
| **Adafruit SHT31 Library** (Optional) | Adafruit | For precision I2C digital humidity & temperature |

> **PubSubClient Buffer Note:** The sketch calls `mqttClient.setBufferSize(512);` during `setup()` to accommodate full JSON payloads with sensor arrays.

---

### 3. Hardware Sensor Wiring & Pinout Table

> ⚠️ **CRITICAL ELECTRICAL WARNING (3.3V ADC Protection):**  
> The ESP32 analog-to-digital converter (ADC) pins accept a maximum input of **3.3 Volts**. Connecting 5V analog sensors (such as the raw MQ-7 analog output) directly to ESP32 ADC pins will damage the microcontroller. Use a simple 2-resistor voltage divider (10 kΩ and 20 kΩ) or 3.3V-compatible sensor breakout boards.

| Sensor Model | Target Metric | ESP32 GPIO Pin | Sensor Pin | Operating Voltage | Interface Type | Wiring Notes |
|---|---|---|---|---|---|---|
| **DHT22 (AM2302)** | Temperature & Humidity | **GPIO 23** | DATA / OUT | 3.3V – 5V | 1-Wire Digital | Connect 4.7kΩ or 10kΩ pull-up resistor between VCC and DATA. |
| **SHT31-D** | Temperature & Humidity | **GPIO 21 (SDA)<br>GPIO 22 (SCL)** | SDA<br>SCL | 3.3V | I2C (Address 0x44) | Set `#define USE_SHT31_I2C true` in `config.h`. Connect to 3.3V. |
| **MQ-7** | Carbon Monoxide (CO) | **GPIO 34** (ADC1) | AOUT (Analog) | 5V (Heater)<br>3.3V (Divider) | Analog ADC (12-bit) | Connect 5V to sensor VCC/heater. Connect AOUT through voltage divider to GPIO 34. |
| **MH-Z19C** | Carbon Dioxide (CO2 NDIR) | **GPIO 16 (RX2)<br>GPIO 17 (TX2)** | TXD -> GPIO 16<br>RXD -> GPIO 17 | 5V (Sensor VCC) | Hardware UART2 (9600 8N1) | Cross TX/RX. ESP32 GPIO 16 receives from MH-Z19 TX. 9-byte NDIR command validated with checksum. |
| **MiCS-2714 / MQ-131** | Nitrogen Dioxide (NO2) | **GPIO 35** (ADC1) | AOUT (Analog) | 3.3V – 5V | Analog ADC (12-bit) | Connect analog output to GPIO 35. High impedance, low noise channel. |

---

### 4. Firmware Configuration (`config.h` or `ESP32_Firmware.ino`)

Open `firmware/ESP32_MineGuard/config.h` (or root `ESP32_Firmware.ino`):

```cpp
// 1. Wi-Fi Credentials
#define WIFI_SSID         "YOUR_WIFI_NETWORK"
#define WIFI_PASSWORD     "YOUR_WIFI_PASSWORD"

// 2. Cloud MQTT Broker Configuration
#define MQTT_BROKER       "broker.emqx.io"    // Or HiveMQ Cloud URL
#define MQTT_PORT         1883                // 1883 TCP or 8883 TLS
#define MQTT_USERNAME     ""                  // Optional cloud credentials
#define MQTT_PASSWORD     ""

// 3. Node Identification
#define DEVICE_ID         "ESP32_ZONE_01"     // Unique transceiver node ID
#define ZONE_ID           "ZONE_01"           // Assigned underground mine sector
```

---

### 5. Multi-ESP32 Transceiver Mapping

MineGuard supports an arbitrary number of physical transceivers. To deploy multiple nodes:

| ESP32 Hardware Unit | Assigned Zone ID | Physical Mine Location | MQTT Topic |
|---|---|---|---|
| **Transceiver Node 1** | `ZONE_01` | Portal Shaft, Level 0m (Main Entrance) | `mineguard/zones/ZONE_01/sensors` |
| **Transceiver Node 2** | `ZONE_02` | Drift 4 East, Coal Seam 3 (Mining Section A) | `mineguard/zones/ZONE_02/sensors` |
| **Transceiver Node 3** | `ZONE_03` | Longwall Face 2, Level -250m (Mining Section B) | `mineguard/zones/ZONE_03/sensors` |
| **Transceiver Node 4** | `ZONE_04` | Haulage Crosscut B-9 (Underground Tunnel) | `mineguard/zones/ZONE_04/sensors` |
| **Transceiver Node 5** | `ZONE_05` | Substation & Pump Bay -150m (Equipment Room) | `mineguard/zones/ZONE_05/sensors` |
| **Transceiver Node 6** | `ZONE_06` | Return Airway Return-NW Fan (Ventilation Section) | `mineguard/zones/ZONE_06/sensors` |

Flash each ESP32 by simply updating `DEVICE_ID` and `ZONE_ID` in `config.h` prior to uploading.

---

### 6. Flashing the ESP32

1. Connect the ESP32 to your computer using a micro-USB or USB-C data cable.
2. Select your COM Port under **Tools** -> **Port** (e.g. `COM3` on Windows).
3. Set **Upload Speed** to `921600` or `115200`.
4. Click **Upload** (Right Arrow icon).
5. Open **Tools** -> **Serial Monitor** at baud rate `115200` to inspect startup diagnostics:
   ```
   [Wi-Fi] Connecting to access point: MINE_AP_LEVEL_01
   [Wi-Fi] Connected successfully! IP Address: 192.168.1.145
   [MQTT] Connecting to broker broker.emqx.io:1883 as ESP32_ZONE_01... CONNECTED!
   [HEARTBEAT] Publishing watchdog packet to mineguard/zones/ZONE_01/heartbeat
   [TELEMETRY] Transmitting to mineguard/zones/ZONE_01/sensors:
   {"deviceId":"ESP32_ZONE_01","zoneId":"ZONE_01","temperature":26.8,"humidity":63.5,"co":6.8,"co2":640,"no2":0.22,"source":"hardware"}
   ```

---

## 🧪 Part 3: Testing Without Physical Sensors (CLI Publisher)

You can verify the complete cloud pipeline immediately without connecting physical sensors using the included test script:

```bash
# 1. Normal Atmospheric Telemetry
node scripts/publish-hardware-telemetry.js ZONE_01 normal

# 2. DGMS Warning Limit Breach (Elevated CO: 28.5 ppm, CO2: 2750 ppm)
node scripts/publish-hardware-telemetry.js ZONE_02 warning

# 3. Critical Hazard Evacuation Condition (CO: 54.0 ppm, CO2: 5250 ppm)
node scripts/publish-hardware-telemetry.js ZONE_03 critical

# 4. Sensor Failure / Disconnected Sensor Representation (CO & NO2 unavailable)
node scripts/publish-hardware-telemetry.js ZONE_04 unavailable
```

The script publishes genuine `source: "hardware"` payloads to the cloud MQTT broker. The dashboard will instantly update the target zone with a green `[REAL HARDWARE DATA]` badge!

---

## ⚙️ Part 4: Production Configuration Template

### Backend (`backend/.env` or Render Dashboard)
```ini
# Core Configuration
PORT=5000
NODE_ENV=production

# Public Endpoints
FRONTEND_URL=https://your-mineguard-frontend.vercel.app
BACKEND_URL=https://your-mineguard-backend.onrender.com

# Managed PostgreSQL Database
DATABASE_URL=postgresql://user:password@host/mineguard?sslmode=require

# Cloud MQTT Broker Configuration
MQTT_BROKER_URL=mqtt://broker.emqx.io:1883
MQTT_USERNAME=
MQTT_PASSWORD=
MQTT_CLIENT_ID=mineguard_cloud_server_01
MQTT_TOPIC_PREFIX=mineguard/zones

# Heartbeat & Operating Mode
HEARTBEAT_TIMEOUT_SECONDS=15
DEMO_MODE=false
```

### Frontend (`frontend/.env` or Vercel Dashboard)
```ini
# Backend API Base (points to Render web service)
VITE_API_URL=https://your-mineguard-backend.onrender.com/api

# WebSocket Server Endpoint
VITE_SOCKET_URL=https://your-mineguard-backend.onrender.com
```

---

## 🔧 Troubleshooting Guide

| Issue / Symptom | Root Cause | Resolution |
|---|---|---|
| **ESP32 prints `rc=-2` during MQTT connect** | Network unreachable or broker port blocked | Verify Wi-Fi internet connection; ensure port 1883 or 8883 is allowed by your network firewall. |
| **ESP32 prints `rc=4` or `rc=5` during MQTT connect** | Bad credentials or unauthorized client | Check `MQTT_USERNAME` and `MQTT_PASSWORD` in `config.h` matching your broker configuration. |
| **Sensor card shows `UNAVAILABLE`** | Physical sensor disconnected or line floating | Check wiring; verify pull-up resistors on DHT22 or I2C SDA/SCL lines. |
| **Zone shows `STALE TELEMETRY / OFFLINE`** | Transceiver halted or heartbeat timed out | Check power supply to ESP32; verify Wi-Fi signal strength in the shaft area. |
| **CORS error in browser console** | Backend `FRONTEND_URL` does not match frontend domain | Add your frontend Vercel URL to `FRONTEND_URL` in backend environment variables. |
| **Data lost after backend restart** | Ephemeral container storage | Supply a managed PostgreSQL connection string via `DATABASE_URL`. |

---

## 📜 Regulatory Standards Reference

- **DGMS Coal Mines Regulations 2017 (Regulation 153):** Standards of ventilation, statutory gas testing, maximum permissible CO and CO2 limits.
- **OSHA 29 CFR 1910.1000 Table Z-1:** Permissible Exposure Limits (PEL) for Carbon Monoxide (50 ppm TWA) and Nitrogen Dioxide (5 ppm Ceiling).
- **Advisory Prototype Notice:** This system is an IoT engineering surveillance solution designed for advisory monitoring and early warning, operating alongside certified statutory mine safety apparatus.
