import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Search, Filter } from 'lucide-react';
import { controlsApi } from '@/api/controls';
import type { Control, ControlFamily } from '@/types';

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'implemented', label: 'Implemented' },
  { value: 'partially_implemented', label: 'Partially Implemented' },
  { value: 'planned', label: 'Planned' },
  { value: 'not_implemented', label: 'Not Implemented' },
  { value: 'not_applicable', label: 'Not Applicable' },
  { value: 'not_assessed', label: 'Not Assessed' },
];

function statusBadge(status: string) {
  const map: Record<string, { cls: string; label: string }> = {
    implemented: { cls: 'badge-success', label: 'Implemented' },
    partially_implemented: { cls: 'badge-warning', label: 'Partial' },
    planned: { cls: 'badge-info', label: 'Planned' },
    not_implemented: { cls: 'badge-danger', label: 'Not Impl.' },
    not_applicable: { cls: 'badge-muted', label: 'N/A' },
    not_assessed: { cls: 'badge-muted', label: 'Not Assessed' },
  };
  const info = map[status] ?? { cls: 'badge-muted', label: status };
  return <span className={info.cls}>{info.label}</span>;
}

function typeBadge(type: string) {
  if (type === 'derived') return <span className="badge-info">Derived</span>;
  return <span className="badge-muted">Basic</span>;
}

export default function ControlListPage() {
  const navigate = useNavigate();
  const [controls, setControls] = useState<Control[]>([]);
  const [families, setFamilies] = useState<ControlFamily[]>([]);
  const [loading, setLoading] = useState(true);
  const [familyFilter, setFamilyFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    Promise.all([controlsApi.getControls(), controlsApi.getFamilies()])
      .then(([c, f]) => {
        setControls(c);
        setFamilies(f);
      })
      .catch(() => {
        // fallback: empty
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return controls.filter((c) => {
      if (familyFilter && c.family_id !== familyFilter) return false;
      if (statusFilter && c.implementation_status !== statusFilter)
        return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          c.control_number.toLowerCase().includes(q) ||
          c.title.toLowerCase().includes(q) ||
          (c.family_code ?? '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [controls, familyFilter, statusFilter, search]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-eaw-muted">
        Loading controls...
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-eaw-font flex items-center gap-2">
            <Shield size={22} className="text-eaw-primary" />
            NIST 800-171 Controls
          </h1>
          <p className="text-sm text-eaw-muted mt-1">
            {filtered.length} of {controls.length} controls shown
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="eaw-card mb-4">
        <div className="flex flex-wrap items-center gap-3">
          <Filter size={16} className="text-eaw-muted" />
          <select
            value={familyFilter}
            onChange={(e) => setFamilyFilter(e.target.value)}
            className="select-field"
          >
            <option value="">All Families</option>
            {families.map((f) => (
              <option key={f.id} value={f.id}>
                {f.family_code} - {f.name}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="select-field"
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>

          <div className="relative flex-1 min-w-[200px]">
            <Search
              size={16}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-eaw-muted"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-8"
              placeholder="Search by control # or title..."
            />
          </div>
        </div>
      </div>

      {/* Controls Table */}
      <div className="eaw-section">
        <div className="overflow-x-auto">
          <table className="eaw-table">
            <thead>
              <tr>
                <th>Control #</th>
                <th>Title</th>
                <th>Family</th>
                <th>Type</th>
                <th>Status</th>
                <th>Weight</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center text-eaw-muted py-8">
                    No controls found matching filters.
                  </td>
                </tr>
              ) : (
                filtered.map((c) => (
                  <tr
                    key={c.id}
                    className="cursor-pointer"
                    onClick={() => navigate(`/controls/${c.id}`)}
                  >
                    <td className="font-medium text-eaw-link whitespace-nowrap">
                      {c.control_number}
                    </td>
                    <td>{c.title}</td>
                    <td className="whitespace-nowrap">
                      <span className="badge-info">
                        {c.family_code ?? '--'}
                      </span>
                    </td>
                    <td>{typeBadge(c.control_type)}</td>
                    <td>{statusBadge(c.implementation_status)}</td>
                    <td className="text-center">{c.weight}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
