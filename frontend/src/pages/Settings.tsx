import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Shield,
  Sliders,
  Radio,
  Clock,
  Bell,
  Users,
  Save,
  RotateCcw,
  CheckCircle2,
  Info,
  Lock,
  ExternalLink,
} from 'lucide-react';
import { useMineGuard } from '../context/MineGuardContext';
import { api } from '../services/api';
import { AppSettings, SensorThresholds } from '../types';

export const Settings: React.FC = () => {
  const { settings, addToast } = useMineGuard();
  const [activeTab, setActiveTab] = useState<'thresholds' | 'heartbeat' | 'mqtt' | 'regulatory' | 'notifications' | 'users'>('thresholds');

  const [thresholds, setThresholds] = useState<SensorThresholds>({
    temperature: { warning: 30.5, critical: 33.5, unit: '°C', minNormal: 18.0 },
    humidity: { warning: 85.0, critical: 92.0, unit: '%' },
    co: { warning: 25.0, critical: 50.0, unit: 'ppm' },
    co2: { warning: 2500, critical: 5000, unit: 'ppm' },
    no2: { warning: 2.0, critical: 3.0, unit: 'ppm' },
  });

  const [heartbeatTimeout, setHeartbeatTimeout] = useState<number>(15);
  const [mqttBrokerUrl, setMqttBrokerUrl] = useState<string>('mqtt://broker.emqx.io:1883');
  const [mqttTopicPrefix, setMqttTopicPrefix] = useState<string>('mineguard/zones');
  const [regulatoryStandard, setRegulatoryStandard] = useState<string>('DGMS (India) Coal Mines Regulations 2017 & OSHA 1910 Mining Thresholds');

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings) {
      if (settings.thresholds) setThresholds(settings.thresholds);
      if (settings.heartbeatTimeoutSeconds) setHeartbeatTimeout(settings.heartbeatTimeoutSeconds);
      if (settings.mqttBrokerUrl) setMqttBrokerUrl(settings.mqttBrokerUrl);
      if (settings.mqttTopicPrefix) setMqttTopicPrefix(settings.mqttTopicPrefix);
      if (settings.regulatoryStandard) setRegulatoryStandard(settings.regulatoryStandard);
    }
  }, [settings]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.updateSettings({
        thresholds,
        heartbeatTimeoutSeconds: heartbeatTimeout,
        mqttBrokerUrl,
        mqttTopicPrefix,
        regulatoryStandard,
      });
      addToast('success', 'Settings Persisted', 'System safety thresholds & operational parameters saved.');
    } catch (err: any) {
      addToast('critical', 'Save Error', err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleResetDefaults = () => {
    setThresholds({
      temperature: { warning: 30.5, critical: 33.5, unit: '°C', minNormal: 18.0 },
      humidity: { warning: 85.0, critical: 92.0, unit: '%' },
      co: { warning: 25.0, critical: 50.0, unit: 'ppm' },
      co2: { warning: 2500, critical: 5000, unit: 'ppm' },
      no2: { warning: 2.0, critical: 3.0, unit: 'ppm' },
    });
    setHeartbeatTimeout(15);
    setMqttBrokerUrl('mqtt://broker.emqx.io:1883');
    setMqttTopicPrefix('mineguard/zones');
    addToast('info', 'Defaults Restored', 'Thresholds reset to statutory DGMS/OSHA benchmarks.');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-mine-textPrimary">
            System & Safety Regulatory Settings
          </h2>
          <p className="text-xs text-mine-textSecondary mt-0.5">
            Configure atmospheric alarm thresholds, edge transceiver heartbeats, and IoT communication protocols
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-mine-textSecondary hover:text-white rounded-xl hover:bg-mine-cardSec transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Standards</span>
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-mine-info hover:bg-mine-info/90 rounded-xl shadow-lg shadow-mine-info/20 transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Persisting...' : 'Save All Changes'}</span>
          </button>
        </div>
      </div>

      {/* Main Settings Card with Left Tabs and Right Content */}
      <div className="rounded-2xl bg-mine-card border border-mine-border shadow-xl overflow-hidden flex flex-col md:flex-row">
        {/* Navigation Tabs */}
        <div className="w-full md:w-64 bg-[#0E1526] p-3 border-r border-mine-border flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-visible shrink-0">
          <button
            onClick={() => setActiveTab('thresholds')}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-left transition-all whitespace-nowrap ${
              activeTab === 'thresholds'
                ? 'bg-mine-info text-white shadow-md'
                : 'text-mine-textSecondary hover:text-white hover:bg-mine-cardSec'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Gas & Temp Thresholds</span>
          </button>

          <button
            onClick={() => setActiveTab('heartbeat')}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-left transition-all whitespace-nowrap ${
              activeTab === 'heartbeat'
                ? 'bg-mine-info text-white shadow-md'
                : 'text-mine-textSecondary hover:text-white hover:bg-mine-cardSec'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Heartbeat & Offline Logic</span>
          </button>

          <button
            onClick={() => setActiveTab('mqtt')}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-left transition-all whitespace-nowrap ${
              activeTab === 'mqtt'
                ? 'bg-mine-info text-white shadow-md'
                : 'text-mine-textSecondary hover:text-white hover:bg-mine-cardSec'
            }`}
          >
            <Radio className="w-4 h-4" />
            <span>MQTT Broker Config</span>
          </button>

          <button
            onClick={() => setActiveTab('regulatory')}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-left transition-all whitespace-nowrap ${
              activeTab === 'regulatory'
                ? 'bg-mine-info text-white shadow-md'
                : 'text-mine-textSecondary hover:text-white hover:bg-mine-cardSec'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Regulatory Standards</span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-left transition-all whitespace-nowrap ${
              activeTab === 'users'
                ? 'bg-mine-info text-white shadow-md'
                : 'text-mine-textSecondary hover:text-white hover:bg-mine-cardSec'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Access Control (RBAC)</span>
          </button>
        </div>

        {/* Tab Panels */}
        <div className="flex-1 p-6 md:p-8">
          {/* TAB 1: Thresholds */}
          {activeTab === 'thresholds' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-mine-textPrimary">
                  Atmospheric Sensor Thresholds & Alarms
                </h3>
                <p className="text-xs text-mine-textSecondary mt-0.5">
                  Calibrate regulatory warning triggers and critical evacuation alarm limits.
                </p>
              </div>

              <div className="space-y-5">
                {/* Carbon Monoxide */}
                <div className="p-4 rounded-xl bg-mine-cardSec/60 border border-mine-border space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-white text-xs">Carbon Monoxide (CO)</span>
                      <p className="text-[10px] text-mine-textSecondary">Statutory DGMS / OSHA permissible limit</p>
                    </div>
                    <span className="text-xs font-mono font-bold text-mine-warning">ppm</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-mine-textSecondary mb-1">
                        Warning Limit
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        value={thresholds.co.warning}
                        onChange={(e) =>
                          setThresholds({
                            ...thresholds,
                            co: { ...thresholds.co, warning: parseFloat(e.target.value) || 0 },
                          })
                        }
                        className="w-full px-3 py-2 rounded-lg bg-mine-card border border-mine-border text-mine-textPrimary font-mono text-xs focus:border-mine-info"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-mine-critical mb-1">
                        Critical Evacuation Limit
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        value={thresholds.co.critical}
                        onChange={(e) =>
                          setThresholds({
                            ...thresholds,
                            co: { ...thresholds.co, critical: parseFloat(e.target.value) || 0 },
                          })
                        }
                        className="w-full px-3 py-2 rounded-lg bg-mine-card border border-mine-border text-mine-critical font-mono text-xs focus:border-mine-critical"
                      />
                    </div>
                  </div>
                </div>

                {/* Carbon Dioxide */}
                <div className="p-4 rounded-xl bg-mine-cardSec/60 border border-mine-border space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-white text-xs">Carbon Dioxide (CO2)</span>
                      <p className="text-[10px] text-mine-textSecondary">0.5% volume regulatory standard = 5,000 ppm</p>
                    </div>
                    <span className="text-xs font-mono font-bold text-blue-400">ppm</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-mine-textSecondary mb-1">
                        Warning Limit
                      </label>
                      <input
                        type="number"
                        step="100"
                        value={thresholds.co2.warning}
                        onChange={(e) =>
                          setThresholds({
                            ...thresholds,
                            co2: { ...thresholds.co2, warning: parseInt(e.target.value, 10) || 0 },
                          })
                        }
                        className="w-full px-3 py-2 rounded-lg bg-mine-card border border-mine-border text-mine-textPrimary font-mono text-xs focus:border-mine-info"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-mine-critical mb-1">
                        Critical Limit
                      </label>
                      <input
                        type="number"
                        step="100"
                        value={thresholds.co2.critical}
                        onChange={(e) =>
                          setThresholds({
                            ...thresholds,
                            co2: { ...thresholds.co2, critical: parseInt(e.target.value, 10) || 0 },
                          })
                        }
                        className="w-full px-3 py-2 rounded-lg bg-mine-card border border-mine-border text-mine-critical font-mono text-xs focus:border-mine-critical"
                      />
                    </div>
                  </div>
                </div>

                {/* Nitrogen Dioxide */}
                <div className="p-4 rounded-xl bg-mine-cardSec/60 border border-mine-border space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-white text-xs">Nitrogen Dioxide (NO2)</span>
                      <p className="text-[10px] text-mine-textSecondary">Blasting fumes & diesel engine exhaust limit</p>
                    </div>
                    <span className="text-xs font-mono font-bold text-red-400">ppm</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-mine-textSecondary mb-1">
                        Warning Limit
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={thresholds.no2.warning}
                        onChange={(e) =>
                          setThresholds({
                            ...thresholds,
                            no2: { ...thresholds.no2, warning: parseFloat(e.target.value) || 0 },
                          })
                        }
                        className="w-full px-3 py-2 rounded-lg bg-mine-card border border-mine-border text-mine-textPrimary font-mono text-xs focus:border-mine-info"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-mine-critical mb-1">
                        Critical Ceiling
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={thresholds.no2.critical}
                        onChange={(e) =>
                          setThresholds({
                            ...thresholds,
                            no2: { ...thresholds.no2, critical: parseFloat(e.target.value) || 0 },
                          })
                        }
                        className="w-full px-3 py-2 rounded-lg bg-mine-card border border-mine-border text-mine-critical font-mono text-xs focus:border-mine-critical"
                      />
                    </div>
                  </div>
                </div>

                {/* Ambient Temperature */}
                <div className="p-4 rounded-xl bg-mine-cardSec/60 border border-mine-border space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-white text-xs">Ambient Temperature</span>
                      <p className="text-[10px] text-mine-textSecondary">Wet-bulb threshold requiring artificial ventilation cooling</p>
                    </div>
                    <span className="text-xs font-mono font-bold text-orange-400">°C</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-mine-textSecondary mb-1">
                        Warning Limit
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        value={thresholds.temperature.warning}
                        onChange={(e) =>
                          setThresholds({
                            ...thresholds,
                            temperature: { ...thresholds.temperature, warning: parseFloat(e.target.value) || 0 },
                          })
                        }
                        className="w-full px-3 py-2 rounded-lg bg-mine-card border border-mine-border text-mine-textPrimary font-mono text-xs focus:border-mine-info"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-mine-critical mb-1">
                        Critical Thermal Limit
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        value={thresholds.temperature.critical}
                        onChange={(e) =>
                          setThresholds({
                            ...thresholds,
                            temperature: { ...thresholds.temperature, critical: parseFloat(e.target.value) || 0 },
                          })
                        }
                        className="w-full px-3 py-2 rounded-lg bg-mine-card border border-mine-border text-mine-critical font-mono text-xs focus:border-mine-critical"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Heartbeat & Offline */}
          {activeTab === 'heartbeat' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-mine-textPrimary">
                  Heartbeat & Automatic Offline Detection
                </h3>
                <p className="text-xs text-mine-textSecondary mt-0.5">
                  Configure heartbeat timeouts. Critical: Missing sensor data is never treated as safe.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-mine-textSecondary uppercase tracking-wider mb-2">
                    Heartbeat Timeout (Seconds)
                  </label>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min={5}
                      max={60}
                      step={5}
                      value={heartbeatTimeout}
                      onChange={(e) => setHeartbeatTimeout(parseInt(e.target.value, 10))}
                      className="w-64 accent-mine-info cursor-pointer"
                    />
                    <span className="font-mono font-bold text-mine-info text-base">
                      {heartbeatTimeout} seconds
                    </span>
                  </div>
                  <p className="text-[11px] text-mine-textSecondary mt-1.5">
                    If no valid telemetry is received from an ESP32 node within this timeframe, its connection state will transition to OFFLINE and readings will be marked as stale.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-mine-cardSec/70 border border-mine-border text-xs text-mine-textSecondary space-y-2">
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <Shield className="w-4 h-4 text-mine-info" /> Failsafe Safety Policy:
                  </div>
                  <p>
                    1. When a device disconnects, the last known readings are visibly flagged with a warning badge and greyed out.
                  </p>
                  <p>
                    2. An OFFLINE incident alert is automatically generated and pushed to the control room dashboard.
                  </p>
                  <p>
                    3. Stale readings are never assumed to be normal or safe.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: MQTT */}
          {activeTab === 'mqtt' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-mine-textPrimary">
                  MQTT Broker & IoT Bridge Configuration
                </h3>
                <p className="text-xs text-mine-textSecondary mt-0.5">
                  Set up broker connection for real ESP32 microcontrollers in underground haulage shafts.
                </p>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-mine-textSecondary uppercase tracking-wider mb-1.5">
                    Broker URL (TCP / WSS)
                  </label>
                  <input
                    type="text"
                    value={mqttBrokerUrl}
                    onChange={(e) => setMqttBrokerUrl(e.target.value)}
                    placeholder="mqtt://broker.emqx.io:1883 or mqtt://192.168.1.5:1883"
                    className="w-full px-3 py-2 rounded-lg bg-mine-cardSec border border-mine-border text-mine-textPrimary font-mono focus:border-mine-info"
                  />
                  <span className="text-[10px] text-mine-textSecondary mt-1 block">
                    Public test broker: <code className="text-mine-info">mqtt://broker.emqx.io:1883</code> or local Mosquitto broker.
                  </span>
                </div>

                <div>
                  <label className="block font-semibold text-mine-textSecondary uppercase tracking-wider mb-1.5">
                    Base Topic Prefix
                  </label>
                  <input
                    type="text"
                    value={mqttTopicPrefix}
                    onChange={(e) => setMqttTopicPrefix(e.target.value)}
                    placeholder="mineguard/zones"
                    className="w-full px-3 py-2 rounded-lg bg-mine-cardSec border border-mine-border text-mine-textPrimary font-mono focus:border-mine-info"
                  />
                  <span className="text-[10px] text-mine-textSecondary mt-1 block">
                    ESP32 devices publish to: <code className="text-mine-info">{mqttTopicPrefix}/[ZONE_ID]/sensors</code>
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-mine-cardSec/70 border border-mine-border space-y-2">
                  <div className="font-bold text-white flex items-center gap-2">
                    <Lock className="w-4 h-4 text-mine-success" /> Security & Credential Protection
                  </div>
                  <p className="text-[11px] text-mine-textSecondary leading-relaxed">
                    Authentication credentials, private certificates, and TLS secrets are securely maintained in backend environment variables and are never transmitted to client browsers.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Regulatory */}
          {activeTab === 'regulatory' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-mine-textPrimary">
                  Statutory Regulatory Framework & References
                </h3>
                <p className="text-xs text-mine-textSecondary mt-0.5">
                  Legal compliance references governing underground coal and metalliferous mines.
                </p>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-mine-textSecondary uppercase tracking-wider mb-1.5">
                    Regulatory Reference Standard
                  </label>
                  <input
                    type="text"
                    value={regulatoryStandard}
                    onChange={(e) => setRegulatoryStandard(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-mine-cardSec border border-mine-border text-mine-textPrimary focus:border-mine-info"
                  />
                </div>

                <div className="p-4 rounded-xl bg-mine-cardSec/70 border border-mine-border space-y-3">
                  <h4 className="font-bold text-white text-xs">Applicable Mining Statutes:</h4>
                  <ul className="space-y-2 text-[11px] text-mine-textSecondary list-disc list-inside leading-relaxed">
                    <li>
                      <strong className="text-mine-textPrimary">DGMS Coal Mines Regulations 2017 (Regulation 153):</strong> Standards of ventilation, carbon monoxide limits, methane detection, and airway velocity.
                    </li>
                    <li>
                      <strong className="text-mine-textPrimary">DGMS Circular No. 02 of 2014:</strong> Continuous multi-point environmental monitoring systems in underground coal seams.
                    </li>
                    <li>
                      <strong className="text-mine-textPrimary">OSHA 29 CFR 1910.1000 Table Z-1:</strong> Permissible exposure limits for atmospheric contaminants in subsurface mining works.
                    </li>
                    <li>
                      <strong className="text-mine-textPrimary">NIOSH Criteria for Recommended Standard:</strong> Working in confined spaces and hazardous underground atmospheres.
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: Access Control */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-mine-textPrimary">
                  Role-Based Access Control (RBAC)
                </h3>
                <p className="text-xs text-mine-textSecondary mt-0.5">
                  Authorized personnel permitted to acknowledge alerts or alter regulatory thresholds.
                </p>
              </div>

              <div className="space-y-3">
                <div className="p-3.5 rounded-xl bg-mine-cardSec/70 border border-mine-border flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-white">Engr. Rajesh Sharma</span>
                    <span className="text-[10px] text-mine-info block">Chief Safety Officer (Authorized DGMS Inspector)</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-mine-info/20 text-mine-info font-bold text-[10px]">
                    FULL ADMIN
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-mine-cardSec/70 border border-mine-border flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-white">Shift Supervisor Kumar</span>
                    <span className="text-[10px] text-mine-textSecondary block">Shift In-Charge (Level -200m Working Seams)</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-mine-warning/20 text-mine-warning font-bold text-[10px]">
                    ACKNOWLEDGE ONLY
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-mine-cardSec/70 border border-mine-border flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-white">Mine Ventilation Officer Roy</span>
                    <span className="text-[10px] text-mine-textSecondary block">Ventilation & Airflow Engineer</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-mine-success/20 text-mine-success font-bold text-[10px]">
                    OPERATOR
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
