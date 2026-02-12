import { useEffect, useState } from 'react';
import {
  Target,
  Shield,
  CheckCircle,
  AlertTriangle,
  Lock,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar,
} from 'recharts';
import { dashboardApi } from '@/api/dashboard';
import type { DashboardData } from '@/types';

const FALLBACK_DATA: DashboardData = {
  sprs_score: 47,
  total_controls: 110,
  assessed_controls: 72,
  implementation_breakdown: [
    { name: 'Implemented', value: 38, color: '#5cb85c' },
    { name: 'Partially Implemented', value: 18, color: '#f0ad4e' },
    { name: 'Planned', value: 12, color: '#5bc0de' },
    { name: 'Not Implemented', value: 4, color: '#d9534f' },
    { name: 'Not Applicable', value: 8, color: '#777' },
    { name: 'Not Assessed', value: 30, color: '#ddd' },
  ],
  family_heatmap: [
    { name: 'Access Control', code: 'AC', total: 22, implemented: 12, percentage: 55, color: '#f0ad4e' },
    { name: 'Awareness & Training', code: 'AT', total: 3, implemented: 2, percentage: 67, color: '#f0ad4e' },
    { name: 'Audit & Accountability', code: 'AU', total: 9, implemented: 7, percentage: 78, color: '#8bc34a' },
    { name: 'Config Management', code: 'CM', total: 9, implemented: 5, percentage: 56, color: '#f0ad4e' },
    { name: 'Identification & Auth', code: 'IA', total: 11, implemented: 8, percentage: 73, color: '#8bc34a' },
    { name: 'Incident Response', code: 'IR', total: 3, implemented: 3, percentage: 100, color: '#5cb85c' },
    { name: 'Maintenance', code: 'MA', total: 6, implemented: 4, percentage: 67, color: '#f0ad4e' },
    { name: 'Media Protection', code: 'MP', total: 8, implemented: 5, percentage: 63, color: '#f0ad4e' },
    { name: 'Personnel Security', code: 'PS', total: 2, implemented: 2, percentage: 100, color: '#5cb85c' },
    { name: 'Physical Protection', code: 'PE', total: 6, implemented: 4, percentage: 67, color: '#f0ad4e' },
    { name: 'Risk Assessment', code: 'RA', total: 3, implemented: 2, percentage: 67, color: '#f0ad4e' },
    { name: 'Security Assessment', code: 'CA', total: 4, implemented: 3, percentage: 75, color: '#8bc34a' },
    { name: 'System & Comm Protection', code: 'SC', total: 16, implemented: 9, percentage: 56, color: '#f0ad4e' },
    { name: 'System & Info Integrity', code: 'SI', total: 7, implemented: 5, percentage: 71, color: '#8bc34a' },
  ],
  poam_summary: {
    total: 18,
    open: 8,
    in_progress: 7,
    overdue: 3,
    by_risk: [
      { name: 'Critical', value: 2, color: '#d9534f' },
      { name: 'High', value: 5, color: '#f0ad4e' },
      { name: 'Moderate', value: 8, color: '#5bc0de' },
      { name: 'Low', value: 3, color: '#777' },
    ],
  },
  boundary_count: 24,
  score_trend: [
    { name: 'Sep', value: -12 },
    { name: 'Oct', value: 5 },
    { name: 'Nov', value: 18 },
    { name: 'Dec', value: 29 },
    { name: 'Jan', value: 38 },
    { name: 'Feb', value: 47 },
  ],
};

function sprsColor(score: number): string {
  if (score > 0) return '#5cb85c';
  if (score > -50) return '#f0ad4e';
  return '#d9534f';
}

