import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Layers,
  Activity,
  Bell,
  BarChart3,
  Cpu,
  Settings,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Radio,
  UserCheck,
  X,
} from 'lucide-react';
import { useMineGuard } from '../context/MineGuardContext';

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  setCollapsed,
  mobileOpen,
  setMobileOpen,
}) => {
  const { unreadAlertCount, isConnected } = useMineGuard();

  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/zones', label: 'Mine Zones', icon: Layers },
    { to: '/live', label: 'Live Monitoring', icon: Activity },
    { to: '/alerts', label: 'Alerts & Notifications', icon: Bell, badge: unreadAlertCount },
    { to: '/analytics', label: 'Analytics & Reports', icon: BarChart3 },
    { to: '/devices', label: 'Device Management', icon: Cpu },
    { to: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-mine-sidebar border-r border-mine-border transition-all duration-300 ease-in-out ${
          collapsed ? 'w-20' : 'w-64'
        } ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-mine-border bg-[#0E1526]">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-mine-info/15 text-mine-info border border-mine-info/30 shrink-0">
              <ShieldAlert className="w-6 h-6 text-mine-info animate-pulse" />
            </div>
            {!collapsed && (
              <div className="flex flex-col">
                <span className="text-base font-bold tracking-wider text-mine-textPrimary font-mono">
                  MINE<span className="text-mine-info">GUARD</span>
                </span>
                <span className="text-[10px] text-mine-textSecondary uppercase tracking-widest font-medium">
                  Underground Safety
                </span>
              </div>
            )}
          </div>

          {/* Mobile close button */}
          <button
            onClick={() => setMobileOpen(false)}
            className="p-1.5 text-mine-textSecondary hover:text-white rounded-md hover:bg-mine-border lg:hidden"
            title="Close menu"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Desktop collapse button */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden p-1.5 text-mine-textSecondary hover:text-white rounded-md hover:bg-mine-cardSec transition-colors lg:flex items-center justify-center"
            title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group relative ${
                    isActive
                      ? 'bg-mine-info text-white shadow-lg shadow-mine-info/20 font-semibold'
                      : 'text-mine-textSecondary hover:text-mine-textPrimary hover:bg-mine-cardSec/80'
                  }`
                }
              >
                <Icon className="w-5 h-5 shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}

                {/* Badge for unread count */}
                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={`flex items-center justify-center px-1.5 py-0.5 text-xs font-bold rounded-full ${
                      collapsed
                        ? 'absolute top-1.5 right-1.5 w-4 h-4 text-[10px] bg-mine-critical text-white'
                        : 'ml-auto bg-mine-critical text-white'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}

                {/* Floating tooltip when collapsed */}
                {collapsed && (
                  <div className="absolute left-full ml-3 px-2.5 py-1 text-xs font-medium text-white bg-mine-card border border-mine-border rounded-md shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity z-50 whitespace-nowrap">
                    {item.label}
                  </div>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom Section: Connection & Profile */}
        <div className="p-3 border-t border-mine-border bg-[#0E1526]/80 space-y-3">
          {/* Connection Status Pill */}
          <div
            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg bg-mine-bg/60 border border-mine-border text-xs ${
              collapsed ? 'justify-center' : ''
            }`}
          >
            <div className="relative flex items-center justify-center">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  isConnected ? 'bg-mine-success shadow-[0_0_8px_#22C55E]' : 'bg-mine-critical'
                }`}
              />
              {isConnected && (
                <span className="absolute w-2.5 h-2.5 rounded-full bg-mine-success animate-ping opacity-75" />
              )}
            </div>
            {!collapsed && (
              <div className="flex flex-col">
                <span className="font-semibold text-mine-textPrimary">
                  {isConnected ? 'Telemetry Stream Active' : 'Offline / Disconnected'}
                </span>
                <span className="text-[10px] text-mine-textSecondary flex items-center gap-1">
                  <Radio className="w-3 h-3 text-mine-info" /> MQTT & WebSocket
                </span>
              </div>
            )}
          </div>

          {/* User Profile */}
          <div
            className={`flex items-center gap-3 p-2 rounded-lg bg-mine-cardSec/40 border border-mine-border/50 ${
              collapsed ? 'justify-center' : ''
            }`}
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-mine-info/20 text-mine-info font-bold text-xs border border-mine-info/40 shrink-0">
              <UserCheck className="w-4 h-4" />
            </div>
            {!collapsed && (
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold text-mine-textPrimary truncate">
                  Engr. Rajesh Sharma
                </span>
                <span className="text-[10px] text-mine-textSecondary truncate">
                  Chief Safety Officer (DGMS)
                </span>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
