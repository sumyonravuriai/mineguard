import React from 'react';
import { LucideIcon } from 'lucide-react';

interface SummaryCardProps {
  label: string;
  count: number;
  icon: LucideIcon;
  colorScheme: 'info' | 'success' | 'warning' | 'critical' | 'gray';
  subtext: string;
  onClick?: () => void;
  active?: boolean;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({
  label,
  count,
  icon: Icon,
  colorScheme,
  subtext,
  onClick,
  active,
}) => {
  const colorMap = {
    info: {
      border: 'border-mine-info/40',
      activeRing: 'ring-2 ring-mine-info',
      iconBg: 'bg-mine-info/10 text-mine-info',
      countColor: 'text-white',
      badge: 'bg-mine-info/15 text-mine-info',
    },
    success: {
      border: 'border-mine-success/40',
      activeRing: 'ring-2 ring-mine-success',
      iconBg: 'bg-mine-success/10 text-mine-success',
      countColor: 'text-mine-success',
      badge: 'bg-mine-success/15 text-mine-success',
    },
    warning: {
      border: 'border-mine-warning/40',
      activeRing: 'ring-2 ring-mine-warning',
      iconBg: 'bg-mine-warning/10 text-mine-warning',
      countColor: 'text-mine-warning',
      badge: 'bg-mine-warning/15 text-mine-warning',
    },
    critical: {
      border: 'border-mine-critical/40',
      activeRing: 'ring-2 ring-mine-critical',
      iconBg: 'bg-mine-critical/10 text-mine-critical',
      countColor: 'text-mine-critical',
      badge: 'bg-mine-critical/15 text-mine-critical',
    },
    gray: {
      border: 'border-mine-border',
      activeRing: 'ring-2 ring-gray-400',
      iconBg: 'bg-gray-500/10 text-gray-400',
      countColor: 'text-gray-300',
      badge: 'bg-gray-500/15 text-gray-400',
    },
  };

  const scheme = colorMap[colorScheme];

  return (
    <div
      onClick={onClick}
      className={`p-4 rounded-xl bg-mine-card border ${scheme.border} ${
        active ? scheme.activeRing : ''
      } transition-all duration-200 ${
        onClick ? 'cursor-pointer hover:bg-mine-cardSec/80 hover:translate-y-[-2px]' : ''
      } shadow-lg`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-mine-textSecondary">
          {label}
        </span>
        <div className={`p-2 rounded-lg ${scheme.iconBg}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="flex items-baseline gap-2">
        <span className={`text-3xl font-extrabold tracking-tight font-mono ${scheme.countColor}`}>
          {count}
        </span>
        <span className="text-[11px] text-mine-textSecondary font-medium">Zones</span>
      </div>
      <p className="mt-2 text-xs text-mine-textSecondary flex items-center gap-1.5 truncate">
        {subtext}
      </p>
    </div>
  );
};
