import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Thermometer,
  Droplets,
  Wind,
  Wifi,
  WifiOff,
  Cpu,
  Clock,
  Shield,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Play,
  RotateCcw,
  Sparkles,
  Server,
  Radio,
} from 'lucide-react';
import { useMineGuard } from '../context/MineGuardContext';
import { SensorCard } from '../components/SensorCard';
import { SensorChart } from '../components/SensorChart';
import { api } from '../services/api';
import { SensorReading, Zone } from '../types';

export const ZoneDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { zones, triggerScenario, addToast } = useMineGuard();

  // Find zone in state
  const zone = zones.find((z) => z.id === id);

  const [timeRange, setTimeRange] = useState('24h');
  const [readings, setReadings] = useState<SensorReading[]>([]);
  const [loadingReadings, setLoadingReadings] = useState(false);

  // Fetch historical readings for this zone
  useEffect(() => {
    if (!id) return;
    let isMounted = true;
    setLoadingReadings(true);

    api
      .getZoneReadings(id, timeRange)
      .then((data) => {
        if (isMounted) setReadings(data);
      })
      .catch((err) => {
        console.error('Failed to load zone readings:', err);
      })
      .finally(() => {
        if (isMounted) setLoadingReadings(false);
      });

    return () => {
      isMounted = false;
    };
  }, [id, timeRange]);

  // When live reading arrives via socket, append to current chart readings if matched
  useEffect(() => {
    if (!zone?.latest_reading) return;
    setReadings((prev) => {
      if (prev.length === 0) return [zone.latest_reading!];
      const last = prev[prev.length - 1];
      if (last.timestamp === zone.latest_reading!.timestamp) return prev;
      return [...prev.slice(-99), zone.latest_reading!];
    });
  }, [zone?.latest_reading]);

  if (!zone) {
    return (
      <div className="p-12 text-center rounded-2xl bg-mine-card border border-mine-border space-y-4">
        <h3 className="text-lg font-bold text-mine-textPrimary">Mine Zone Not Found</h3>
        <p className="text-xs text-mine-textSecondary">
          The requested zone identifier "{id}" does not exist in the active registry.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-mine-info rounded-xl"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
      </div>
    );
  }

  const latest = zone.latest_reading;
  const isOnline = zone.device_status === 'ONLINE' && !zone.is_stale;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Navigation & Zone Title Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-mine-card border border-mine-border shadow-xl">
        <div className="flex items-start gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2.5 rounded-xl bg-mine-cardSec text-mine-textSecondary hover:text-white hover:bg-mine-border border border-mine-border transition-colors shrink-0"
            title="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2 py-0.5 text-xs font-mono font-bold rounded bg-mine-info/15 text-mine-info border border-mine-info/30">
                {zone.id}
              </span>
              <span className="text-xs text-mine-textSecondary font-medium">
                {zone.location}
              </span>
              <span
                className={`flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded ${
                  isOnline
                    ? 'bg-mine-success/15 text-mine-success border border-mine-success/30'
                    : 'bg-gray-500/20 text-gray-300 border border-gray-500/40'
                }`}
              >
                {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                {isOnline ? 'TRANSCEIVER ONLINE' : 'TRANSCEIVER OFFLINE'}
              </span>
              {latest?.source === 'hardware' ? (
                <span className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded bg-mine-success/20 text-mine-success border border-mine-success/40">
                  <Cpu className="w-3 h-3" /> REAL HARDWARE DATA
                </span>
              ) : (
                <span className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded bg-mine-info/15 text-mine-info border border-mine-info/30">
                  <Radio className="w-3 h-3" /> DEMO SIMULATOR
                </span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-mine-textPrimary mt-1.5 tracking-tight">
              {zone.zone_name}
            </h1>
          </div>
        </div>

        {/* Right Status Badge & Quick Simulator Trigger */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 self-start md:self-auto">
          {/* Status Badge */}
          <span
            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5 border ${
              zone.status === 'CRITICAL'
                ? 'bg-mine-critical text-white border-mine-critical'
                : zone.status === 'WARNING'
                ? 'bg-mine-warning text-black border-mine-warning font-black'
                : zone.status === 'OFFLINE'
                ? 'bg-gray-500/20 text-gray-300 border-gray-500/40'
                : 'bg-mine-success/20 text-mine-success border-mine-success/40'
            }`}
          >
            {zone.status === 'CRITICAL' && <ShieldAlert className="w-4 h-4" />}
            {zone.status === 'WARNING' && <AlertTriangle className="w-4 h-4" />}
            {zone.status === 'NORMAL' && <CheckCircle2 className="w-4 h-4" />}
            {zone.status} STATUS
          </span>

          {/* Quick Scenario Dispatchers for Live Demo */}
          <div className="flex items-center gap-1 bg-mine-cardSec p-1 rounded-xl border border-mine-border text-xs">
            <button
              onClick={() => triggerScenario(zone.id, 'WARNING', 60)}
              className="px-2 py-1 text-[11px] font-bold text-mine-warning hover:bg-mine-warning/20 rounded-lg transition-colors"
              title="Inject Warning Drift (CO to 28.5 ppm)"
            >
              Test Warning
            </button>
            <button
              onClick={() => triggerScenario(zone.id, 'CRITICAL', 60)}
              className="px-2 py-1 text-[11px] font-bold text-mine-critical hover:bg-mine-critical/20 rounded-lg transition-colors"
              title="Inject Critical Alarm (CO to 54 ppm)"
            >
              Test Critical
            </button>
            <button
              onClick={() => triggerScenario(zone.id, 'NORMAL', 60)}
              className="px-2 py-1 text-[11px] font-bold text-mine-success hover:bg-mine-success/20 rounded-lg transition-colors"
              title="Reset to Normal Conditions"
            >
              Reset Safe
            </button>
          </div>
        </div>
      </div>

      {/* SECTION A: 5 Individual Sensor Monitoring Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {/* 1. Carbon Monoxide */}
        <SensorCard
          name="Carbon Monoxide"
          chemicalSymbol="CO"
          icon={Wind}
          value={latest?.co ?? null}
          unit="ppm"
          warningThreshold={25.0}
          criticalThreshold={50.0}
          lastUpdated={latest?.timestamp}
          status={zone.status}
          color="#F59E0B"
        />

        {/* 2. Carbon Dioxide */}
        <SensorCard
          name="Carbon Dioxide"
          chemicalSymbol="CO2"
          icon={Wind}
          value={latest?.co2 ?? null}
          unit="ppm"
          warningThreshold={2500}
          criticalThreshold={5000}
          lastUpdated={latest?.timestamp}
          status={zone.status}
          color="#38BDF8"
        />

        {/* 3. Nitrogen Dioxide */}
        <SensorCard
          name="Nitrogen Dioxide"
          chemicalSymbol="NO2"
          icon={Wind}
          value={latest?.no2 ?? null}
          unit="ppm"
          warningThreshold={2.0}
          criticalThreshold={3.0}
          lastUpdated={latest?.timestamp}
          status={zone.status}
          color="#EF4444"
        />

        {/* 4. Ambient Temperature */}
        <SensorCard
          name="Ambient Temperature"
          chemicalSymbol="TEMP"
          icon={Thermometer}
          value={latest?.temperature ?? null}
          unit="°C"
          warningThreshold={30.5}
          criticalThreshold={33.5}
          lastUpdated={latest?.timestamp}
          status={zone.status}
          color="#FB923C"
        />

        {/* 5. Relative Humidity */}
        <SensorCard
          name="Relative Humidity"
          chemicalSymbol="RH"
          icon={Droplets}
          value={latest?.humidity ?? null}
          unit="%"
          warningThreshold={85.0}
          criticalThreshold={92.0}
          lastUpdated={latest?.timestamp}
          status={zone.status}
          color="#34D399"
        />
      </section>

      {/* SECTION B: Environmental Trends Charts */}
      <section>
        <SensorChart
          readings={readings}
          timeRange={timeRange}
          onTimeRangeChange={(r) => setTimeRange(r)}
          selectedSensor="co"
          title={`${zone.zone_name} Continuous History`}
        />
      </section>

      {/* SECTION C: Zone Hardware & Transceiver Specifications */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Device Information Card */}
        <div className="p-5 rounded-2xl bg-mine-card border border-mine-border shadow-xl space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-mine-border">
            <div className="p-2 rounded-xl bg-mine-info/10 text-mine-info">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-mine-textPrimary">Assigned ESP32 Transceiver</h3>
              <p className="text-xs text-mine-textSecondary">Hardware IoT Edge Controller</p>
            </div>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between py-1 border-b border-mine-border/40">
              <span className="text-mine-textSecondary">Device ID</span>
              <span className="font-mono font-bold text-white">{zone.device_id}</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-mine-border/40">
              <span className="text-mine-textSecondary">Connection Status</span>
              <span
                className={`font-bold ${
                  isOnline ? 'text-mine-success' : 'text-gray-400'
                }`}
              >
                {isOnline ? 'ONLINE (Heartbeat Valid)' : 'OFFLINE (Timeout)'}
              </span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-mine-border/40">
              <span className="text-mine-textSecondary">Network IP Address</span>
              <span className="font-mono text-white">
                {zone.device_info?.ip_address || '192.168.4.12'}
              </span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-mine-border/40">
              <span className="text-mine-textSecondary">Firmware Version</span>
              <span className="font-mono text-mine-info">
                {zone.device_info?.firmware_version || 'v1.4.2-esp32-freertos'}
              </span>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-mine-textSecondary">Last Communication</span>
              <span className="font-mono text-white text-[11px]">
                {latest ? new Date(latest.timestamp).toLocaleString() : 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* Sensor Suite Specifications */}
        <div className="p-5 rounded-2xl bg-mine-card border border-mine-border shadow-xl space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-mine-border">
            <div className="p-2 rounded-xl bg-mine-success/10 text-mine-success">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-mine-textPrimary">Installed Sensor Suite</h3>
              <p className="text-xs text-mine-textSecondary">Electrochemical & NDIR Transducers</p>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <div className="p-2 rounded-lg bg-mine-cardSec/70 border border-mine-border/50 flex items-center justify-between">
              <div>
                <span className="font-bold text-white">MQ-7 / ZE07-CO</span>
                <p className="text-[10px] text-mine-textSecondary">Electrochemical CO sensor (0 - 500 ppm)</p>
              </div>
              <span className="text-[10px] font-bold text-mine-success px-1.5 py-0.5 rounded bg-mine-success/15">
                HEALTHY
              </span>
            </div>

            <div className="p-2 rounded-lg bg-mine-cardSec/70 border border-mine-border/50 flex items-center justify-between">
              <div>
                <span className="font-bold text-white">MH-Z19C NDIR</span>
                <p className="text-[10px] text-mine-textSecondary">Optical infrared CO2 transducer (400 - 5000 ppm)</p>
              </div>
              <span className="text-[10px] font-bold text-mine-success px-1.5 py-0.5 rounded bg-mine-success/15">
                HEALTHY
              </span>
            </div>

            <div className="p-2 rounded-lg bg-mine-cardSec/70 border border-mine-border/50 flex items-center justify-between">
              <div>
                <span className="font-bold text-white">MiCS-2714 / NO2</span>
                <p className="text-[10px] text-mine-textSecondary">Metal oxide semiconductor NO2 detection</p>
              </div>
              <span className="text-[10px] font-bold text-mine-success px-1.5 py-0.5 rounded bg-mine-success/15">
                HEALTHY
              </span>
            </div>

            <div className="p-2 rounded-lg bg-mine-cardSec/70 border border-mine-border/50 flex items-center justify-between">
              <div>
                <span className="font-bold text-white">SHT31-D / DHT22</span>
                <p className="text-[10px] text-mine-textSecondary">Digital temperature & relative humidity sensor</p>
              </div>
              <span className="text-[10px] font-bold text-mine-success px-1.5 py-0.5 rounded bg-mine-success/15">
                HEALTHY
              </span>
            </div>
          </div>
        </div>

        {/* Regulatory Compliance Guidelines */}
        <div className="p-5 rounded-2xl bg-mine-card border border-mine-border shadow-xl space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-mine-border">
            <div className="p-2 rounded-xl bg-mine-warning/10 text-mine-warning">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-mine-textPrimary">Statutory Guidance</h3>
              <p className="text-xs text-mine-textSecondary">DGMS Regulation 153 & OSHA 1910</p>
            </div>
          </div>

          <div className="space-y-3 text-xs text-mine-textSecondary leading-relaxed">
            <p>
              Under <strong className="text-mine-textPrimary">DGMS Coal Mines Regulations 2017</strong>, every mine section must maintain air velocity adequate to dilute toxic fumes.
            </p>
            <div className="p-2.5 rounded-lg bg-mine-cardSec/90 border border-mine-border/60 text-[11px] space-y-1">
              <div>• <strong>CO Limit:</strong> Max 25 ppm (8h TWA), &gt; 50 ppm requires worker withdrawal.</div>
              <div>• <strong>CO2 Limit:</strong> Max 0.5% (5,000 ppm) in return airway.</div>
              <div>• <strong>NO2 Limit:</strong> Max 3.0 ppm ceiling value.</div>
              <div>• <strong>Temperature:</strong> Wet bulb &gt; 33.5°C requires immediate cooling ventilation.</div>
            </div>
            <p className="text-[10px] text-gray-400">
              * Operators must log threshold exceedances in the statutory shift register.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
