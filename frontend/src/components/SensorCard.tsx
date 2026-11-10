import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown, Minus, AlertTriangle, ShieldAlert, CheckCircle2, Shield, AlertCircle } from 'lucide-react';
import { ZoneStatus } from '../types';

interface SensorCardProps {
  name: string;
  chemicalSymbol?: string;
  icon: LucideIcon;
  value: number | null | undefined;
  unit: string;
  warningThreshold: number;
  criticalThreshold: number;
  lastUpdated?: string;
  status: ZoneStatus;
  trend?: 'up' | 'down' | 'stable';
  color: string;
}

export const SensorCard: React.FC<SensorCardProps> = ({
  name,
  chemicalSymbol,
  icon: Icon,
  value,
  unit,
  warningThreshold,
  criticalThreshold,
  lastUpdated,
  status,
  trend = 'stable',
  color,
}) => {
  const isAvailable = value !== null && value !== undefined && !isNaN(value);
  const isCritical = isAvailable && value! >= criticalThreshold;
  const isWarning = isAvailable && !isCritical && value! >= warningThreshold;

  let badgeText = 'NORMAL';
  let badgeClass = 'bg-mine-success/15 text-mine-success border-mine-success/30';
  let cardBorder = 'border-mine-border';

  if (!isAvailable) {
    badgeText = 'UNAVAILABLE';
    badgeClass = 'bg-gray-500/20 text-gray-300 border-gray-500/40';
    cardBorder = 'border-gray-500/40';
  } else if (isCritical) {
    badgeText = 'CRITICAL LIMIT';
    badgeClass = 'bg-mine-critical text-white font-black animate-pulse';
    cardBorder = 'border-mine-critical shadow-lg shadow-mine-critical/10';
  } else if (isWarning) {
    badgeText = 'WARNING LIMIT';
    badgeClass = 'bg-mine-warning text-black font-extrabold';
    cardBorder = 'border-mine-warning shadow-lg shadow-mine-warning/10';
  }

  // Calculate percentage of limit
  const percentOfLimit = isAvailable ? Math.min(100, Math.round((value! / criticalThreshold) * 100)) : 0;

  return (
    <div className={`p-5 rounded-2xl bg-mine-card border ${cardBorder} shadow-lg transition-all`}>
      {/* Top Bar */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-xl bg-mine-cardSec border border-mine-border text-white">
            <Icon className="w-5 h-5" style={{ color }} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-mine-textPrimary">
              {name}
            </h4>
            {chemicalSymbol && (
              <span className="text-xs font-mono font-semibold text-mine-info">
                {chemicalSymbol}
              </span>
            )}
          </div>
        </div>
        <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded border ${badgeClass}`}>
          {badgeText}
        </span>
      </div>

      {/* Main Reading */}
      <div className="my-3 flex items-baseline justify-between">
        <div className="flex items-baseline gap-2">
          {isAvailable ? (
            <>
              <span className="text-4xl font-extrabold font-mono tracking-tight text-white">
                {value}
              </span>
              <span className="text-sm font-semibold text-mine-textSecondary">
                {unit}
              </span>
            </>
          ) : (
            <div className="flex items-center gap-1.5 text-gray-400">
              <AlertCircle className="w-5 h-5 text-gray-400" />
              <span className="text-xl font-bold font-mono tracking-tight">
                UNAVAILABLE
              </span>
            </div>
          )}
        </div>

        {/* Trend Indicator */}
        {isAvailable && (
          <div className="flex items-center gap-1 text-xs text-mine-textSecondary">
            {trend === 'up' ? (
              <span className="text-mine-warning flex items-center gap-0.5 font-medium">
                <TrendingUp className="w-4 h-4" /> Drift +
              </span>
            ) : trend === 'down' ? (
              <span className="text-mine-success flex items-center gap-0.5 font-medium">
                <TrendingDown className="w-4 h-4" /> Drift -
              </span>
            ) : (
              <span className="text-mine-textSecondary flex items-center gap-0.5">
                <Minus className="w-4 h-4" /> Stable
              </span>
            )}
          </div>
        )}
      </div>

      {/* Threshold Reference Bar */}
      <div className="space-y-1.5 pt-2 border-t border-mine-border/60">
        <div className="flex items-center justify-between text-[11px] text-mine-textSecondary">
          <span>Safety Thresholds</span>
          <span className="font-mono">
            Warn: {warningThreshold} | Crit: {criticalThreshold} {unit}
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full h-1.5 bg-mine-cardSec rounded-full overflow-hidden flex">
          <div
            className={`h-full transition-all duration-500 ${
              !isAvailable
                ? 'bg-gray-600'
                : isCritical
                ? 'bg-mine-critical'
                : isWarning
                ? 'bg-mine-warning'
                : 'bg-mine-success'
            }`}
            style={{ width: `${percentOfLimit}%` }}
          />
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-3 flex items-center justify-between text-[10px] text-mine-textSecondary pt-2">
        <span className="flex items-center gap-1">
          <Shield className="w-3 h-3 text-mine-info" /> DGMS / OSHA Compliance Standard
        </span>
        <span className="font-mono">
          {lastUpdated ? new Date(lastUpdated).toLocaleTimeString() : 'Live'}
        </span>
      </div>
    </div>
  );
};
