import React, { useState, useRef, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import {
  Menu,
  Bell,
  RefreshCw,
  Cpu,
  Radio,
  ChevronDown,
  PlayCircle,
  HardDrive,
  ShieldAlert,
} from 'lucide-react';
import { useMineGuard } from '../context/MineGuardContext';
import { NotificationPanel } from './NotificationPanel';

interface HeaderProps {
  onToggleMobileSidebar: () => void;
  onOpenScenarioModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleMobileSidebar,
  onOpenScenarioModal,
}) => {
  const location = useLocation();
  const {
    isConnected,
    lastSync,
    unreadAlertCount,
    demoMode,
    toggleDemoMode,
    refreshData,
  } = useMineGuard();

  const [notificationOpen, setNotificationOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotificationOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Compute breadcrumbs and title
  const getPageMeta = () => {
    const path = location.pathname;
    if (path === '/') return { title: 'Mine Safety Overview', subtitle: 'Underground Atmospheric Surveillance & Compliance' };
    if (path.startsWith('/zones/')) return { title: 'Zone Atmospheric Detail', subtitle: 'Detailed multi-sensor telemetry & analytical trends' };
    if (path === '/zones') return { title: 'Mine Underground Zones', subtitle: 'Zone management, active transceivers & status matrix' };
    if (path === '/live') return { title: 'Live Atmospheric Matrix', subtitle: 'Synchronous real-time telemetry from all underground points' };
    if (path === '/alerts') return { title: 'Alerts & Incident Center', subtitle: 'Regulatory breaches, thresholds & operator acknowledgments' };
    if (path === '/analytics') return { title: 'Analytics & Regulatory Reports', subtitle: 'Historical averages, exposure limits & compliance export' };
    if (path === '/devices') return { title: 'ESP32 Device Management', subtitle: 'Transceiver nodes, heartbeat telemetry & health monitoring' };
    if (path === '/settings') return { title: 'System & Safety Settings', subtitle: 'Sensor thresholds, DGMS/OSHA regulatory limits & MQTT broker' };
    return { title: 'MineGuard Portal', subtitle: 'Underground Safety Operations' };
  };

  const { title, subtitle } = getPageMeta();

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await refreshData();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 md:px-6 bg-mine-sidebar/95 backdrop-blur-md border-b border-mine-border">
      {/* Left: Mobile trigger & Page Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileSidebar}
          className="p-2 -ml-2 text-mine-textSecondary hover:text-white rounded-lg hover:bg-mine-card lg:hidden"
          title="Open Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="text-xs text-mine-textSecondary font-medium hidden sm:inline">
              MineGuard /
            </span>
            <h1 className="text-base sm:text-lg font-bold text-mine-textPrimary tracking-tight">
              {title}
            </h1>
          </div>
          <p className="text-[11px] text-mine-textSecondary hidden md:block">
            {subtitle}
          </p>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Scenario Simulator Modal Launcher */}
        <button
          onClick={onOpenScenarioModal}
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-mine-cardSec hover:bg-mine-border text-mine-textPrimary border border-mine-border/80 transition-all hover:border-mine-info/50"
          title="Trigger simulated scenarios for testing"
        >
          <PlayCircle className="w-3.5 h-3.5 text-mine-info" />
          <span>Test Scenarios</span>
        </button>

        {/* Demo / Live Mode Switch */}
        <div className="flex items-center">
          <button
            onClick={() => toggleDemoMode()}
            className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
              demoMode
                ? 'bg-mine-info/10 border-mine-info/40 text-mine-info hover:bg-mine-info/20'
                : 'bg-mine-success/10 border-mine-success/40 text-mine-success hover:bg-mine-success/20'
            }`}
            title={demoMode ? 'Switch to Real ESP32 Hardware Mode' : 'Switch to Realistic Demo Simulator'}
          >
            {demoMode ? (
              <>
                <Cpu className="w-3.5 h-3.5 text-mine-info animate-pulse" />
                <span className="hidden xs:inline">DEMO SIMULATOR</span>
                <span className="xs:hidden">DEMO</span>
              </>
            ) : (
              <>
                <Radio className="w-3.5 h-3.5 text-mine-success animate-pulse" />
                <span className="hidden xs:inline">LIVE ESP32 MODE</span>
                <span className="xs:hidden">LIVE</span>
              </>
            )}
          </button>
        </div>

        {/* Sync & Connectivity */}
        <div className="hidden xl:flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-mine-card/60 border border-mine-border text-xs text-mine-textSecondary">
          <button
            onClick={handleManualRefresh}
            className={`text-mine-textSecondary hover:text-white transition-transform ${
              isRefreshing ? 'animate-spin text-mine-info' : ''
            }`}
            title="Force refresh telemetry"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <span className="text-[11px] font-mono">
            {lastSync.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
        </div>

        {/* Notification Bell with Panel */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotificationOpen(!notificationOpen)}
            className="relative p-2 text-mine-textSecondary hover:text-white rounded-lg hover:bg-mine-card border border-transparent hover:border-mine-border transition-colors"
            title="Safety Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadAlertCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-mine-critical text-[10px] font-bold text-white shadow-sm ring-2 ring-mine-sidebar">
                {unreadAlertCount}
              </span>
            )}
          </button>

          {notificationOpen && <NotificationPanel onClose={() => setNotificationOpen(false)} />}
        </div>

        {/* User Dropdown */}
        <div className="relative">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-mine-card border border-transparent hover:border-mine-border transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-mine-info to-blue-400 flex items-center justify-center text-white font-bold text-xs ring-1 ring-mine-border">
              RS
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-mine-textSecondary hidden sm:block" />
          </button>

          {userMenuOpen && (
            <div
              className="absolute right-0 mt-2 w-56 bg-mine-card border border-mine-border rounded-xl shadow-2xl z-50 p-2 text-xs divide-y divide-mine-border/60 animate-in fade-in duration-100"
              onClick={() => setUserMenuOpen(false)}
            >
              <div className="p-2 pb-2.5">
                <p className="font-bold text-mine-textPrimary">Engr. Rajesh Sharma</p>
                <p className="text-[11px] text-mine-textSecondary">Chief Safety Officer</p>
                <div className="mt-1 flex items-center gap-1.5 text-[10px] text-mine-success">
                  <span className="w-1.5 h-1.5 rounded-full bg-mine-success" /> Authorized DGMS Inspector
                </div>
              </div>
              <div className="py-1">
                <Link
                  to="/settings"
                  className="block px-2 py-1.5 rounded-md hover:bg-mine-cardSec text-mine-textPrimary transition-colors"
                >
                  Safety Standards & Thresholds
                </Link>
                <Link
                  to="/devices"
                  className="block px-2 py-1.5 rounded-md hover:bg-mine-cardSec text-mine-textPrimary transition-colors"
                >
                  Hardware Device Configurations
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