function sprsLabel(score: number): string {
  if (score >= 80) return 'Excellent';
  if (score >= 50) return 'Good';
  if (score >= 0) return 'Fair';
  if (score >= -50) return 'Needs Improvement';
  return 'Critical';
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData>(FALLBACK_DATA);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardApi
      .getDashboard()
      .then(setData)
      .catch(() => setData(FALLBACK_DATA))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-eaw-muted">
        Loading dashboard...
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-eaw-font">
          CMMC Compliance Dashboard
        </h1>
        <p className="text-sm text-eaw-muted mt-1">
          NIST SP 800-171 Rev 2 assessment overview and SPRS scoring
        </p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="kpi-card">
          <div
            className="kpi-icon"
            style={{ backgroundColor: sprsColor(data.sprs_score) + '20' }}
          >
            <Target
              size={24}
              style={{ color: sprsColor(data.sprs_score) }}
            />
          </div>
          <div>
            <div
              className="kpi-value"
              style={{ color: sprsColor(data.sprs_score) }}
            >
              {data.sprs_score}
            </div>
            <div className="kpi-label">
              SPRS Score &middot; {sprsLabel(data.sprs_score)}
            </div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon bg-blue-50">
            <Shield size={24} className="text-eaw-primary" />
          </div>
          <div>
            <div className="kpi-value">{data.total_controls}</div>
            <div className="kpi-label">Total Controls</div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon bg-green-50">
            <CheckCircle size={24} className="text-eaw-success" />
          </div>
          <div>
            <div className="kpi-value">{data.assessed_controls}</div>
            <div className="kpi-label">Assessed Controls</div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon bg-orange-50">
            <AlertTriangle size={24} className="text-eaw-warning" />
          </div>
          <div>
            <div className="kpi-value">{data.poam_summary.open}</div>
            <div className="kpi-label">Open POA&amp;M Items</div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {/* Implementation Status Donut */}
        <div className="eaw-section">
          <div className="eaw-section-header">
            <span>Implementation Status</span>
          </div>
          <div className="eaw-section-content">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={data.implementation_breakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {data.implementation_breakdown.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number, name: string) => [
                    `${value} controls`,
                    name,
                  ]}
                />
                <Legend
                  verticalAlign="bottom"
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* SPRS Score Trend */}
        <div className="eaw-section">
          <div className="eaw-section-header">
            <span>SPRS Score Trend</span>
          </div>
          <div className="eaw-section-content">
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={data.score_trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12, fill: '#777' }}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: '#777' }}
                  domain={[-110, 110]}
                />
                <Tooltip
                  formatter={(value: number) => [
                    `${value} points`,
                    'SPRS Score',
                  ]}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#337ab7"
                  strokeWidth={2}
                  dot={{ fill: '#337ab7', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Family Heatmap */}
      <div className="eaw-section mb-6">
        <div className="eaw-section-header">
          <span>Control Family Heatmap</span>
        </div>
        <div className="eaw-section-content">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
            {data.family_heatmap.map((fam) => {
              const pct = fam.percentage;
              const bg =
                pct >= 80
                  ? '#dff0d8'
                  : pct >= 50
                  ? '#fcf8e3'
                  : '#f2dede';
              const fg =
                pct >= 80
                  ? '#3c763d'
                  : pct >= 50
                  ? '#8a6d3b'
                  : '#a94442';
              return (
                <div
                  key={fam.code}
                  className="rounded border p-3 text-center"
                  style={{ backgroundColor: bg, borderColor: fg + '40' }}
                >
                  <div
                    className="text-lg font-bold"
                    style={{ color: fg }}
                  >
                    {fam.code}
                  </div>
                  <div className="text-[11px] text-eaw-muted mt-0.5 truncate">
                    {fam.name}
                  </div>
                  <div className="mt-2">
                    <div className="w-full h-1.5 bg-white/60 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: fg,
                        }}
                      />
                    </div>
                    <div
                      className="text-xs font-semibold mt-1"
                      style={{ color: fg }}
                    >
                      {fam.implemented}/{fam.total} ({pct}%)
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* POA&M Summary */}
        <div className="eaw-section">
          <div className="eaw-section-header">
            <span>POA&amp;M by Risk Level</span>
          </div>
          <div className="eaw-section-content">
            <div className="flex gap-4 mb-4 text-sm">
              <div>
                <span className="text-eaw-muted">Total: </span>
                <span className="font-semibold">
                  {data.poam_summary.total}
                </span>
              </div>
              <div>
                <span className="text-eaw-muted">Open: </span>
                <span className="font-semibold text-eaw-danger">
                  {data.poam_summary.open}
                </span>
              </div>
              <div>
                <span className="text-eaw-muted">In Progress: </span>
                <span className="font-semibold text-eaw-warning">
                  {data.poam_summary.in_progress}
                </span>
              </div>
              <div>
                <span className="text-eaw-muted">Overdue: </span>
                <span className="font-semibold text-eaw-danger">
                  {data.poam_summary.overdue}
                </span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data.poam_summary.by_risk}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12, fill: '#777' }}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: '#777' }}
                  allowDecimals={false}
                />
                <Tooltip
                  formatter={(value: number) => [
                    `${value} items`,
                    'Count',
                  ]}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {data.poam_summary.by_risk.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Boundary Summary */}
        <div className="eaw-section">
          <div className="eaw-section-header">
            <span>CUI Boundary Summary</span>
          </div>
          <div className="eaw-section-content">
            <div className="flex items-center gap-4 py-8 justify-center">
              <div className="p-4 bg-blue-50 rounded-xl">
                <Lock size={32} className="text-eaw-primary" />
              </div>
              <div>
                <div className="text-3xl font-bold text-eaw-font">
                  {data.boundary_count}
                </div>
                <div className="text-sm text-eaw-muted">
                  Assets in CUI Scope
                </div>
              </div>
            </div>
            <div className="text-center">
              <p className="text-sm text-eaw-muted">
                Assets within the authorization boundary that process, store, or
                transmit Controlled Unclassified Information (CUI).
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
