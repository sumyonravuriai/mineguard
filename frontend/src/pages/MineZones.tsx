import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Layers,
  Search,
  Plus,
  LayoutGrid,
  List,
  Edit,
  Wifi,
  WifiOff,
  Clock,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  X,
  MapPin,
  Cpu,
} from 'lucide-react';
import { useMineGuard } from '../context/MineGuardContext';
import { ZoneCard } from '../components/ZoneCard';
import { api } from '../services/api';
import { Zone } from '../types';

export const MineZones: React.FC = () => {
  const { zones, refreshData, addToast } = useMineGuard();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [activeZone, setActiveZone] = useState<Zone | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    id: '',
    zone_name: '',
    location: '',
    device_id: '',
  });
  const [formSubmitting, setFormSubmitting] = useState(false);

  const filteredZones = useMemo(() => {
    return zones.filter((z) => {
      const matchQuery =
        z.zone_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        z.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        z.location.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchQuery) return false;

      if (statusFilter === 'ALL') return true;
      if (statusFilter === 'ONLINE') return z.device_status === 'ONLINE';
      if (statusFilter === 'OFFLINE') return z.device_status === 'OFFLINE';
      if (statusFilter === 'NORMAL') return z.status === 'NORMAL';
      if (statusFilter === 'WARNING') return z.status === 'WARNING';
      if (statusFilter === 'CRITICAL') return z.status === 'CRITICAL';
      return true;
    });
  }, [zones, searchQuery, statusFilter]);

  const handleOpenAdd = () => {
    const nextNum = zones.length + 1;
    const formattedId = `ZONE_0${nextNum}`;
    setFormData({
      id: formattedId,
      zone_name: `Zone 0${nextNum} – New Substation Sector`,
      location: 'Level -200m Working Seam',
      device_id: `ESP32_${formattedId}`,
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (zone: Zone, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveZone(zone);
    setFormData({
      id: zone.id,
      zone_name: zone.zone_name,
      location: zone.location,
      device_id: zone.device_id,
    });
    setIsEditModalOpen(true);
  };

  const handleCreateZone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.id || !formData.zone_name) return;
    setFormSubmitting(true);
    try {
      await api.createZone(formData);
      addToast('success', 'Zone Registered', `${formData.zone_name} successfully added.`);
      setIsAddModalOpen(false);
      refreshData();
    } catch (err: any) {
      addToast('critical', 'Error', err.message);
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleUpdateZone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeZone) return;
    setFormSubmitting(true);
    try {
      await api.updateZone(activeZone.id, {
        zone_name: formData.zone_name,
        location: formData.location,
        device_id: formData.device_id,
      });
      addToast('success', 'Zone Updated', `${formData.zone_name} updated successfully.`);
      setIsEditModalOpen(false);
      refreshData();
    } catch (err: any) {
      addToast('critical', 'Error', err.message);
    } finally {
      setFormSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Controls Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-mine-textPrimary">Mine Underground Zones</h2>
          <p className="text-xs text-mine-textSecondary mt-0.5">
            Monitor, organize, and inspect all registered underground atmospheric monitoring points
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-mine-info hover:bg-mine-info/90 rounded-xl shadow-lg shadow-mine-info/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Zone</span>
        </button>
      </div>

      {/* Filter and View Mode Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 rounded-xl bg-mine-card border border-mine-border shadow-lg">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-mine-textSecondary" />
          <input
            type="text"
            placeholder="Search by zone ID, name, or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-lg bg-mine-cardSec border border-mine-border text-mine-textPrimary placeholder:text-mine-textSecondary focus:outline-none focus:border-mine-info transition-colors"
          />
        </div>

        {/* Status Filters & View Toggle */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center bg-mine-cardSec p-1 rounded-lg border border-mine-border text-xs">
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

          {/* Grid vs Table View Toggle */}
          <div className="flex items-center bg-mine-cardSec p-1 rounded-lg border border-mine-border text-xs">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md ${
                viewMode === 'grid' ? 'bg-mine-border text-white' : 'text-mine-textSecondary hover:text-white'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md ${
                viewMode === 'table' ? 'bg-mine-border text-white' : 'text-mine-textSecondary hover:text-white'
              }`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Content Rendering: Grid or Table */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredZones.map((zone) => (
            <div key={zone.id} className="relative group">
              <ZoneCard zone={zone} />
              {/* Quick Edit Overlay Button */}
              <button
                onClick={(e) => handleOpenEdit(zone, e)}
                className="absolute top-4 right-14 opacity-0 group-hover:opacity-100 p-1.5 rounded-md bg-mine-cardSec/90 text-mine-textSecondary hover:text-white border border-mine-border transition-all"
                title="Edit Zone Information"
              >
                <Edit className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        /* Table View */
        <div className="rounded-2xl bg-mine-card border border-mine-border shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0E1526] text-mine-textSecondary uppercase tracking-wider font-semibold border-b border-mine-border">
                <tr>
                  <th className="py-3.5 px-4">Zone ID & Name</th>
                  <th className="py-3.5 px-4">Location</th>
                  <th className="py-3.5 px-4">Assigned ESP32</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Temp</th>
                  <th className="py-3.5 px-4">Hum</th>
                  <th className="py-3.5 px-4">CO (ppm)</th>
                  <th className="py-3.5 px-4">CO2 (ppm)</th>
                  <th className="py-3.5 px-4">NO2 (ppm)</th>
                  <th className="py-3.5 px-4">Last Telemetry</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-mine-border/50 font-mono">
                {filteredZones.map((z) => {
                  const r = z.latest_reading;
                  const isOnline = z.device_status === 'ONLINE' && !z.is_stale;
                  return (
                    <tr
                      key={z.id}
                      onClick={() => navigate(`/zones/${z.id}`)}
                      className="hover:bg-mine-cardSec/50 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-4 font-sans">
                        <div className="font-bold text-mine-textPrimary">{z.zone_name}</div>
                        <div className="text-[10px] text-mine-info font-mono">{z.id}</div>
                      </td>
                      <td className="py-3 px-4 font-sans text-mine-textSecondary text-[11px] max-w-xs truncate">
                        {z.location}
                      </td>
                      <td className="py-3 px-4 text-mine-textSecondary text-[11px]">
                        <span className="flex items-center gap-1.5">
                          {isOnline ? (
                            <Wifi className="w-3 h-3 text-mine-success" />
                          ) : (
                            <WifiOff className="w-3 h-3 text-gray-400" />
                          )}
                          {z.device_id}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-sans">
                        <span
                          className={`inline-block px-2 py-0.5 text-[10px] font-bold uppercase rounded ${
                            !isOnline || z.status === 'OFFLINE'
                              ? 'bg-gray-500/20 text-gray-300'
                              : z.status === 'CRITICAL'
                              ? 'bg-mine-critical text-white font-black'
                              : z.status === 'WARNING'
                              ? 'bg-mine-warning text-black font-extrabold'
                              : 'bg-mine-success/20 text-mine-success'
                          }`}
                        >
                          {z.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-white font-semibold">
                        {r && r.temperature !== null && r.temperature !== undefined ? `${r.temperature}°C` : '--'}
                      </td>
                      <td className="py-3 px-4 text-white font-semibold">
                        {r && r.humidity !== null && r.humidity !== undefined ? `${r.humidity}%` : '--'}
                      </td>
                      <td
                        className={`py-3 px-4 font-bold ${
                          r && r.co !== null && r.co !== undefined && r.co >= 25 ? 'text-mine-warning' : 'text-white'
                        }`}
                      >
                        {r && r.co !== null && r.co !== undefined ? `${r.co}` : '--'}
                      </td>
                      <td
                        className={`py-3 px-4 font-bold ${
                          r && r.co2 !== null && r.co2 !== undefined && r.co2 >= 2500 ? 'text-mine-warning' : 'text-white'
                        }`}
                      >
                        {r && r.co2 !== null && r.co2 !== undefined ? `${r.co2}` : '--'}
                      </td>
                      <td
                        className={`py-3 px-4 font-bold ${
                          r && r.no2 !== null && r.no2 !== undefined && r.no2 >= 2.0 ? 'text-mine-warning' : 'text-white'
                        }`}
                      >
                        {r && r.no2 !== null && r.no2 !== undefined ? `${r.no2}` : '--'}
                      </td>
                      <td className="py-3 px-4 text-mine-textSecondary text-[11px]">
                        {r ? new Date(r.timestamp).toLocaleTimeString() : 'N/A'}
                      </td>
                      <td className="py-3 px-4 text-right font-sans">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={(e) => handleOpenEdit(z, e)}
                            className="p-1.5 text-mine-textSecondary hover:text-white rounded hover:bg-mine-cardSec"
                            title="Edit"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-mine-info flex items-center">
                            <ArrowRight className="w-4 h-4" />
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Zone Modal */}
      {(isAddModalOpen || isEditModalOpen) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-mine-card border border-mine-border rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-4 px-6 border-b border-mine-border bg-[#0E1526]">
              <h3 className="font-bold text-base text-mine-textPrimary">
                {isAddModalOpen ? 'Register New Underground Zone' : 'Edit Mine Zone Details'}
              </h3>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setIsEditModalOpen(false);
                }}
                className="p-1 text-mine-textSecondary hover:text-white rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={isAddModalOpen ? handleCreateZone : handleUpdateZone} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-mine-textSecondary uppercase tracking-wider mb-1.5">
                  Zone ID (Primary Key)
                </label>
                <input
                  type="text"
                  required
                  disabled={isEditModalOpen}
                  value={formData.id}
                  onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                  placeholder="e.g. ZONE_07"
                  className="w-full px-3 py-2 rounded-lg bg-mine-cardSec border border-mine-border text-mine-textPrimary focus:outline-none focus:border-mine-info disabled:opacity-50 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-mine-textSecondary uppercase tracking-wider mb-1.5">
                  Zone Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.zone_name}
                  onChange={(e) => setFormData({ ...formData, zone_name: e.target.value })}
                  placeholder="e.g. Zone 07 – Auxiliary Shaft North"
                  className="w-full px-3 py-2 rounded-lg bg-mine-cardSec border border-mine-border text-mine-textPrimary focus:outline-none focus:border-mine-info font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-mine-textSecondary uppercase tracking-wider mb-1.5">
                  Underground Location / Level
                </label>
                <input
                  type="text"
                  required
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g. Level -300m, Return Airway Junction 4"
                  className="w-full px-3 py-2 rounded-lg bg-mine-cardSec border border-mine-border text-mine-textPrimary focus:outline-none focus:border-mine-info"
                />
              </div>

              <div>
                <label className="block font-semibold text-mine-textSecondary uppercase tracking-wider mb-1.5">
                  Assigned ESP32 Transceiver Device ID
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

              <div className="pt-3 border-t border-mine-border/60 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setIsEditModalOpen(false);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-mine-textSecondary hover:text-white rounded-lg hover:bg-mine-cardSec"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-4 py-2 text-xs font-bold text-white bg-mine-info hover:bg-mine-info/90 rounded-lg shadow-md disabled:opacity-50"
                >
                  {formSubmitting ? 'Saving...' : isAddModalOpen ? 'Create Zone' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
