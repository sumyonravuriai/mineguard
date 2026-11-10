import React from 'react';
import { ShieldCheck, ShieldAlert, AlertTriangle, AlertCircle, Info, Radio, Layers } from 'lucide-react';
import { useMineGuard } from '../context/MineGuardContext';

export const MineStatusBanner: React.FC = () => {
  const { summary, demoMode } = useMineGuard();
  const status = summary.overallStatus;

  const getStatusConfig = () => {
    switch (status) {
      case 'CRITICAL':
        return {
          title: 'CRITICAL HAZARD DETECTED',
          desc: 'Toxic gas or environmental threshold breached in one or more underground zones. Immediate evacuation / ventilation response required.',
          badge: 'CRITICAL ALERT',
          border: 'border-mine-critical',
          bg: 'bg-gradient-to-r from-[#2a0e14] via-mine-card to-[#2a0e14]',
          icon: <ShieldAlert className="w-9 h-9 text-mine-critical animate-bounce" />,
          colorText: 'text-mine-critical',
          ring: 'ring-1 ring-mine-critical/50',
        };
      case 'WARNING':
        return {
          title: 'ENVIRONMENTAL WARNING ACTIVE',
          desc: 'Atmospheric readings or heartbeat timeout requiring ventilation adjustment or telemetry verification.',
          badge: 'WARNING LIMIT BREACH',
          border: 'border-mine-warning',
          bg: 'bg-gradient-to-r from-[#291b0c] via-mine-card to-[#291b0c]',
          icon: <AlertTriangle className="w-9 h-9 text-mine-warning" />,
          colorText: 'text-mine-warning',
          ring: 'ring-1 ring-mine-warning/50',
        };
      case 'OFFLINE':
        return {
          title: 'COMMUNICATION LINK DEGRADED',
          desc: 'One or more zone transceiver nodes failed heartbeat transmission. Stale data cannot be certified safe.',
          badge: 'DEVICE OFFLINE',
          border: 'border-gray-500',
          bg: 'bg-gradient-to-r from-[#1c1f2b] via-mine-card to-[#1c1f2b]',
          icon: <AlertCircle className="w-9 h-9 text-gray-400" />,
          colorText: 'text-gray-300',
          ring: 'ring-1 ring-gray-500/50',
        };
      default:
        return {
          title: 'OVERALL MINE ENVIRONMENT: NORMAL & SAFE',
          desc: 'All monitored atmospheric gases and parameters are well within statutory DGMS and OSHA permissible exposure limits.',
          badge: 'ALL ZONES OPTIMAL',
          border: 'border-mine-success/40',
          bg: 'bg-gradient-to-r from-[#0c2217]/80 via-mine-card to-[#0c2217]/80',
          icon: <ShieldCheck className="w-9 h-9 text-mine-success" />,
          colorText: 'text-mine-success',
          ring: 'ring-1 ring-mine-success/30',
        };
    }
  };

  const cfg = getStatusConfig();

  return (
    <div
      className={`relative p-5 sm:p-6 rounded-2xl border ${cfg.border} ${cfg.bg} ${cfg.ring} shadow-2xl overflow-hidden`}
    >
      {/* Background glow */}
      <div className="absolute top-0 right-0 w-96 h-full bg-white/[0.02] -skew-x-12 pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Left Status Indicator */}
        <div className="flex items-start sm:items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-mine-bg/80 border border-mine-border/80 shrink-0 shadow-inner">
            {cfg.icon}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span
                className={`px-2.5 py-0.5 rounded-md text-[11px] font-extrabold uppercase tracking-wider ${
                  status === 'CRITICAL'
                    ? 'bg-mine-critical text-white'
                    : status === 'WARNING'
                    ? 'bg-mine-warning text-black font-black'
                    : 'bg-mine-success/20 text-mine-success border border-mine-success/40'
                }`}
              >
                {cfg.badge}
              </span>
              {demoMode && (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-mine-info/15 text-mine-info border border-mine-info/30 flex items-center gap-1">
                  <Radio className="w-3 h-3 text-mine-info animate-pulse" /> SIMULATED TELEMETRY
                </span>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-mine-textPrimary tracking-tight">
              {cfg.title}
            </h2>
            <p className="text-xs sm:text-sm text-mine-textSecondary mt-1 max-w-2xl leading-relaxed">
              {cfg.desc}
            </p>
          </div>
        </div>

        {/* Right Status Breakdown Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-mine-bg/70 p-3.5 rounded-xl border border-mine-border/70 backdrop-blur-sm self-stretch lg:self-auto">
          <div className="text-center px-2">
            <div className="text-xs text-mine-textSecondary font-medium">Safe Zones</div>
            <div className="text-xl font-bold font-mono text-mine-success mt-0.5">
              {summary.normalZones}
            </div>
          </div>
          <div className="text-center px-2 border-l border-mine-border/50">
            <div className="text-xs text-mine-textSecondary font-medium">Warnings</div>
            <div className="text-xl font-bold font-mono text-mine-warning mt-0.5">
              {summary.warningZones}
            </div>
          </div>
          <div className="text-center px-2 border-l border-mine-border/50">
            <div className="text-xs text-mine-textSecondary font-medium">Critical</div>
            <div className="text-xl font-bold font-mono text-mine-critical mt-0.5">
              {summary.criticalZones}
            </div>
          </div>
          <div className="text-center px-2 border-l border-mine-border/50">
            <div className="text-xs text-mine-textSecondary font-medium">Offline</div>
            <div className="text-xl font-bold font-mono text-gray-400 mt-0.5">
              {summary.offlineZones}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
