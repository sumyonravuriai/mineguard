import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Layers,
  Radio,
  WifiOff,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Search,
  Filter,
  ArrowUpDown,
  Bell,
  Check,
  ChevronRight,
  MapPin,
  Clock,
  Sparkles,
} from 'lucide-react';
import { useMineGuard } from '../context/MineGuardContext';
import { SummaryCard } from '../components/SummaryCard';
import { MineStatusBanner } from '../components/MineStatusBanner';
import { ZoneCard } from '../components/ZoneCard';
import { MineMap } from '../components/MineMap';

export const Dashboard: React.FC = () => {
  const { summary, zones, alerts, acknowledgeAlert } = useMineGuard();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'name' | 'severity' | 'updated'>('severity');

  // Filter and sort zones
  const filteredZones = useMemo(() => {
    return zones
      .filter((zone) => {
        const matchesSearch =
          zone.zone_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          zone.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
          zone.location.toLowerCase().includes(searchQuery.toLowerCase());

        if (!matchesSearch) return false;

        if (statusFilter === 'ALL') return true;
        if (statusFilter === 'ONLINE') return zone.device_status === 'ONLINE';
        if (statusFilter === 'OFFLINE') return zone.device_status === 'OFFLINE';
        if (statusFilter === 'NORMAL') return zone.status === 'NORMAL';
        if (statusFilter === 'WARNING') return zone.status === 'WARNING';
        if (statusFilter === 'CRITICAL') return zone.status === 'CRITICAL';
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'name') {
          return a.id.localeCompare(b.id);
        }
        if (sortBy === 'severity') {
          const rank: Record<string, number> = { CRITICAL: 4, WARNING: 3, OFFLINE: 2, NORMAL: 1, UNKNOWN: 0 };
          return (rank[b.status] || 0) - (rank[a.status] || 0);
        }
        if (sortBy === 'updated') {
          const timeA = a.latest_reading ? new Date(a.latest_reading.timestamp).getTime() : 0;
          const timeB = b.latest_reading ? new Date(b.latest_reading.timestamp).getTime() : 0;
          return timeB - timeA;
        }
        return 0;
      });
  }, [zones, searchQuery, statusFilter, sortBy]);

  const recentAlerts = alerts.slice(0, 5);

  return (
    <div className="space-y-6 pb-12">
      {/* SECTION A: Overall Mine Environmental Status */}
      <section>
        <MineStatusBanner />
      </section>

      {/* SECTION B: 6 Summary Cards */}
      <section className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3.5">
        <SummaryCard
          label="Total Zones"
          count={summary.totalZones}
          icon={Layers}
          colorScheme="info"
          subtext="Underground sectors"
          onClick={() => setStatusFilter('ALL')}
          active={statusFilter === 'ALL'}
        />
        <SummaryCard
          label="Active Transceivers"
          count={summary.activeZones}
          icon={Radio}
          colorScheme="info"
          subtext="ESP32 nodes streaming"
          onClick={() => setStatusFilter('ONLINE')}
          active={statusFilter === 'ONLINE'}
        />
        <SummaryCard
          label="Offline Transceivers"
          count={summary.offlineZones}
          icon={WifiOff}
          colorScheme="gray"
          subtext="Heartbeat timeout"
          onClick={() => setStatusFilter('OFFLINE')}
          active={statusFilter === 'OFFLINE'}
        />
        <SummaryCard
          label="Normal Zones"
          count={summary.normalZones}
          icon={CheckCircle2}
          colorScheme="success"
          subtext="Permissible limits"
          onClick={() => setStatusFilter('NORMAL')}
          active={statusFilter === 'NORMAL'}
        />
        <SummaryCard
          label="Warning Zones"
          count={summary.warningZones}
          icon={AlertTriangle}
          colorScheme="warning"
          subtext="Action limit advisory"
          onClick={() => setStatusFilter('WARNING')}
          active={statusFilter === 'WARNING'}
        />
        <SummaryCard
          label="Critical Hazards"
          count={summary.criticalZones}
          icon={ShieldAlert}
          colorScheme="critical"
          subtext="Immediate evacuation"
          onClick={() => setStatusFilter('CRITICAL')}
          active={statusFilter === 'CRITICAL'}
        />
      </section>

      {/* SECTION 13: Interactive Mine Schematic Map Preview */}
      <section>
        <MineMap />
      </section>

      {/* SECTION C & D: Search, Filters & Mine Zone Monitoring Grid */}
      <section className="space-y-4">
        {/* Controls Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 rounded-xl bg-mine-card border border-mine-border">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-mine-textSecondary" />
            <input
              type="text"
              placeholder="Search by zone name, zone ID, or tunnel location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs rounded-lg bg-mine-cardSec border border-mine-border text-mine-textPrimary placeholder:text-mine-textSecondary focus:outline-none focus:border-mine-info transition-colors"
            />
          </div>

          {/* Filter Pills & Sorting */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 bg-mine-cardSec p-1 rounded-lg border border-mine-border text-xs">
              {['ALL', 'NORMAL', 'WARNING', 'CRITICAL', 'OFFLINE'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                    statusFilter === st
                      ? 'bg-mine-info text-white shadow-sm'
                      : 'text-mine-textSecondary hover:text-white'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            {/* Sort Selector */}
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-mine-cardSec border border-mine-border text-xs text-mine-textSecondary">
              <ArrowUpDown className="w-3.5 h-3.5 text-mine-info" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent text-mine-textPrimary text-xs focus:outline-none cursor-pointer font-medium"
              >
                <option value="severity" className="bg-mine-card">Sort: Severity</option>
                <option value="name" className="bg-mine-card">Sort: Zone ID</option>
                <option value="updated" className="bg-mine-card">Sort: Latest Telemetry</option>
              </select>
            </div>
          </div>
        </div>

        {/* Zone Cards Grid */}
        {filteredZones.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-mine-card border border-mine-border">
            <p className="text-sm font-semibold text-mine-textPrimary">No mine zones match your filters</p>
            <p className="text-xs text-mine-textSecondary mt-1">
              Try adjusting your search criteria or status filter.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('ALL');
              }}
              className="mt-3 px-3 py-1.5 text-xs font-semibold text-mine-info bg-mine-info/10 rounded-lg hover:bg-mine-info/20"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filteredZones.map((zone) => (
              <ZoneCard key={zone.id} zone={zone} />
            ))}
          </div>
        )}
      </section>

      {/* SECTION E: Recent Alerts Section */}
      <section className="p-5 rounded-2xl bg-mine-card border border-mine-border shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-mine-warning/10 text-mine-warning">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-mine-textPrimary">
                Recent Regulatory Alerts & Threshold Breaches
              </h3>
              <p className="text-xs text-mine-textSecondary">
                Latest 5 safety occurrences recorded by the underground monitoring network
              </p>
            </div>
          </div>
          <Link
            to="/alerts"
            className="flex items-center gap-1 text-xs font-bold text-mine-info hover:text-white transition-colors"
          >
            <span>View All Alerts</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {recentAlerts.length === 0 ? (
          <div className="p-6 text-center text-xs text-mine-textSecondary">
            No safety alerts recorded. All mine atmospheric parameters are nominal.
          </div>
        ) : (
          <div className="divide-y divide-mine-border/60">
            {recentAlerts.map((alert) => (
              <div
                key={alert.id}
                className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`px-2 py-0.5 text-[10px] font-black uppercase rounded mt-0.5 shrink-0 ${
                      alert.severity === 'CRITICAL'
                        ? 'bg-mine-critical text-white'
                        : alert.severity === 'WARNING'
                        ? 'bg-mine-warning text-black font-extrabold'
                        : 'bg-gray-500/20 text-gray-300'
                    }`}
                  >
                    {alert.severity}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-mine-textPrimary">
                        {alert.zone_name || alert.zone_id}
                      </span>
                      <span className="text-[11px] text-mine-textSecondary font-mono">
                        ({alert.sensor_type.toUpperCase()})
                      </span>
                    </div>
                    <p className="text-mine-textSecondary text-[11px] mt-0.5 leading-relaxed">
                      {alert.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 sm:self-center">
                  <span className="text-[11px] text-mine-textSecondary font-mono flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(alert.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {alert.acknowledged === 0 ? (
                    <button
                      onClick={() => acknowledgeAlert(alert.id)}
                      className="px-2.5 py-1 text-xs font-bold text-mine-info bg-mine-info/10 hover:bg-mine-info/20 rounded-md border border-mine-info/30 transition-colors"
                    >
                      Acknowledge
                    </button>
                  ) : (
                    <span className="text-xs text-mine-success font-medium flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Acknowledged
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
