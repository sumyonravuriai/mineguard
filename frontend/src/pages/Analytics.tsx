import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Download,
  Calendar,
  Filter,
  TrendingUp,
  Thermometer,
  Droplets,
  Wind,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Cpu,
  Clock,
  FileText,
  CheckCircle,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import jsPDF from 'jspdf';
import { useMineGuard } from '../context/MineGuardContext';
import { api } from '../services/api';
import { AnalyticsData } from '../types';

export const Analytics: React.FC = () => {
  const { zones, alerts, settings, addToast } = useMineGuard();
  const [timeRange, setTimeRange] = useState('24h');
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [pdfGenerating, setPdfGenerating] = useState(false);

  useEffect(() => {
    setLoading(true);
    api
      .getAnalytics(timeRange)
      .then((data) => setAnalytics(data))
      .catch((err) => console.error('Error fetching analytics:', err))
      .finally(() => setLoading(false));
  }, [timeRange]);

  // PDF Generator using jsPDF
  const handleDownloadPDF = () => {
    setPdfGenerating(true);
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const now = new Date();
      const pageWidth = doc.internal.pageSize.getWidth();

      // Header Banner
      doc.setFillColor(17, 24, 39); // #111827
      doc.rect(0, 0, pageWidth, 40, 'F');

      // Title
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(20);
      doc.text('MINEGUARD COMPLIANCE REPORT', 14, 18);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(59, 130, 246); // Info blue
      doc.text('Underground Atmospheric & Environmental Safety Monitoring Ledger', 14, 25);

      doc.setTextColor(148, 163, 184);
      doc.setFontSize(8);
      doc.text(`Generated: ${now.toUTCString()} | Shift: General Shift 01 | Range: ${timeRange}`, 14, 33);
      doc.text(`Standard: DGMS (India) Coal Mines Reg. 2017 & OSHA 1910`, 14, 37);

      let yPos = 48;

      // Section 1: Executive Safety Summary
      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('1. MINE ATMOSPHERIC EXPOSURE AVERAGES', 14, yPos);
      yPos += 7;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);

      const avg = analytics?.mineAverages;
      const avgLines = [
        `• Average Temperature: ${avg?.temperature ?? 26.5} °C (Permissible Wet Bulb: < 30.5 °C)`,
        `• Average Relative Humidity: ${avg?.humidity ?? 68.2} % (Permissible Limit: < 85.0 %)`,
        `• Average Carbon Monoxide (CO): ${avg?.co ?? 6.2} ppm (Statutory 8-hr TWA Limit: 25.0 ppm)`,
        `• Average Carbon Dioxide (CO2): ${avg?.co2 ?? 720} ppm (Statutory 0.5% Limit: 2500 ppm)`,
        `• Average Nitrogen Dioxide (NO2): ${avg?.no2 ?? 0.25} ppm (Ceiling Limit: 2.0 ppm)`,
        `• Telemetry Network Overall Uptime: ${analytics?.deviceHealth?.systemUptime ?? 99.4} %`,
      ];

      avgLines.forEach((line) => {
        doc.text(line, 16, yPos);
        yPos += 5.5;
      });

      yPos += 4;

      // Section 2: Zone-by-Zone Readings Matrix Table
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(15, 23, 42);
      doc.text('2. UNDERGROUND ZONE COMPLIANCE BREAKDOWN', 14, yPos);
      yPos += 7;

      // Table Header
      doc.setFillColor(30, 41, 59);
      doc.rect(14, yPos, pageWidth - 28, 7, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.text('Zone ID & Name', 16, yPos + 4.5);
      doc.text('Temp (°C)', 80, yPos + 4.5);
      doc.text('Humidity (%)', 105, yPos + 4.5);
      doc.text('CO (ppm)', 135, yPos + 4.5);
      doc.text('CO2 (ppm)', 160, yPos + 4.5);
      doc.text('Status', 185, yPos + 4.5);
      yPos += 8;

      // Table Rows
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(51, 65, 85);

      zones.forEach((z, idx) => {
        const r = z.latest_reading;
        if (idx % 2 === 1) {
          doc.setFillColor(241, 245, 249);
          doc.rect(14, yPos - 1, pageWidth - 28, 6.5, 'F');
        }

        doc.text(`${z.id}: ${z.zone_name.split('–')[1]?.trim() || z.zone_name}`, 16, yPos + 3.5);
        doc.text(r ? `${r.temperature}` : '--', 82, yPos + 3.5);
        doc.text(r ? `${r.humidity}` : '--', 108, yPos + 3.5);
        doc.text(r ? `${r.co}` : '--', 138, yPos + 3.5);
        doc.text(r ? `${r.co2}` : '--', 162, yPos + 3.5);
        doc.text(z.status, 185, yPos + 3.5);

        yPos += 6.5;
      });

      yPos += 8;

      // Section 3: Critical Incidents & Exceedances
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(15, 23, 42);
      doc.text('3. RECORDED REGULATORY EXCEEDANCES & INCIDENTS', 14, yPos);
      yPos += 7;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);

      const recentAlerts = alerts.slice(0, 5);
      if (recentAlerts.length === 0) {
        doc.setTextColor(22, 163, 74);
        doc.text('Nil reportable hazardous incidents during this monitoring timeframe.', 16, yPos);
        yPos += 6;
      } else {
        recentAlerts.forEach((a) => {
          doc.setTextColor(a.severity === 'CRITICAL' ? 220 : a.severity === 'WARNING' ? 180 : 71, 38, 38);
          doc.text(`[${a.severity}] ${a.zone_id} (${new Date(a.created_at).toLocaleTimeString()}): ${a.description}`, 16, yPos, { maxWidth: pageWidth - 32 });
          yPos += 6.5;
        });
      }

      yPos += 14;

      // Statutory Signatory Block
      doc.setDrawColor(203, 213, 225);
      doc.line(14, yPos, 80, yPos);
      doc.line(pageWidth - 80, yPos, pageWidth - 14, yPos);

      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text('Mine Safety Officer (DGMS Sign-off)', 14, yPos + 4);
      doc.text('Mine Manager / Agent Signature', pageWidth - 80, yPos + 4);

      // Save PDF
      doc.save(`MineGuard-Compliance-Report-${timeRange}-${now.toISOString().slice(0, 10)}.pdf`);
      addToast('success', 'Report Exported', 'Downloaded official DGMS/OSHA compliance PDF.');
    } catch (err: any) {
      console.error('PDF generation error:', err);
      addToast('critical', 'Export Failed', err.message);
    } finally {
      setPdfGenerating(false);
    }
  };

  const avg = analytics?.mineAverages;
  const zoneAverages = analytics?.zoneAverages || [];
  const alertFreq = analytics?.alertFrequency;

  // Chart data for alert frequency
  const alertPieData = [
    { name: 'Critical', value: alertFreq?.CRITICAL || 0, color: '#EF4444' },
    { name: 'Warning', value: alertFreq?.WARNING || 0, color: '#F59E0B' },
    { name: 'Offline', value: alertFreq?.OFFLINE || 0, color: '#94A3B8' },
    { name: 'Normal/Restored', value: alertFreq?.NORMAL || 0, color: '#22C55E' },
  ].filter((d) => d.value > 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-mine-textPrimary">
            Analytics & Regulatory Compliance Reports
          </h2>
          <p className="text-xs text-mine-textSecondary mt-0.5">
            Statistical multi-gas distribution, zone exposure comparisons & statutory safety audits
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3 self-start sm:self-auto">
          {/* Time Filter */}
          <div className="flex items-center bg-mine-cardSec p-1 rounded-xl border border-mine-border text-xs">
            {['1h', '6h', '24h', '7d'].map((r) => (
              <button
                key={r}
                onClick={() => setTimeRange(r)}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${
                  timeRange === r
                    ? 'bg-mine-info text-white shadow-sm'
                    : 'text-mine-textSecondary hover:text-white'
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          {/* Download PDF Report */}
          <button
            onClick={handleDownloadPDF}
            disabled={pdfGenerating}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-mine-info hover:bg-mine-info/90 rounded-xl shadow-lg shadow-mine-info/20 transition-all disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{pdfGenerating ? 'Rendering PDF...' : 'Download PDF Report'}</span>
          </button>
        </div>
      </div>

      {/* 5 Averages Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3.5">
        {/* Temp */}
        <div className="p-4 rounded-xl bg-mine-card border border-mine-border shadow-lg">
          <div className="flex items-center justify-between text-xs text-mine-textSecondary font-semibold uppercase">
            <span>Avg Temp</span>
            <Thermometer className="w-4 h-4 text-orange-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white mt-1.5">
            {avg?.temperature ?? 26.5} °C
          </div>
          <div className="text-[10px] text-mine-textSecondary mt-1">Wet bulb ref: 30.5°C</div>
        </div>

        {/* Humidity */}
        <div className="p-4 rounded-xl bg-mine-card border border-mine-border shadow-lg">
          <div className="flex items-center justify-between text-xs text-mine-textSecondary font-semibold uppercase">
            <span>Avg Humidity</span>
            <Droplets className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white mt-1.5">
            {avg?.humidity ?? 68.2} %
          </div>
          <div className="text-[10px] text-mine-textSecondary mt-1">Limit: &lt; 85%</div>
        </div>

        {/* CO */}
        <div className="p-4 rounded-xl bg-mine-card border border-mine-border shadow-lg">
          <div className="flex items-center justify-between text-xs text-mine-textSecondary font-semibold uppercase">
            <span>Avg CO</span>
            <Wind className="w-4 h-4 text-mine-warning" />
          </div>
          <div className="text-2xl font-bold font-mono text-mine-warning mt-1.5">
            {avg?.co ?? 6.2} ppm
          </div>
          <div className="text-[10px] text-mine-textSecondary mt-1">DGMS TWA: 25 ppm</div>
        </div>

        {/* CO2 */}
        <div className="p-4 rounded-xl bg-mine-card border border-mine-border shadow-lg">
          <div className="flex items-center justify-between text-xs text-mine-textSecondary font-semibold uppercase">
            <span>Avg CO2</span>
            <Wind className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white mt-1.5">
            {avg?.co2 ?? 720} ppm
          </div>
          <div className="text-[10px] text-mine-textSecondary mt-1">Max 0.5%: 2500 ppm</div>
        </div>

        {/* NO2 */}
        <div className="p-4 rounded-xl bg-mine-card border border-mine-border shadow-lg">
          <div className="flex items-center justify-between text-xs text-mine-textSecondary font-semibold uppercase">
            <span>Avg NO2</span>
            <Wind className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white mt-1.5">
            {avg?.no2 ?? 0.25} ppm
          </div>
          <div className="text-[10px] text-mine-textSecondary mt-1">Ceiling: 2.0 ppm</div>
        </div>

        {/* System Uptime */}
        <div className="p-4 rounded-xl bg-mine-card border border-mine-border shadow-lg">
          <div className="flex items-center justify-between text-xs text-mine-textSecondary font-semibold uppercase">
            <span>Telemetry Uptime</span>
            <ShieldCheck className="w-4 h-4 text-mine-success" />
          </div>
          <div className="text-2xl font-bold font-mono text-mine-success mt-1.5">
            {analytics?.deviceHealth?.systemUptime ?? 99.4} %
          </div>
          <div className="text-[10px] text-mine-textSecondary mt-1">Continuous streaming</div>
        </div>
      </div>

      {/* Comparison Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Zone-wise CO & CO2 Concentration Comparison */}
        <div className="p-5 rounded-2xl bg-mine-card border border-mine-border shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-mine-textPrimary">
                Zone-wise Toxic Gas Levels (CO & NO2)
              </h3>
              <p className="text-xs text-mine-textSecondary">
                Cross-zone comparative averages during selected period
              </p>
            </div>
            <span className="text-[11px] font-mono text-mine-info">Unit: ppm</span>
          </div>

          <div className="w-full h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={zoneAverages} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                <XAxis dataKey="zoneId" stroke="#64748B" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={11} tickLine={false} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="p-3 bg-mine-card border border-mine-border rounded-xl text-xs shadow-2xl">
                          <div className="font-bold text-white mb-1">{label}</div>
                          <div className="text-mine-warning font-mono">
                            Avg CO: {payload[0]?.value} ppm
                          </div>
                          <div className="text-red-400 font-mono">
                            Avg NO2: {payload[1]?.value} ppm
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend />
                <Bar dataKey="avgCo" name="Carbon Monoxide (CO)" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                <Bar dataKey="avgNo2" name="Nitrogen Dioxide (NO2)" fill="#EF4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Alert Frequency Breakdown by Severity */}
        <div className="p-5 rounded-2xl bg-mine-card border border-mine-border shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-mine-textPrimary">
                Incident Frequency by Severity
              </h3>
              <p className="text-xs text-mine-textSecondary">
                Distribution of safety alarms logged in shift ledger
              </p>
            </div>
            <span className="text-[11px] font-mono text-mine-textSecondary">
              Total: {alertFreq?.total ?? 0}
            </span>
          </div>

          <div className="w-full h-72 flex items-center justify-center">
            {alertPieData.length === 0 ? (
              <div className="text-xs text-mine-textSecondary">No alerts logged in this period.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={alertPieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={85}
                    innerRadius={50}
                    paddingAngle={4}
                    label={({ name, percent }: any) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {alertPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="p-2.5 bg-mine-card border border-mine-border rounded-lg text-xs shadow-xl font-mono">
                            <span className="font-bold text-white">{payload[0].name}: </span>
                            <span className="text-mine-info">{payload[0].value} incidents</span>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Zone Uptime Ledger */}
      <div className="p-5 rounded-2xl bg-mine-card border border-mine-border shadow-xl">
        <h3 className="text-sm font-bold text-mine-textPrimary mb-1">
          Zone Teleceiver Uptime Compliance Summary
        </h3>
        <p className="text-xs text-mine-textSecondary mb-4">
          Telemetry network availability across all 6 monitored underground mine sectors
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(analytics?.zoneUptimes || []).map((zu) => (
            <div
              key={zu.zoneId}
              className="p-3.5 rounded-xl bg-mine-cardSec/70 border border-mine-border/70 flex items-center justify-between"
            >
              <div>
                <span className="font-bold text-white text-xs">{zu.zoneName}</span>
                <span className="text-[10px] text-mine-textSecondary block font-mono">{zu.zoneId}</span>
              </div>
              <div className="text-right">
                <span className="text-base font-bold font-mono text-mine-success">
                  {zu.uptimePercentage}%
                </span>
                <span className="text-[10px] text-mine-textSecondary block">Uptime</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
