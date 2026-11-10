import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  Radio,
  Search,
  Filter,
  Wifi,
  WifiOff,
  ArrowRight,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { useMineGuard } from '../context/MineGuardContext';
import { MineStatusBanner } from '../components/MineStatusBanner';

export const LiveMonitoring: React.FC = () => {
  const { zones, lastSync, demoMode } = useMineGuard();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const filteredZones = useMemo(() => {
    return zones.filter((z) => {
      const match =
        z.zone_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        z.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        z.location.toLowerCase().includes(searchQuery.toLowerCase());
      if (!match) return false;

      if (statusFilter === 'ALL') return true;
      if (statusFilter === 'NORMAL') return z.status === 'NORMAL';
      if (statusFilter === 'WARNING') return z.status === 'WARNING';
      if (statusFilter === 'CRITICAL') return z.status === 'CRITICAL';
      if (statusFilter === 'OFFLINE') return z.device_status === 'OFFLINE' || z.status === 'OFFLINE';
      return true;
    });
  }, [zones, searchQuery, statusFilter]);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <section>
        <MineStatusBanner />
      </section>

      {/* Live Stream Status Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-mine-card border border-mine-border shadow-lg">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center">
            <span className="w-3 h-3 rounded-full bg-mine-success" />
            <span className="absolute w-3 h-3 rounded-full bg-mine-success animate-ping" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-mine-textPrimary flex items-center gap-2">
              Synchronous Underground Telemetry Matrix
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-mine-success/15 text-mine-success border border-mine-success/30">
                LIVE STREAM
              </span>
            </h3>
            <p className="text-xs text-mine-textSecondary">
              Packets received via MQTT & Socket.IO. Auto-updating continuously without manual reload.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs text-mine-textSecondary font-mono self-start sm:self-auto">
          <span className="px-2.5 py-1 rounded-lg bg-mine-cardSec border border-mine-border flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-mine-info" />
            Last Packet: {lastSync.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 rounded-xl bg-mine-card border border-mine-border shadow-lg">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-mine-textSecondary" />
          <input
            type="text"
            placeholder="Filter matrix by zone ID, name, or shaft..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-lg bg-mine-cardSec border border-mine-border text-mine-textPrimary placeholder:text-mine-textSecondary focus:outline-none focus:border-mine-info transition-colors"
          />
        </div>

        <div className="flex items-center bg-mine-cardSec p-1 rounded-lg border border-mine-border text-xs">
          {['ALL', 'NORMAL', 'WARNING', 'CRITICAL', 'OFFLINE'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-md text-[11px] font-bold transition-all ${
                statusFilter === st
                  ? 'bg-mine-info text-white shadow-sm'
                  : 'text-mine-textSecondary hover:text-white'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Compact Real-Time Telemetry Matrix Table */}
      <div className="rounded-2xl bg-mine-card border border-mine-border shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0E1526] text-mine-textSecondary uppercase tracking-wider font-semibold border-b border-mine-border">
              <tr>
                <th className="py-4 px-5">Mine Zone</th>
                <th className="py-4 px-5">Temperature</th>
                <th className="py-4 px-5">Humidity</th>
                <th className="py-4 px-5">CO (ppm)</th>
                <th className="py-4 px-5">CO2 (ppm)</th>
                <th className="py-4 px-5">NO2 (ppm)</th>
                <th className="py-4 px-5">Environmental Status</th>
                <th className="py-4 px-5">Transceiver Link</th>
                <th className="py-4 px-5">Last Updated</th>
                <th className="py-4 px-5 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-mine-border/50 font-mono">
              {filteredZones.map((z) => {
                const r = z.latest_reading;
                const isOnline = z.device_status === 'ONLINE' && !z.is_stale;
                const isCoWarn = r && r.co !== null && r.co !== undefined && r.co >= 25;
                const isCoCrit = r && r.co !== null && r.co !== undefined && r.co >= 50;
                const isCo2Warn = r && r.co2 !== null && r.co2 !== undefined && r.co2 >= 2500;
                const isCo2Crit = r && r.co2 !== null && r.co2 !== undefined && r.co2 >= 5000;
                const isNo2Warn = r && r.no2 !== null && r.no2 !== undefined && r.no2 >= 2.0;
                const isNo2Crit = r && r.no2 !== null && r.no2 !== undefined && r.no2 >= 3.0;
                const isTempWarn = r && r.temperature !== null && r.temperature !== undefined && r.temperature >= 30.5;

                return (
                  <tr
                    key={z.id}
                    onClick={() => navigate(`/zones/${z.id}`)}
                    className="hover:bg-mine-cardSec/60 cursor-pointer transition-colors group"
                  >
                    {/* Zone */}
                    <td className="py-3.5 px-5 font-sans">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-mine-info" />
                        <div>
                          <div className="font-bold text-mine-textPrimary group-hover:text-mine-info transition-colors">
                            {z.zone_name}
                          </div>
                          <div className="text-[10px] text-mine-textSecondary font-mono">{z.id} • {z.location}</div>
                        </div>
                      </div>
                    </td>

                    {/* Temp */}
                    <td className={`py-3.5 px-5 font-bold ${isTempWarn ? 'text-mine-warning font-black' : 'text-white'}`}>
                      {r ? `${r.temperature}°C` : '--'}
                    </td>

                    {/* Humidity */}
                    <td className="py-3.5 px-5 text-white font-semibold">
                      {r ? `${r.humidity}%` : '--'}
                    </td>

                    {/* CO */}
                    <td
                      className={`py-3.5 px-5 font-bold ${
                        isCoCrit
                          ? 'text-mine-critical font-black'
                          : isCoWarn
                          ? 'text-mine-warning font-black'
                          : 'text-white'
                      }`}
                    >
                      {r ? `${r.co} ppm` : '--'}
                    </td>

                    {/* CO2 */}
                    <td
                      className={`py-3.5 px-5 font-bold ${
                        isCo2Crit
                          ? 'text-mine-critical font-black'
                          : isCo2Warn
                          ? 'text-mine-warning font-black'
                          : 'text-white'
                      }`}
                    >
                      {r ? `${r.co2} ppm` : '--'}
                    </td>

                    {/* NO2 */}
                    <td
                      className={`py-3.5 px-5 font-bold ${
                        isNo2Crit
                          ? 'text-mine-critical font-black'
                          : isNo2Warn
                          ? 'text-mine-warning font-black'
                          : 'text-white'
                      }`}
                    >
                      {r ? `${r.no2} ppm` : '--'}
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-5 font-sans">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-black uppercase rounded ${
                          !isOnline || z.status === 'OFFLINE'
                            ? 'bg-gray-500/20 text-gray-300'
                            : z.status === 'CRITICAL'
                            ? 'bg-mine-critical text-white'
                            : z.status === 'WARNING'
                            ? 'bg-mine-warning text-black font-black'
                            : 'bg-mine-success/20 text-mine-success'
                        }`}
                      >
                        {z.status === 'CRITICAL' && <ShieldAlert className="w-3 h-3" />}
                        {z.status === 'WARNING' && <AlertTriangle className="w-3 h-3" />}
                        {z.status === 'NORMAL' && <CheckCircle2 className="w-3 h-3" />}
                        {z.status}
                      </span>
                    </td>

                    {/* Transceiver Link */}
                    <td className="py-3.5 px-5 font-sans text-xs">
                      <span
                        className={`inline-flex items-center gap-1 font-semibold ${
                          isOnline ? 'text-mine-success' : 'text-gray-400'
                        }`}
                      >
                        {isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
                        {isOnline ? 'ONLINE' : 'OFFLINE'}
                      </span>
                    </td>

                    {/* Last Updated */}
                    <td className="py-3.5 px-5 text-mine-textSecondary text-[11px]">
                      {r ? new Date(r.timestamp).toLocaleTimeString() : 'N/A'}
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-5 text-right font-sans">
                      <span className="text-mine-info group-hover:text-white flex items-center justify-end gap-1 font-semibold text-xs">
                        Details <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
