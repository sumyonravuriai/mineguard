import React, { useState } from 'react';
import { X, Play, ShieldAlert, AlertTriangle, CheckCircle, WifiOff, Info } from 'lucide-react';
import { useMineGuard } from '../context/MineGuardContext';

interface ScenarioSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultZoneId?: string;
}

export const ScenarioSimulatorModal: React.FC<ScenarioSimulatorModalProps> = ({
  isOpen,
  onClose,
  defaultZoneId,
}) => {
  const { zones, triggerScenario } = useMineGuard();
  const [selectedZone, setSelectedZone] = useState<string>(defaultZoneId || 'ZONE_02');
  const [selectedScenario, setSelectedScenario] = useState<'NORMAL' | 'WARNING' | 'CRITICAL' | 'OFFLINE'>('WARNING');
  const [duration, setDuration] = useState<number>(60);
  const [loading, setLoading] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleApply = async () => {
    setLoading(true);
    await triggerScenario(selectedZone, selectedScenario, duration);
    setLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-mine-card border border-mine-border rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 px-6 border-b border-mine-border bg-[#0E1526]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-mine-info/10 text-mine-info border border-mine-info/30">
              <Play className="w-4 h-4 fill-mine-info text-mine-info" />
            </div>
            <div>
              <h3 className="text-base font-bold text-mine-textPrimary">
                Test Scenario Simulator
              </h3>
              <p className="text-xs text-mine-textSecondary">
                Simulate real-time atmospheric conditions & hardware telemetry
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-mine-textSecondary hover:text-white rounded-lg hover:bg-mine-cardSec transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 text-sm">
          {/* Target Zone Selection */}
          <div>
            <label className="block text-xs font-semibold text-mine-textSecondary uppercase tracking-wider mb-2">
              Target Mine Zone
            </label>
            <select
              value={selectedZone}
              onChange={(e) => setSelectedZone(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg bg-mine-cardSec border border-mine-border text-mine-textPrimary focus:outline-none focus:border-mine-info transition-colors font-medium"
            >
              {zones.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.id}: {z.zone_name}
                </option>
              ))}
            </select>
          </div>

          {/* Scenario Condition Selection */}
          <div>
            <label className="block text-xs font-semibold text-mine-textSecondary uppercase tracking-wider mb-2">
              Atmospheric / Telemetry Condition
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {/* NORMAL */}
              <button
                type="button"
                onClick={() => setSelectedScenario('NORMAL')}
                className={`flex items-start gap-2.5 p-3 rounded-xl border text-left transition-all ${
                  selectedScenario === 'NORMAL'
                    ? 'border-mine-success bg-mine-success/15 ring-1 ring-mine-success/50'
                    : 'border-mine-border bg-mine-cardSec hover:border-mine-border/80'
                }`}
              >
                <CheckCircle className="w-4 h-4 text-mine-success mt-0.5 shrink-0" />
                <div>
                  <div className="font-bold text-mine-textPrimary text-xs">NORMAL SAFE</div>
                  <div className="text-[11px] text-mine-textSecondary mt-0.5">
                    Clear air, CO &lt; 10 ppm, CO2 &lt; 700 ppm, optimal ventilation.
                  </div>
                </div>
              </button>

              {/* WARNING */}
              <button
                type="button"
                onClick={() => setSelectedScenario('WARNING')}
                className={`flex items-start gap-2.5 p-3 rounded-xl border text-left transition-all ${
                  selectedScenario === 'WARNING'
                    ? 'border-mine-warning bg-mine-warning/15 ring-1 ring-mine-warning/50'
                    : 'border-mine-border bg-mine-cardSec hover:border-mine-border/80'
                }`}
              >
                <AlertTriangle className="w-4 h-4 text-mine-warning mt-0.5 shrink-0" />
                <div>
                  <div className="font-bold text-mine-textPrimary text-xs">WARNING LIMIT</div>
                  <div className="text-[11px] text-mine-textSecondary mt-0.5">
                    Elevated CO (28.5 ppm) or high humidity/temp.
                  </div>
                </div>
              </button>

              {/* CRITICAL */}
              <button
                type="button"
                onClick={() => setSelectedScenario('CRITICAL')}
                className={`flex items-start gap-2.5 p-3 rounded-xl border text-left transition-all ${
                  selectedScenario === 'CRITICAL'
                    ? 'border-mine-critical bg-mine-critical/15 ring-1 ring-mine-critical/50'
                    : 'border-mine-border bg-mine-cardSec hover:border-mine-border/80'
                }`}
              >
                <ShieldAlert className="w-4 h-4 text-mine-critical mt-0.5 shrink-0" />
                <div>
                  <div className="font-bold text-mine-textPrimary text-xs">CRITICAL HAZARD</div>
                  <div className="text-[11px] text-mine-textSecondary mt-0.5">
                    CO &gt; 50 ppm, CO2 &gt; 5000 ppm. Immediate alarm!
                  </div>
                </div>
              </button>

              {/* OFFLINE */}
              <button
                type="button"
                onClick={() => setSelectedScenario('OFFLINE')}
                className={`flex items-start gap-2.5 p-3 rounded-xl border text-left transition-all ${
                  selectedScenario === 'OFFLINE'
                    ? 'border-gray-400 bg-gray-500/20 ring-1 ring-gray-400/50'
                    : 'border-mine-border bg-mine-cardSec hover:border-mine-border/80'
                }`}
              >
                <WifiOff className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <div className="font-bold text-mine-textPrimary text-xs">OFFLINE / PACKET LOSS</div>
                  <div className="text-[11px] text-mine-textSecondary mt-0.5">
                    Drop heartbeat to test offline detection & stale data.
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Duration */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-mine-textSecondary uppercase tracking-wider">
                Simulation Duration
              </label>
              <span className="text-xs font-mono font-bold text-mine-info">
                {duration} seconds
              </span>
            </div>
            <input
              type="range"
              min={15}
              max={300}
              step={15}
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-full accent-mine-info cursor-pointer"
            />
          </div>

          {/* Regulatory Note */}
          <div className="flex items-start gap-2 p-3 rounded-lg bg-mine-info/10 border border-mine-info/20 text-xs text-mine-textSecondary leading-relaxed">
            <Info className="w-4 h-4 text-mine-info shrink-0 mt-0.5" />
            <span>
              This simulation verifies real-time Socket.IO broadcasts, database recording, threshold evaluation, and automatic offline fail-safe alarms without physical hardware.
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 px-6 border-t border-mine-border bg-[#0E1526]">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-mine-textSecondary hover:text-white rounded-lg hover:bg-mine-cardSec transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-mine-info hover:bg-mine-info/90 rounded-lg shadow-lg shadow-mine-info/20 transition-all disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            {loading ? 'Dispatching...' : 'Dispatch Scenario'}
          </button>
        </div>
      </div>
    </div>
  );
};
