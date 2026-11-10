import React, { useState, useMemo } from 'react';
import {
  Bell,
  Search,
  Filter,
  Check,
  ShieldAlert,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Clock,
  UserCheck,
  CheckCheck,
  Info,
  Calendar,
} from 'lucide-react';
import { useMineGuard } from '../context/MineGuardContext';
import { Alert, AlertSeverity } from '../types';

export const Alerts: React.FC = () => {
  const { alerts, zones, acknowledgeAlert, acknowledgeAllAlerts } = useMineGuard();

  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [zoneFilter, setZoneFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL'); // ALL, UNACK, ACK
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);

  // Statistics
  const stats = useMemo(() => {
    return {
      total: alerts.length,
      unacknowledged: alerts.filter((a) => a.acknowledged === 0).length,
      critical: alerts.filter((a) => a.severity === 'CRITICAL').length,
      warning: alerts.filter((a) => a.severity === 'WARNING').length,
      offline: alerts.filter((a) => a.severity === 'OFFLINE').length,
    };
  }, [alerts]);

  // Filtered alerts
  const filteredAlerts = useMemo(() => {
    return alerts.filter((a) => {
      // Search
      const searchMatch =
        a.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.zone_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (a.zone_name && a.zone_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        a.sensor_type.toLowerCase().includes(searchQuery.toLowerCase());
      if (!searchMatch) return false;

      // Severity
      if (severityFilter !== 'ALL' && a.severity !== severityFilter) return false;

      // Zone
      if (zoneFilter !== 'ALL' && a.zone_id !== zoneFilter) return false;

      // Ack status
      if (statusFilter === 'UNACK' && a.acknowledged !== 0) return false;
      if (statusFilter === 'ACK' && a.acknowledged !== 1) return false;

      return true;
    });
  }, [alerts, searchQuery, severityFilter, zoneFilter, statusFilter]);

  const getSeverityBadge = (sev: AlertSeverity) => {
    switch (sev) {
      case 'CRITICAL':
        return (
          <span className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-black uppercase rounded bg-mine-critical text-white shadow-sm animate-pulse">
            <ShieldAlert className="w-3.5 h-3.5" /> CRITICAL
          </span>
        );
      case 'WARNING':
        return (
          <span className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-black uppercase rounded bg-mine-warning text-black shadow-sm">
            <AlertTriangle className="w-3.5 h-3.5" /> WARNING
          </span>
        );
      case 'OFFLINE':
        return (
          <span className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold uppercase rounded bg-gray-500/20 text-gray-300 border border-gray-500/40">
            <AlertCircle className="w-3.5 h-3.5" /> OFFLINE
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold uppercase rounded bg-mine-success/20 text-mine-success border border-mine-success/40">
            <CheckCircle2 className="w-3.5 h-3.5" /> NORMAL
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header & Summary Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-mine-textPrimary">
            Alert & Incident Management Center
          </h2>
          <p className="text-xs text-mine-textSecondary mt-0.5">
            Log of statutory regulatory threshold exceedances, telemetry timeouts & operator sign-offs
          </p>
        </div>

        {stats.unacknowledged > 0 && (
          <button
            onClick={() => acknowledgeAllAlerts()}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-mine-info hover:bg-mine-info/90 rounded-xl shadow-lg shadow-mine-info/20 transition-all self-start sm:self-auto"
          >
            <CheckCheck className="w-4 h-4" />
            <span>Acknowledge All ({stats.unacknowledged})</span>
          </button>
        )}
      </div>

      {/* 4 Alert Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div
          onClick={() => {
            setStatusFilter('UNACK');
            setSeverityFilter('ALL');
          }}
          className={`p-4 rounded-xl bg-mine-card border ${
            statusFilter === 'UNACK' ? 'border-mine-critical ring-1 ring-mine-critical' : 'border-mine-border'
          } cursor-pointer hover:bg-mine-cardSec transition-all`}
        >
          <div className="flex items-center justify-between text-xs text-mine-textSecondary uppercase font-semibold">
            <span>Unacknowledged</span>
            <Bell className="w-4 h-4 text-mine-critical" />
          </div>
          <div className="text-3xl font-extrabold font-mono text-mine-critical mt-2">
            {stats.unacknowledged}
          </div>
          <div className="text-[11px] text-mine-textSecondary mt-1">Pending operator review</div>
        </div>

        <div
          onClick={() => {
            setSeverityFilter('CRITICAL');
            setStatusFilter('ALL');
          }}
          className={`p-4 rounded-xl bg-mine-card border ${
            severityFilter === 'CRITICAL' ? 'border-mine-critical ring-1 ring-mine-critical' : 'border-mine-border'
          } cursor-pointer hover:bg-mine-cardSec transition-all`}
        >
          <div className="flex items-center justify-between text-xs text-mine-textSecondary uppercase font-semibold">
            <span>Critical Hazards</span>
            <ShieldAlert className="w-4 h-4 text-mine-critical" />
          </div>
          <div className="text-3xl font-extrabold font-mono text-mine-critical mt-2">
            {stats.critical}
          </div>
          <div className="text-[11px] text-mine-textSecondary mt-1">Immediate action limit</div>
        </div>

        <div
          onClick={() => {
            setSeverityFilter('WARNING');
            setStatusFilter('ALL');
          }}
          className={`p-4 rounded-xl bg-mine-card border ${
            severityFilter === 'WARNING' ? 'border-mine-warning ring-1 ring-mine-warning' : 'border-mine-border'
          } cursor-pointer hover:bg-mine-cardSec transition-all`}
        >
          <div className="flex items-center justify-between text-xs text-mine-textSecondary uppercase font-semibold">
            <span>Warning Limit Breaches</span>
            <AlertTriangle className="w-4 h-4 text-mine-warning" />
          </div>
          <div className="text-3xl font-extrabold font-mono text-mine-warning mt-2">
            {stats.warning}
          </div>
          <div className="text-[11px] text-mine-textSecondary mt-1">Pre-hazard thresholds</div>
        </div>

        <div
          onClick={() => {
            setStatusFilter('ALL');
            setSeverityFilter('ALL');
            setZoneFilter('ALL');
          }}
          className="p-4 rounded-xl bg-mine-card border border-mine-border cursor-pointer hover:bg-mine-cardSec transition-all"
        >
          <div className="flex items-center justify-between text-xs text-mine-textSecondary uppercase font-semibold">
            <span>Total Logged Alerts</span>
            <Clock className="w-4 h-4 text-mine-info" />
          </div>
          <div className="text-3xl font-extrabold font-mono text-white mt-2">
            {stats.total}
          </div>
          <div className="text-[11px] text-mine-textSecondary mt-1">Full shift ledger</div>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 rounded-xl bg-mine-card border border-mine-border shadow-lg">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-mine-textSecondary" />
          <input
            type="text"
            placeholder="Search alerts by gas, description, or zone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-lg bg-mine-cardSec border border-mine-border text-mine-textPrimary placeholder:text-mine-textSecondary focus:outline-none focus:border-mine-info transition-colors"
          />
        </div>

        {/* Filter dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Severity */}
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-3 py-2 rounded-lg bg-mine-cardSec border border-mine-border text-xs text-mine-textPrimary focus:outline-none focus:border-mine-info"
          >
            <option value="ALL">Severity: All</option>
            <option value="CRITICAL">Critical</option>
            <option value="WARNING">Warning</option>
            <option value="OFFLINE">Offline</option>
            <option value="NORMAL">Normal / Restored</option>
          </select>

          {/* Zone */}
          <select
            value={zoneFilter}
            onChange={(e) => setZoneFilter(e.target.value)}
            className="px-3 py-2 rounded-lg bg-mine-cardSec border border-mine-border text-xs text-mine-textPrimary focus:outline-none focus:border-mine-info"
          >
            <option value="ALL">Zone: All</option>
            {zones.map((z) => (
              <option key={z.id} value={z.id}>
                {z.id} ({z.zone_name.split('–')[1]?.trim() || z.zone_name})
              </option>
            ))}
          </select>

          {/* Ack Status */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-lg bg-mine-cardSec border border-mine-border text-xs text-mine-textPrimary focus:outline-none focus:border-mine-info"
          >
            <option value="ALL">Status: All</option>
            <option value="UNACK">Unacknowledged</option>
            <option value="ACK">Acknowledged</option>
          </select>
        </div>
      </div>

      {/* Alerts Table */}
      <div className="rounded-2xl bg-mine-card border border-mine-border shadow-xl overflow-hidden">
        {filteredAlerts.length === 0 ? (
          <div className="p-12 text-center text-xs text-mine-textSecondary">
            <CheckCircle2 className="w-8 h-8 text-mine-success mx-auto mb-2 opacity-80" />
            No alerts found matching your criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0E1526] text-mine-textSecondary uppercase tracking-wider font-semibold border-b border-mine-border">
                <tr>
                  <th className="py-3.5 px-4">Severity</th>
                  <th className="py-3.5 px-4">Zone / Location</th>
                  <th className="py-3.5 px-4">Sensor Parameter</th>
                  <th className="py-3.5 px-4">Incident Description</th>
                  <th className="py-3.5 px-4">Triggered Reading</th>
                  <th className="py-3.5 px-4">Timestamp</th>
                  <th className="py-3.5 px-4">Status & Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-mine-border/50">
                {filteredAlerts.map((alert) => (
                  <tr
                    key={alert.id}
                    className={`hover:bg-mine-cardSec/40 transition-colors ${
                      alert.acknowledged === 0 ? 'bg-mine-cardSec/20' : 'opacity-75'
                    }`}
                  >
                    {/* Severity */}
                    <td className="py-3.5 px-4">
                      {getSeverityBadge(alert.severity)}
                    </td>

                    {/* Zone */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-mine-textPrimary">
                        {alert.zone_name || alert.zone_id}
                      </div>
                      <div className="text-[10px] text-mine-info font-mono">{alert.zone_id}</div>
                    </td>

                    {/* Sensor */}
                    <td className="py-3.5 px-4 font-mono uppercase font-semibold text-mine-textSecondary">
                      {alert.sensor_type}
                    </td>

                    {/* Description */}
                    <td className="py-3.5 px-4 text-mine-textPrimary max-w-md text-xs leading-relaxed">
                      {alert.description}
                    </td>

                    {/* Current vs Threshold */}
                    <td className="py-3.5 px-4 font-mono">
                      {alert.current_value !== null ? (
                        <div>
                          <span className="font-bold text-white">{alert.current_value}</span>
                          <span className="text-[10px] text-mine-textSecondary block">
                            Limit: {alert.threshold ?? 'N/A'}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400">N/A</span>
                      )}
                    </td>

                    {/* Timestamp */}
                    <td className="py-3.5 px-4 text-mine-textSecondary text-[11px] whitespace-nowrap font-mono">
                      <div>{new Date(alert.created_at).toLocaleDateString()}</div>
                      <div>{new Date(alert.created_at).toLocaleTimeString()}</div>
                    </td>

                    {/* Ack Action */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {alert.acknowledged === 0 ? (
                        <button
                          onClick={() => acknowledgeAlert(alert.id)}
                          className="px-3 py-1.5 text-xs font-bold text-white bg-mine-info hover:bg-mine-info/90 rounded-lg shadow-sm transition-all"
                        >
                          Acknowledge
                        </button>
                      ) : (
                        <div className="text-[11px] text-mine-success font-medium">
                          <span className="flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" /> Acknowledged
                          </span>
                          <span className="text-[10px] text-mine-textSecondary block">
                            by {alert.acknowledged_by || 'Operator'}
                          </span>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
