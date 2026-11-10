import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Navigation, Eye, ArrowDown, Wind, Activity } from 'lucide-react';
import { useMineGuard } from '../context/MineGuardContext';
import { ZoneStatus } from '../types';

export const MineMap: React.FC = () => {
  const { zones } = useMineGuard();
  const navigate = useNavigate();
  const [hoveredZoneId, setHoveredZoneId] = useState<string | null>(null);

  // Map zone data by ID
  const zoneMap = new Map(zones.map((z) => [z.id, z]));

  const getNodeColor = (status?: ZoneStatus, isOnline?: boolean) => {
    if (!isOnline || status === 'OFFLINE') return { fill: '#334155', stroke: '#64748B', text: '#94A3B8' };
    if (status === 'CRITICAL') return { fill: '#EF4444', stroke: '#F87171', text: '#FFFFFF' };
    if (status === 'WARNING') return { fill: '#F59E0B', stroke: '#FBBF24', text: '#000000' };
    return { fill: '#22C55E', stroke: '#4ADE80', text: '#FFFFFF' };
  };

  // Schematic node positions: [x, y, levelLabel]
  const nodeConfig: Record<string, { x: number; y: number; label: string; depth: string }> = {
    ZONE_01: { x: 120, y: 70, label: 'Portal Shaft / Entrance', depth: 'Level 0m (Surface)' },
    ZONE_04: { x: 380, y: 150, label: 'Haulage Crosscut B-9', depth: 'Level -80m' },
    ZONE_05: { x: 220, y: 260, label: 'Substation & Pump Bay', depth: 'Level -150m' },
    ZONE_02: { x: 550, y: 260, label: 'Mining Section A (East)', depth: 'Level -180m' },
    ZONE_03: { x: 700, y: 360, label: 'Longwall Face B (Coal Seam)', depth: 'Level -250m' },
    ZONE_06: { x: 820, y: 160, label: 'Return Ventilation Fan', depth: 'Exhaust Shaft' },
  };

  const hoveredZone = hoveredZoneId ? zoneMap.get(hoveredZoneId) : null;

  return (
    <div className="rounded-2xl bg-mine-card border border-mine-border p-5 shadow-xl relative overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 rounded bg-mine-info/15 text-mine-info">
              <Navigation className="w-4 h-4" />
            </span>
            <h3 className="text-base font-bold text-mine-textPrimary">
              Underground Mine Schematic Layout
            </h3>
          </div>
          <p className="text-xs text-mine-textSecondary mt-0.5">
            Interactive multi-level atmospheric telemetry network. Click any node to drill down.
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 text-xs bg-mine-cardSec/80 px-3 py-1.5 rounded-lg border border-mine-border/60">
          <span className="flex items-center gap-1.5 text-mine-textSecondary">
            <span className="w-2.5 h-2.5 rounded-full bg-mine-success" /> Safe
          </span>
          <span className="flex items-center gap-1.5 text-mine-textSecondary">
            <span className="w-2.5 h-2.5 rounded-full bg-mine-warning" /> Warning
          </span>
          <span className="flex items-center gap-1.5 text-mine-textSecondary">
            <span className="w-2.5 h-2.5 rounded-full bg-mine-critical" /> Critical
          </span>
          <span className="flex items-center gap-1.5 text-mine-textSecondary">
            <span className="w-2.5 h-2.5 rounded-full bg-gray-500" /> Offline
          </span>
        </div>
      </div>

      {/* SVG Canvas Map */}
      <div className="relative w-full overflow-x-auto bg-[#080d19] rounded-xl border border-mine-border/70 p-2 sm:p-4">
        <svg
          viewBox="0 0 920 440"
          className="w-full min-w-[650px] h-auto select-none font-sans"
        >
          <defs>
            {/* Grid pattern */}
            <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
              <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#162238" strokeWidth="0.8" />
            </pattern>
            {/* Airflow gradient */}
            <linearGradient id="airGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#818CF8" stopOpacity="0.1" />
            </linearGradient>
          </defs>

          {/* Background Grid */}
          <rect width="920" height="440" fill="url(#grid)" />

          {/* Geological strata lines / depth markers */}
          <line x1="40" y1="90" x2="880" y2="90" stroke="#1E293B" strokeWidth="1" strokeDasharray="4 4" />
          <text x="50" y="85" fill="#475569" fontSize="10" fontFamily="monospace">SURFACE LEVEL 0m</text>

          <line x1="40" y1="180" x2="880" y2="180" stroke="#1E293B" strokeWidth="1" strokeDasharray="4 4" />
          <text x="50" y="175" fill="#475569" fontSize="10" fontFamily="monospace">INTERMEDIATE -100m</text>

          <line x1="40" y1="280" x2="880" y2="280" stroke="#1E293B" strokeWidth="1" strokeDasharray="4 4" />
          <text x="50" y="275" fill="#475569" fontSize="10" fontFamily="monospace">WORKING HORIZON -200m</text>

          <line x1="40" y1="380" x2="880" y2="380" stroke="#1E293B" strokeWidth="1" strokeDasharray="4 4" />
          <text x="50" y="375" fill="#475569" fontSize="10" fontFamily="monospace">DEEP SEAM -300m</text>

          {/* Mine Shaft & Haulage Tunnel Corridors (thick industrial lines) */}
          {/* Main Portal Shaft down to Level -150m */}
          <path
            d="M 120 70 L 120 260 L 220 260"
            fill="none"
            stroke="#263449"
            strokeWidth="12"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Main incline to Tunnel 04 */}
          <path
            d="M 120 70 L 380 150 L 550 260 L 700 360"
            fill="none"
            stroke="#263449"
            strokeWidth="12"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Return Ventilation airway from Section B & A to Section 06 */}
          <path
            d="M 700 360 L 820 160"
            fill="none"
            stroke="#1e3a5f"
            strokeWidth="8"
            strokeDasharray="8 6"
            strokeLinecap="round"
          />
          <path
            d="M 550 260 L 820 160"
            fill="none"
            stroke="#1e3a5f"
            strokeWidth="8"
            strokeDasharray="8 6"
            strokeLinecap="round"
          />

          {/* Airflow direction arrows (blue pulse) */}
          <g fill="#38BDF8" opacity="0.7">
            <polygon points="250,110 265,115 250,120" />
            <polygon points="460,200 475,205 460,210" />
            <polygon points="620,305 635,310 620,315" />
            <polygon points="765,250 755,240 770,240" />
          </g>

          {/* Ventilation airflow label */}
          <text x="730" y="220" fill="#38BDF8" fontSize="10" fontWeight="bold">
            Intake Airflow ➔
          </text>
          <text x="790" y="130" fill="#F59E0B" fontSize="10" fontWeight="bold">
            Exhaust Fan ⬆
          </text>

          {/* Draw Zone Nodes */}
          {Object.entries(nodeConfig).map(([id, cfg]) => {
            const z = zoneMap.get(id);
            const isOnline = z?.device_status === 'ONLINE' && !z?.is_stale;
            const status = z?.status;
            const colors = getNodeColor(status, isOnline);
            const isHovered = hoveredZoneId === id;
            const reading = z?.latest_reading;

            return (
              <g
                key={id}
                className="cursor-pointer transition-transform duration-200"
                onClick={() => navigate(`/zones/${id}`)}
                onMouseEnter={() => setHoveredZoneId(id)}
                onMouseLeave={() => setHoveredZoneId(null)}
              >
                {/* Node Outer Ring & Pulse if Critical or Warning */}
                {status === 'CRITICAL' && (
                  <circle
                    cx={cfg.x}
                    cy={cfg.y}
                    r={isHovered ? 34 : 28}
                    fill="none"
                    stroke="#EF4444"
                    strokeWidth="2.5"
                    className="animate-ping"
                    opacity="0.6"
                  />
                )}

                {/* Node Body Circle */}
                <circle
                  cx={cfg.x}
                  cy={cfg.y}
                  r={isHovered ? 26 : 22}
                  fill="#111827"
                  stroke={colors.stroke}
                  strokeWidth={isHovered ? 4 : 2.5}
                  className="transition-all"
                />

                {/* Inner Core */}
                <circle
                  cx={cfg.x}
                  cy={cfg.y}
                  r={10}
                  fill={colors.fill}
                />

                {/* Zone ID Tag */}
                <rect
                  x={cfg.x - 30}
                  y={cfg.y + (isHovered ? 30 : 26)}
                  width="60"
                  height="18"
                  rx="4"
                  fill="#1E293B"
                  stroke="#334155"
                  strokeWidth="1"
                />
                <text
                  x={cfg.x}
                  y={cfg.y + (isHovered ? 42 : 38)}
                  fill="#F8FAFC"
                  fontSize="9.5"
                  fontWeight="bold"
                  textAnchor="middle"
                  fontFamily="monospace"
                >
                  {id}
                </text>

                {/* Zone Short Label */}
                <text
                  x={cfg.x}
                  y={cfg.y - (isHovered ? 32 : 28)}
                  fill="#CBD5E1"
                  fontSize="10"
                  fontWeight="600"
                  textAnchor="middle"
                >
                  {z?.zone_name.split('–')[1]?.trim() || cfg.label}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Hover / Tooltip Card Floating on Map */}
        {hoveredZone && (
          <div className="absolute bottom-4 left-4 p-3.5 rounded-xl bg-mine-card/95 border border-mine-border shadow-2xl backdrop-blur-md text-xs w-64 z-20 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-bold text-mine-textPrimary font-mono">
                {hoveredZone.id}
              </span>
              <span
                className={`px-1.5 py-0.5 text-[9px] font-black rounded uppercase ${
                  hoveredZone.status === 'CRITICAL'
                    ? 'bg-mine-critical text-white'
                    : hoveredZone.status === 'WARNING'
                    ? 'bg-mine-warning text-black'
                    : hoveredZone.status === 'OFFLINE'
                    ? 'bg-gray-500 text-white'
                    : 'bg-mine-success text-white'
                }`}
              >
                {hoveredZone.status}
              </span>
            </div>
            <p className="text-xs font-semibold text-mine-textPrimary truncate">
              {hoveredZone.zone_name}
            </p>
            <p className="text-[11px] text-mine-textSecondary truncate mb-2">
              {hoveredZone.location}
            </p>

            <div className="grid grid-cols-2 gap-1.5 text-[11px] border-t border-mine-border/60 pt-2 font-mono">
              <div>Temp: <span className="text-white font-bold">{hoveredZone.latest_reading?.temperature ?? '--'}°C</span></div>
              <div>Hum: <span className="text-white font-bold">{hoveredZone.latest_reading?.humidity ?? '--'}%</span></div>
              <div>CO: <span className="text-white font-bold">{hoveredZone.latest_reading?.co ?? '--'} ppm</span></div>
              <div>CO2: <span className="text-white font-bold">{hoveredZone.latest_reading?.co2 ?? '--'} ppm</span></div>
            </div>

            <div className="mt-2 text-center text-[10px] text-mine-info font-medium">
              Click node to open full zone telemetry ➔
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
