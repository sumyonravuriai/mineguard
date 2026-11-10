#ifndef SENSOR_DRIVERS_H
#define SENSOR_DRIVERS_H

#include <Arduino.h>

// Environmental sensor telemetry readings structure
// When a sensor fails or is disconnected, its value is NAN and its Valid flag is false.
struct EnvironmentalReadings {
  float temperature;   // Ambient temperature (°C)
  float humidity;      // Relative humidity (% RH)
  float co;            // Carbon Monoxide (ppm CO)
  float co2;           // Carbon Dioxide (ppm CO2)
  float no2;           // Nitrogen Dioxide (ppm NO2)
  bool  tempValid;
  bool  humValid;
  bool  coValid;
  bool  co2Valid;
  bool  no2Valid;
};

class SensorSuite {
public:
  void begin();
  EnvironmentalReadings readAll();

  // Individual Sensor Driver Routines
  float readTemperature();
  float readHumidity();
  float readCO();
  float readCO2();
  float readNO2();

private:
  float readDHT_Temp();
  float readDHT_Hum();
  float readSHT31_Temp();
  float readSHT31_Hum();
  float readMQ7_CO();
  float readMHZ19_CO2();
  float readAnalog_NO2();

  bool sht31Available = false;
  bool mhz19Available = false;
};

extern SensorSuite sensors;

#endif // SENSOR_DRIVERS_H
