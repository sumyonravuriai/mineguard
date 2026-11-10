import React from 'react';
import { Link } from 'react-router-dom';
import { Bell, Check, ExternalLink, ShieldAlert, AlertTriangle, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useMineGuard } from '../context/MineGuardContext';
import { AlertSeverity } from '../types';

interface NotificationPanelProps {
  onClose: () => void;
}

export const NotificationPanel: React.FC<NotificationPanelProps> = ({ onClose }) => {
  const { alerts, acknowledgeAlert, acknowledgeAllAlerts } = useMineGuard();
  const unreadAlerts = alerts.filter((a) => a.acknowledged === 0);

  const getSeverityIcon = (sev: AlertSeverity) => {
    switch (sev) {
      case 'CRITICAL':
        return <ShieldAlert className="w-4 h-4 text-mine-critical shrink-0" />;
      case 'WARNING':
        return <AlertTriangle className="w-4 h-4 text-mine-warning shrink-0" />;
      case 'OFFLINE':
        return <AlertCircle className="w-4 h-4 text-gray-400 shrink-0" />;
      default:
        return <CheckCircle2 className="w-4 h-4 text-mine-success shrink-0" />;
    }
  };

  return (
    <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-mine-card border border-mine-border rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
      {/* Header */}
      <div className="flex items-center justify-between p-3.5 border-b border-mine-border bg-[#0E1526]">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-mine-info" />
          <span className="font-semibold text-sm text-mine-textPrimary">Recent Safety Alerts</span>
          <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-mine-critical/20 text-mine-critical border border-mine-critical/30">
            {unreadAlerts.length} Active
          </span>
        </div>
        {unreadAlerts.length > 0 && (
          <button
            onClick={() => acknowledgeAllAlerts()}
            className="text-xs text-mine-info hover:text-mine-info/80 font-medium hover:underline flex items-center gap-1"
          >
            <Check className="w-3 h-3" /> Ack All
          </button>
        )}
      </div>

      {/* Alert list */}
      <div className="max-h-80 overflow-y-auto divide-y divide-mine-border/50">
        {alerts.length === 0 ? (
          <div className="p-8 text-center text-sm text-mine-textSecondary">
            <CheckCircle2 className="w-8 h-8 text-mine-success mx-auto mb-2 opacity-80" />
            No active atmospheric warnings or alerts. All zones operating within standard regulatory limits.
          </div>
        ) : (
          alerts.slice(0, 8).map((alert) => (
            <div
              key={alert.id}
              className={`p-3 text-xs flex gap-3 transition-colors ${
                alert.acknowledged === 0 ? 'bg-mine-cardSec/40' : 'opacity-65'
              }`}
            >
              <div className="mt-0.5">{getSeverityIcon(alert.severity)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="font-bold text-mine-textPrimary truncate">
                    {alert.zone_name || alert.zone_id}
                  </span>
                  <span className="text-[10px] text-mine-textSecondary whitespace-nowrap">
                    {new Date(alert.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-mine-textSecondary line-clamp-2 leading-relaxed">
                  {alert.description}
                </p>
                <div className="mt-2 flex items-center justify-between">
                  <span
                    className={`inline-block px-1.5 py-0.5 text-[9px] font-extrabold uppercase rounded ${
                      alert.severity === 'CRITICAL'
                        ? 'bg-mine-critical/20 text-mine-critical'
                        : alert.severity === 'WARNING'
                        ? 'bg-mine-warning/20 text-mine-warning'
                        : 'bg-gray-500/20 text-gray-300'
                    }`}
                  >
                    {alert.severity}
                  </span>
                  {alert.acknowledged === 0 ? (
                    <button
                      onClick={() => acknowledgeAlert(alert.id)}
                      className="px-2 py-0.5 text-[11px] font-semibold text-mine-info bg-mine-info/10 hover:bg-mine-info/20 rounded border border-mine-info/30 transition-colors"
                    >
                      Acknowledge
                    </button>
                  ) : (
                    <span className="text-[10px] text-mine-success flex items-center gap-1 font-medium">
                      <Check className="w-3 h-3" /> Acked
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="p-2.5 bg-[#0E1526] border-t border-mine-border text-center">
        <Link
          to="/alerts"
          onClick={onClose}
          className="text-xs font-semibold text-mine-info hover:text-white flex items-center justify-center gap-1.5 transition-colors"
        >
          Open Alert Center <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
};
