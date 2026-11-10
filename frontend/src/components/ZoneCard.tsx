import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Thermometer,
  Droplets,
  Wind,
  Wifi,
  WifiOff,
  ChevronRight,
  Clock,
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  Cpu,
  Radio,
} from 'lucide-react';
import { Zone } from '../types';

interface ZoneCardProps {
  zone: Zone;
  onOpenScenario?: (zoneId: string) => void;
}

export const ZoneCard: React.FC<ZoneCardProps> = ({ zone }) => {
  const navigate = useNavigate();
  const reading = zone.latest_reading;
  const isOnline = zone.device_status === 'ONLINE' && !zone.is_stale;
  const status = zone.status;
  const isHardware = reading?.source === 'hardware';

  const getStatusBorder = () => {
    if (!isOnline || status === 'OFFLINE') return 'border-gray-500/50 hover:border-gray-400';
    if (status === 'CRITICAL') return 'border-mine-critical hover:border-mine-critical/80 shadow-mine-critical/10';
    if (status === 'WARNING') return 'border-mine-warning hover:border-mine-warning/80 shadow-mine-warning/10';
    return 'border-mine-success/40 hover:border-mine-success/80';
  };

  const getStatusBadge = () => {
    if (!isOnline || status === 'OFFLINE') {
      return (
        <span className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded bg-gray-500/20 text-gray-300 border border-gray-500/40">
          <WifiOff className="w-3 h-3 text-gray-400" /> OFFLINE
        </span>
      );
    }
    if (status === 'CRITICAL') {
      return (
        <span className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-black uppercase rounded bg-mine-critical/20 text-mine-critical border border-mine-critical/50 animate-pulse">
          <ShieldAlert className="w-3 h-3 text-mine-critical" /> CRITICAL
        </span>
      );
    }
    if (status === 'WARNING') {
      return (
        <span className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-extrabold uppercase rounded bg-mine-warning/20 text-mine-warning border border-mine-warning/50">
          <AlertTriangle className="w-3 h-3 text-mine-warning" /> WARNING
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-mine-success/20 text-mine-success border border-mine-success/40">
        <CheckCircle2 className="w-3 h-3 text-mine-success" /> NORMAL
      </span>
    );
  };

  const formatTime = (ts?: string) => {
    if (!ts) return 'No data';
    try {
      const d = new Date(ts);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return ts;
    }
  };

  const renderValue = (val: number | null | undefined, unit: string) => {
    if (val === null || val === undefined) {
      return <span className="text-gray-400 text-xs font-normal">UNAVAILABLE</span>;
    }
    return `${val} ${unit}`;
  };

  return (
    <div
      onClick={() => navigate(`/zones/${zone.id}`)}
      className={`group cursor-pointer rounded-2xl bg-mine-card border ${getStatusBorder()} p-5 transition-all duration-300 hover:shadow-2xl hover:translate-y-[-2px] flex flex-col justify-between`}
    >
      {/* Top Header */}
      <div>
        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            <div className="flex flex-wrap items-center gap-1.5 mb-1">
              <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold rounded bg-mine-cardSec text-mine-info border border-mine-border">
                {zone.id}
              </span>
              <span className="text-[11px] text-mine-textSecondary flex items-center gap-1 font-mono">
                {isOnline ? (
                  <Wifi className="w-3 h-3 text-mine-success" />
                ) : (
                  <WifiOff className="w-3 h-3 text-gray-400" />
                )}
                {zone.device_id}
              </span>

              {/* Data Source Label: REAL HARDWARE vs SIMULATED */}
              {isHardware ? (
                <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-mine-success/15 text-mine-success border border-mine-success/30 flex items-center gap-1">
                  <Cpu className="w-2.5 h-2.5" /> REAL HARDWARE
                </span>
              ) : (
                <span className="px-1.5 py-0.5 text-[9px] font-semibold rounded bg-mine-info/10 text-mine-info border border-mine-info/20 flex items-center gap-1">
                  <Radio className="w-2.5 h-2.5" /> DEMO DATA
                </span>
              )}
            </div>
            <h3 className="text-base font-bold text-mine-textPrimary mt-1 group-hover:text-mine-info transition-colors">
              {zone.zone_name}
            </h3>
            <p className="text-xs text-mine-textSecondary truncate">{zone.location}</p>
          </div>
          <div className="shrink-0">{getStatusBadge()}</div>
        </div>

        {/* Stale warning notification if offline */}
        {zone.is_stale && (
          <div className="my-2 px-2.5 py-1 text-[11px] rounded bg-gray-500/15 border border-gray-500/30 text-gray-300 flex items-center gap-1.5">
            <Clock className="w-3 h-3 text-mine-warning" />
            <span>STALE TELEMETRY. Transceiver heartbeat timed out.</span>
          </div>
        )}

        {/* 5 Sensor Metric Grid */}
        <div className="grid grid-cols-3 gap-2 my-4">
          {/* Temperature */}
          <div className="p-2.5 rounded-xl bg-mine-cardSec/70 border border-mine-border/60">
            <div className="flex items-center gap-1 text-[10px] font-semibold text-mine-textSecondary uppercase">
              <Thermometer className="w-3 h-3 text-orange-400" /> Temp
            </div>
            <div className="text-sm font-bold font-mono text-mine-textPrimary mt-1 truncate">
              {renderValue(reading?.temperature, '°C')}
            </div>
            <div className="text-[9px] text-mine-textSecondary">Limit: 30.5°C</div>
          </div>

          {/* Humidity */}
          <div className="p-2.5 rounded-xl bg-mine-cardSec/70 border border-mine-border/60">
            <div className="flex items-center gap-1 text-[10px] font-semibold text-mine-textSecondary uppercase">
              <Droplets className="w-3 h-3 text-cyan-400" /> Humidity
            </div>
            <div className="text-sm font-bold font-mono text-mine-textPrimary mt-1 truncate">
              {renderValue(reading?.humidity, '%')}
            </div>
            <div className="text-[9px] text-mine-textSecondary">Limit: 85%</div>
          </div>

          {/* CO */}
          <div
            className={`p-2.5 rounded-xl border ${
              reading && reading.co !== null && reading.co >= 25
                ? 'bg-mine-warning/15 border-mine-warning/50 text-mine-warning'
                : 'bg-mine-cardSec/70 border-mine-border/60 text-mine-textPrimary'
            }`}
          >
            <div className="flex items-center gap-1 text-[10px] font-semibold text-mine-textSecondary uppercase">
              <Wind className="w-3 h-3 text-mine-warning" /> CO
            </div>
            <div className="text-sm font-bold font-mono mt-1 truncate">
              {renderValue(reading?.co, 'ppm')}
            </div>
            <div className="text-[9px] text-mine-textSecondary">Limit: 25 ppm</div>
          </div>

          {/* CO2 */}
          <div
            className={`p-2.5 rounded-xl col-span-2 border ${
              reading && reading.co2 !== null && reading.co2 >= 2500
                ? 'bg-mine-warning/15 border-mine-warning/50'
                : 'bg-mine-cardSec/70 border-mine-border/60'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 text-[10px] font-semibold text-mine-textSecondary uppercase">
                <Wind className="w-3 h-3 text-blue-400" /> Carbon Dioxide (CO2)
              </div>
              <div className="text-[9px] text-mine-textSecondary">Limit: 2500 ppm</div>
            </div>
            <div className="text-sm font-bold font-mono text-mine-textPrimary mt-1 truncate">
              {renderValue(reading?.co2, 'ppm')}
            </div>
          </div>

          {/* NO2 */}
          <div
            className={`p-2.5 rounded-xl border ${
              reading && reading.no2 !== null && reading.no2 >= 2.0
                ? 'bg-mine-warning/15 border-mine-warning/50 text-mine-warning'
                : 'bg-mine-cardSec/70 border-mine-border/60 text-mine-textPrimary'
            }`}
          >
            <div className="flex items-center gap-1 text-[10px] font-semibold text-mine-textSecondary uppercase">
              <Wind className="w-3 h-3 text-red-400" /> NO2
            </div>
            <div className="text-sm font-bold font-mono mt-1 truncate">
              {renderValue(reading?.no2, 'ppm')}
            </div>
            <div className="text-[9px] text-mine-textSecondary">Limit: 2.0 ppm</div>
          </div>
        </div>
      </div>

      {/* Card Footer */}
      <div className="pt-3 border-t border-mine-border/60 flex items-center justify-between text-xs text-mine-textSecondary">
        <span className="flex items-center gap-1 text-[11px] font-mono">
          <Clock className="w-3 h-3" /> {formatTime(reading?.timestamp)}
        </span>
        <span className="text-mine-info group-hover:text-white flex items-center gap-0.5 text-xs font-semibold">
          Inspect Zone <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
        </span>
      </div>
    </div>
  );
};
