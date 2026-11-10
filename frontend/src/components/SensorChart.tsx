import React, { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  CartesianGrid,
  Legend,
} from 'recharts';
import { Calendar, Filter, Sparkles } from 'lucide-react';
import { SensorReading } from '../types';

interface SensorChartProps {
  readings: SensorReading[];
  timeRange: string;
  onTimeRangeChange: (range: string) => void;
  selectedSensor?: 'co' | 'co2' | 'no2' | 'temperature' | 'humidity';
  warningThreshold?: number;
  criticalThreshold?: number;
  unit?: string;
  title?: string;
}

export const SensorChart: React.FC<SensorChartProps> = ({
  readings,
  timeRange,
  onTimeRangeChange,
  selectedSensor = 'co',
  warningThreshold = 25,
  criticalThreshold = 50,
  unit = 'ppm',
  title = 'Sensor Concentration Trends',
}) => {
  const [activeMetric, setActiveMetric] = useState<'co' | 'co2' | 'no2' | 'temperature' | 'humidity'>(selectedSensor);

  const metricsConfig = {
    co: {
      label: 'Carbon Monoxide (CO)',
      unit: 'ppm',
      stroke: '#F59E0B',
      fill: 'rgba(245, 158, 11, 0.15)',
      warning: 25.0,
      critical: 50.0,
    },
    co2: {
      label: 'Carbon Dioxide (CO2)',
      unit: 'ppm',
      stroke: '#38BDF8',
      fill: 'rgba(56, 189, 248, 0.15)',
      warning: 2500,
      critical: 5000,
    },
    no2: {
      label: 'Nitrogen Dioxide (NO2)',
      unit: 'ppm',
      stroke: '#EF4444',
      fill: 'rgba(239, 68, 68, 0.15)',
      warning: 2.0,
      critical: 3.0,
    },
    temperature: {
      label: 'Temperature',
      unit: '°C',
      stroke: '#FB923C',
      fill: 'rgba(251, 146, 60, 0.15)',
      warning: 30.5,
      critical: 33.5,
    },
    humidity: {
      label: 'Humidity',
      unit: '%',
      stroke: '#34D399',
      fill: 'rgba(52, 211, 153, 0.15)',
      warning: 85.0,
      critical: 92.0,
    },
  };

  const currentCfg = metricsConfig[activeMetric];

  // Format data for Recharts
  const chartData = readings.map((r) => {
    const d = new Date(r.timestamp);
    const timeLabel =
      timeRange === '7d'
        ? `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:00`
        : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return {
      timestamp: r.timestamp,
      displayTime: timeLabel,
      [activeMetric]: r[activeMetric],
      co: r.co,
      co2: r.co2,
      no2: r.no2,
      temperature: r.temperature,
      humidity: r.humidity,
    };
  });

  return (
    <div className="p-5 rounded-2xl bg-mine-card border border-mine-border shadow-xl">
      {/* Chart Top Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-base font-bold text-mine-textPrimary flex items-center gap-2">
            <span>{title}</span>
            <span className="text-xs font-mono font-semibold text-mine-info px-2 py-0.5 rounded bg-mine-info/10 border border-mine-info/20">
              {currentCfg.label}
            </span>
          </h3>
          <p className="text-xs text-mine-textSecondary mt-0.5">
            Continuous atmospheric history with statutory threshold markers
          </p>
        </div>

        {/* Metric Selector Pills & Time Range Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Metric Selector */}
          <div className="flex items-center bg-mine-cardSec p-1 rounded-xl border border-mine-border text-xs">
            {(['co', 'co2', 'no2', 'temperature', 'humidity'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setActiveMetric(m)}
                className={`px-2.5 py-1 rounded-lg font-bold uppercase text-[11px] transition-all ${
                  activeMetric === m
                    ? 'bg-mine-info text-white shadow-sm'
                    : 'text-mine-textSecondary hover:text-white'
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          {/* Time Range Filter Buttons */}
          <div className="flex items-center bg-mine-cardSec p-1 rounded-xl border border-mine-border text-xs">
            {['1h', '6h', '24h', '7d'].map((range) => (
              <button
                key={range}
                onClick={() => onTimeRangeChange(range)}
                className={`px-2.5 py-1 rounded-lg font-semibold text-xs transition-all ${
                  timeRange === range
                    ? 'bg-mine-border text-white shadow-sm'
                    : 'text-mine-textSecondary hover:text-white'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chart Area */}
      <div className="w-full h-80">
        {chartData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-sm text-mine-textSecondary">
            Loading continuous telemetry data...
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id={`grad-${activeMetric}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={currentCfg.stroke} stopOpacity={0.35} />
                  <stop offset="95%" stopColor={currentCfg.stroke} stopOpacity={0.0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />

              <XAxis
                dataKey="displayTime"
                stroke="#64748B"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#263449' }}
              />

              <YAxis
                stroke="#64748B"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#263449' }}
                unit={` ${currentCfg.unit}`}
                domain={['auto', 'auto']}
              />

              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const val = payload[0].value;
                    const isOverWarn = typeof val === 'number' && val >= currentCfg.warning;
                    const isOverCrit = typeof val === 'number' && val >= currentCfg.critical;

                    return (
                      <div className="p-3 bg-mine-card border border-mine-border rounded-xl shadow-2xl text-xs backdrop-blur-md">
                        <div className="font-semibold text-mine-textSecondary mb-1 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-mine-info" /> {label}
                        </div>
                        <div className="text-sm font-bold text-white font-mono flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: currentCfg.stroke }}
                          />
                          <span>
                            {val} {currentCfg.unit}
                          </span>
                        </div>
                        {isOverCrit ? (
                          <div className="mt-1.5 text-[10px] font-bold text-mine-critical uppercase">
                            Breaches Critical Limit ({currentCfg.critical} {currentCfg.unit})
                          </div>
                        ) : isOverWarn ? (
                          <div className="mt-1.5 text-[10px] font-bold text-mine-warning uppercase">
                            Breaches Warning Limit ({currentCfg.warning} {currentCfg.unit})
                          </div>
                        ) : (
                          <div className="mt-1.5 text-[10px] font-medium text-mine-success">
                            Within Normal DGMS / OSHA Limits
                          </div>
                        )}
                      </div>
                    );
                  }
                  return null;
                }}
              />

              {/* Threshold Reference Lines */}
              <ReferenceLine
                y={currentCfg.warning}
                stroke="#F59E0B"
                strokeDasharray="4 4"
                label={{
                  value: `Warning Limit: ${currentCfg.warning} ${currentCfg.unit}`,
                  fill: '#F59E0B',
                  fontSize: 10,
                  position: 'insideTopRight',
                }}
              />

              <ReferenceLine
                y={currentCfg.critical}
                stroke="#EF4444"
                strokeDasharray="4 4"
                label={{
                  value: `Critical Limit: ${currentCfg.critical} ${currentCfg.unit}`,
                  fill: '#EF4444',
                  fontSize: 10,
                  position: 'insideTopLeft',
                }}
              />

              <Area
                type="monotone"
                dataKey={activeMetric}
                stroke={currentCfg.stroke}
                strokeWidth={2.5}
                fill={`url(#grad-${activeMetric})`}
                isAnimationActive={true}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Chart Footer with Regulatory Notes */}
      <div className="mt-4 pt-3 border-t border-mine-border/60 flex flex-wrap items-center justify-between gap-3 text-xs text-mine-textSecondary">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-mine-warning" /> Warning Threshold: {currentCfg.warning} {currentCfg.unit}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-mine-critical" /> Critical Threshold: {currentCfg.critical} {currentCfg.unit}
          </span>
        </div>
        <span className="text-[11px] font-mono text-gray-400">
          Total Samples Rendered: {chartData.length} readings
        </span>
      </div>
    </div>
  );
};
