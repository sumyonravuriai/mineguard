import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Plus,
  Search,
  Wifi,
  WifiOff,
  Edit,
  Trash2,
  Activity,
  CheckCircle2,
  AlertTriangle,
  X,
  Radio,
  Server,
  Layers,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { useMineGuard } from '../context/MineGuardContext';
import { api } from '../services/api';
import { Device } from '../types';

export const Devices: React.FC = () => {
  const { zones, refreshData, addToast } = useMineGuard();
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [activeDevice, setActiveDevice] = useState<Device | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    device_id: '',
    assigned_zone: 'ZONE_01',
    firmware_version: 'v1.4.2-esp32',
    ip_address: '192.168.4.10',
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchDevices = () => {
    setLoading(true);
    api
      .getDevices()
      .then((data) => setDevices(data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  const handleOpenRegister = () => {
    const nextId = `ESP32_ZONE_0${devices.length + 1}`;
    setFormData({
      device_id: nextId,
      assigned_zone: zones[0]?.id || 'ZONE_01',
      firmware_version: 'v1.4.2-esp32',
      ip_address: `192.168.4.${20 + devices.length}`,
    });
    setIsRegisterOpen(true);
  };

  const handleRegisterDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.device_id || !formData.assigned_zone) return;
    setSubmitting(true);
    try {
      await api.registerDevice(formData);
      addToast('success', 'ESP32 Registered', `Device ${formData.device_id} successfully provisioned.`);
      setIsRegisterOpen(false);
      fetchDevices();
      refreshData();
    } catch (err: any) {
      addToast('critical', 'Error', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenEdit = (dev: Device) => {
    setActiveDevice(dev);
    setFormData({
      device_id: dev.device_id,
      assigned_zone: dev.assigned_zone,
      firmware_version: dev.firmware_version || 'v1.4.2-esp32',
      ip_address: dev.ip_address || '192.168.4.10',
    });
    setIsEditOpen(true);
  };

  const handleUpdateDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDevice) return;
    setSubmitting(true);
    try {
      await api.updateDevice(activeDevice.id, formData);
      addToast('success', 'Device Updated', `Configuration updated for ${formData.device_id}.`);
      setIsEditOpen(false);
      fetchDevices();
      refreshData();
    } catch (err: any) {
      addToast('critical', 'Error', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!activeDevice) return;
    setSubmitting(true);
    try {
      await api.deleteDevice(activeDevice.id);
      addToast('info', 'Device Deprovisioned', `Device ${activeDevice.device_id} was removed.`);
      setIsDeleteOpen(false);
      fetchDevices();
      refreshData();
    } catch (err: any) {
      addToast('critical', 'Error', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredDevices = devices.filter((d) => {
    return (
      d.device_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.assigned_zone.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (d.ip_address && d.ip_address.includes(searchQuery))
    );
  });

  const onlineCount = devices.filter((d) => d.connection_status === 'ONLINE').length;
  const offlineCount = devices.filter((d) => d.connection_status === 'OFFLINE').length;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header & Provision Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-mine-textPrimary">
            ESP32 Device Management & Transceiver Registry
          </h2>
          <p className="text-xs text-mine-textSecondary mt-0.5">
            Manage physical underground edge microcontrollers, Wi-Fi connectivity, and sensor telemetry
          </p>
        </div>

        <button
          onClick={handleOpenRegister}
          className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-mine-info hover:bg-mine-info/90 rounded-xl shadow-lg shadow-mine-info/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Provision New ESP32</span>
        </button>
      </div>

      {/* Hardware Status Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-xl bg-mine-card border border-mine-border shadow-lg">
          <div className="flex items-center justify-between text-xs text-mine-textSecondary font-semibold uppercase">
            <span>Total Nodes</span>
            <Cpu className="w-4 h-4 text-mine-info" />
          </div>
          <div className="text-3xl font-extrabold font-mono text-white mt-2">
            {devices.length}
          </div>
          <div className="text-[11px] text-mine-textSecondary mt-1">Configured microcontrollers</div>
        </div>

        <div className="p-4 rounded-xl bg-mine-card border border-mine-border shadow-lg">
          <div className="flex items-center justify-between text-xs text-mine-textSecondary font-semibold uppercase">
            <span>Transceiving Online</span>
            <Wifi className="w-4 h-4 text-mine-success" />
          </div>
          <div className="text-3xl font-extrabold font-mono text-mine-success mt-2">
            {onlineCount}
          </div>
          <div className="text-[11px] text-mine-textSecondary mt-1">Active heartbeats valid</div>
        </div>

        <div className="p-4 rounded-xl bg-mine-card border border-mine-border shadow-lg">
          <div className="flex items-center justify-between text-xs text-mine-textSecondary font-semibold uppercase">
            <span>Offline Nodes</span>
            <WifiOff className="w-4 h-4 text-gray-400" />
          </div>
          <div className="text-3xl font-extrabold font-mono text-gray-400 mt-2">
            {offlineCount}
          </div>
          <div className="text-[11px] text-mine-textSecondary mt-1">Telemetry gap &gt; 15s</div>
        </div>

        <div className="p-4 rounded-xl bg-mine-card border border-mine-border shadow-lg">
          <div className="flex items-center justify-between text-xs text-mine-textSecondary font-semibold uppercase">
            <span>Protocol Stack</span>
            <Radio className="w-4 h-4 text-mine-info" />
          </div>
          <div className="text-xl font-bold font-mono text-mine-info mt-2">
            MQTT + JSON
          </div>
          <div className="text-[11px] text-mine-textSecondary mt-1">QoS 1 over Wi-Fi 2.4GHz</div>
        </div>
      </div>

      {/* Search Toolbar */}
      <div className="flex items-center justify-between gap-3 p-4 rounded-xl bg-mine-card border border-mine-border shadow-lg">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-mine-textSecondary" />
          <input
            type="text"
            placeholder="Search by device ID, assigned zone, IP..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-lg bg-mine-cardSec border border-mine-border text-mine-textPrimary placeholder:text-mine-textSecondary focus:outline-none focus:border-mine-info transition-colors"
          />
        </div>
      </div>

      {/* Devices Table */}
      <div className="rounded-2xl bg-mine-card border border-mine-border shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0E1526] text-mine-textSecondary uppercase tracking-wider font-semibold border-b border-mine-border">
              <tr>
                <th className="py-3.5 px-4">Device ID</th>
                <th className="py-3.5 px-4">Assigned Mine Zone</th>
                <th className="py-3.5 px-4">Connection Link</th>
                <th className="py-3.5 px-4">Sensor Suite Availability</th>
                <th className="py-3.5 px-4">IP Address & Network</th>
                <th className="py-3.5 px-4">Firmware Version</th>
                <th className="py-3.5 px-4">Last Communication</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-mine-border/50 font-mono">
              {filteredDevices.map((dev) => {
                const isOnline = dev.connection_status === 'ONLINE';
                return (
                  <tr key={dev.id} className="hover:bg-mine-cardSec/40 transition-colors">
                    {/* Device ID */}
                    <td className="py-3.5 px-4 font-bold text-white flex items-center gap-2">
                      <div className="p-1 rounded bg-mine-info/10 text-mine-info">
                        <Cpu className="w-4 h-4" />
                      </div>
                      <span>{dev.device_id}</span>
                    </td>

                    {/* Zone */}
                    <td className="py-3.5 px-4 font-sans">
                      <span className="font-semibold text-mine-textPrimary">{dev.assigned_zone}</span>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 font-sans">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                          isOnline
                            ? 'bg-mine-success/15 text-mine-success border border-mine-success/30'
                            : 'bg-gray-500/20 text-gray-300 border border-gray-500/40'
                        }`}
                      >
                        {isOnline ? (
                          <Wifi className="w-3 h-3 text-mine-success" />
                        ) : (
                          <WifiOff className="w-3 h-3 text-gray-400" />
                        )}
                        {dev.connection_status}
                      </span>
                    </td>

                    {/* Sensors */}
                    <td className="py-3.5 px-4 font-sans">
                      <div className="flex items-center gap-1 text-[10px] text-mine-textSecondary">
                        <span className="px-1.5 py-0.5 rounded bg-mine-cardSec border border-mine-border font-mono">MQ-7 (CO)</span>
                        <span className="px-1.5 py-0.5 rounded bg-mine-cardSec border border-mine-border font-mono">NDIR (CO2)</span>
                        <span className="px-1.5 py-0.5 rounded bg-mine-cardSec border border-mine-border font-mono">SHT31 (T/H)</span>
                      </div>
                    </td>

                    {/* IP */}
                    <td className="py-3.5 px-4 text-mine-textSecondary text-[11px]">
                      {dev.ip_address || '192.168.1.100'}
                    </td>

                    {/* Firmware */}
                    <td className="py-3.5 px-4 text-mine-info text-[11px]">
                      {dev.firmware_version || 'v1.4.2-esp32'}
                    </td>

                    {/* Last Seen */}
                    <td className="py-3.5 px-4 text-mine-textSecondary text-[11px]">
                      {dev.last_seen ? new Date(dev.last_seen).toLocaleTimeString() : 'Never'}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right font-sans">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(dev)}
                          className="p-1.5 text-mine-textSecondary hover:text-white rounded hover:bg-mine-cardSec"
                          title="Edit Device Settings"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setActiveDevice(dev);
                            setIsDeleteOpen(true);
                          }}
                          className="p-1.5 text-mine-textSecondary hover:text-mine-critical rounded hover:bg-mine-cardSec"
                          title="Deprovision Device"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Register / Edit Device Modal */}
      {(isRegisterOpen || isEditOpen) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-mine-card border border-mine-border rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-4 px-6 border-b border-mine-border bg-[#0E1526]">
              <h3 className="font-bold text-base text-mine-textPrimary">
                {isRegisterOpen ? 'Provision New ESP32 Node' : 'Edit ESP32 Device Configuration'}
              </h3>
              <button
                onClick={() => {
                  setIsRegisterOpen(false);
                  setIsEditOpen(false);
                }}
                className="p-1 text-mine-textSecondary hover:text-white rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={isRegisterOpen ? handleRegisterDevice : handleUpdateDevice}
              className="p-6 space-y-4 text-xs"
            >
              <div>
                <label className="block font-semibold text-mine-textSecondary uppercase tracking-wider mb-1.5">
                  Device Hardware ID
                </label>
                <input
                  type="text"
                  required
                  value={formData.device_id}
                  onChange={(e) => setFormData({ ...formData, device_id: e.target.value })}
                  placeholder="e.g. ESP32_ZONE_07"
                  className="w-full px-3 py-2 rounded-lg bg-mine-cardSec border border-mine-border text-mine-textPrimary focus:outline-none focus:border-mine-info font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-mine-textSecondary uppercase tracking-wider mb-1.5">
                  Assigned Underground Mine Zone
                </label>
                <select
                  value={formData.assigned_zone}
                  onChange={(e) => setFormData({ ...formData, assigned_zone: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-mine-cardSec border border-mine-border text-mine-textPrimary focus:outline-none focus:border-mine-info font-medium"
                >
                  {zones.map((z) => (
                    <option key={z.id} value={z.id}>
                      {z.id}: {z.zone_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-mine-textSecondary uppercase tracking-wider mb-1.5">
                  Static IP Address / Hostname
                </label>
                <input
                  type="text"
                  required
                  value={formData.ip_address}
                  onChange={(e) => setFormData({ ...formData, ip_address: e.target.value })}
                  placeholder="e.g. 192.168.4.25"
                  className="w-full px-3 py-2 rounded-lg bg-mine-cardSec border border-mine-border text-mine-textPrimary focus:outline-none focus:border-mine-info font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-mine-textSecondary uppercase tracking-wider mb-1.5">
                  Firmware Version
                </label>
                <input
                  type="text"
                  required
                  value={formData.firmware_version}
                  onChange={(e) => setFormData({ ...formData, firmware_version: e.target.value })}
                  placeholder="e.g. v1.4.2-esp32"
                  className="w-full px-3 py-2 rounded-lg bg-mine-cardSec border border-mine-border text-mine-textPrimary focus:outline-none focus:border-mine-info font-mono"
                />
              </div>

              <div className="pt-3 border-t border-mine-border/60 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsRegisterOpen(false);
                    setIsEditOpen(false);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-mine-textSecondary hover:text-white rounded-lg hover:bg-mine-cardSec"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-bold text-white bg-mine-info hover:bg-mine-info/90 rounded-lg shadow-md disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : isRegisterOpen ? 'Register Device' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {isDeleteOpen && activeDevice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-mine-card border border-mine-critical/60 rounded-2xl shadow-2xl overflow-hidden p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-mine-critical/20 text-mine-critical flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-mine-textPrimary">
                Confirm Device Removal
              </h3>
              <p className="text-xs text-mine-textSecondary mt-1 leading-relaxed">
                Are you sure you want to remove transceiver <strong className="text-white font-mono">{activeDevice.device_id}</strong>? Any telemetry sent by this device will be rejected.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setIsDeleteOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-mine-textSecondary hover:text-white rounded-lg hover:bg-mine-cardSec"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={submitting}
                className="px-4 py-2 text-xs font-bold text-white bg-mine-critical hover:bg-mine-critical/90 rounded-lg shadow-lg shadow-mine-critical/20"
              >
                {submitting ? 'Removing...' : 'Delete Transceiver'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
