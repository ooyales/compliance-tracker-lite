import { useEffect, useState, useMemo } from 'react';
import {
  ClipboardList,
  Filter,
  Plus,
  X,
  AlertTriangle,
} from 'lucide-react';
import { poamApi } from '@/api/poam';
import { controlsApi } from '@/api/controls';
import type { POAMItem, Control } from '@/types';

const RISK_LEVELS = ['', 'critical', 'high', 'moderate', 'low'];
const STATUS_OPTIONS = ['', 'open', 'in_progress', 'completed', 'accepted_risk'];

function riskBadge(level: string) {
  const map: Record<string, string> = {
    critical: 'badge-danger',
    high: 'badge-warning',
    moderate: 'badge-info',
    low: 'badge-muted',
  };
  return <span className={map[level] ?? 'badge-muted'}>{level}</span>;
}

function poamStatusBadge(status: string) {
  const map: Record<string, { cls: string; label: string }> = {
    open: { cls: 'badge-danger', label: 'Open' },
    in_progress: { cls: 'badge-warning', label: 'In Progress' },
    completed: { cls: 'badge-success', label: 'Completed' },
    accepted_risk: { cls: 'badge-info', label: 'Accepted Risk' },
  };
  const info = map[status] ?? { cls: 'badge-muted', label: status };
  return <span className={info.cls}>{info.label}</span>;
}

export default function POAMPage() {
  const [items, setItems] = useState<POAMItem[]>([]);
  const [controls, setControls] = useState<Control[]>([]);
  const [loading, setLoading] = useState(true);
  const [riskFilter, setRiskFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);

  // New item form
  const [newControlId, setNewControlId] = useState('');
  const [newWeakness, setNewWeakness] = useState('');
  const [newRemediation, setNewRemediation] = useState('');
  const [newRisk, setNewRisk] = useState('moderate');
  const [newOwner, setNewOwner] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    try {
      const [p, c] = await Promise.all([
        poamApi.getAll(),
        controlsApi.getControls(),
      ]);
      setItems(p);
      setControls(c);
    } catch {
      // keep empty
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      if (riskFilter && item.risk_level !== riskFilter) return false;
      if (statusFilter && item.status !== statusFilter) return false;
      return true;
    });
  }, [items, riskFilter, statusFilter]);

  const handleAdd = async () => {
    if (!newControlId || !newWeakness) return;
    setSubmitting(true);
    try {
      await poamApi.create({
        control_id: newControlId,
        weakness_description: newWeakness,
        remediation_plan: newRemediation,
        risk_level: newRisk,
        responsible_person: newOwner,
        planned_completion_date: newDueDate || null,
        status: 'open',
      });
      setShowModal(false);
      setNewControlId('');
      setNewWeakness('');
      setNewRemediation('');
      setNewRisk('moderate');
      setNewOwner('');
      setNewDueDate('');
      loadData();
    } catch {
      // silent
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (item: POAMItem, newStatus: string) => {
    try {
      await poamApi.update(item.id, { status: newStatus });
      loadData();
    } catch {
      // silent
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-eaw-muted">
        Loading POA&amp;M items...
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-eaw-font flex items-center gap-2">
            <ClipboardList size={22} className="text-eaw-primary" />
            Plan of Action &amp; Milestones (POA&amp;M)
          </h1>
          <p className="text-sm text-eaw-muted mt-1">
            {filtered.length} of {items.length} items shown
          </p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} />
          Add POA&amp;M
        </button>
      </div>

      {/* Filter Bar */}
      <div className="eaw-card mb-4">
        <div className="flex items-center gap-3">
          <Filter size={16} className="text-eaw-muted" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="select-field"
          >
            <option value="">All Statuses</option>
            {STATUS_OPTIONS.filter(Boolean).map((s) => (
              <option key={s} value={s}>
                {s.replace('_', ' ')}
              </option>
            ))}
          </select>
          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="select-field"
          >
            <option value="">All Risk Levels</option>
            {RISK_LEVELS.filter(Boolean).map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="eaw-section">
        <div className="overflow-x-auto">
          <table className="eaw-table">
            <thead>
              <tr>
                <th>Control #</th>
                <th>Weakness</th>
                <th>Remediation Plan</th>
                <th>Risk</th>
                <th>Owner</th>
                <th>Due Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center text-eaw-muted py-8">
                    No POA&amp;M items found.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id}>
                    <td className="font-medium text-eaw-link whitespace-nowrap">
                      {item.control_number ?? '--'}
                    </td>
                    <td className="max-w-xs truncate">
                      {item.weakness_description}
                    </td>
                    <td className="max-w-xs truncate">
                      {item.remediation_plan}
                    </td>
                    <td>{riskBadge(item.risk_level)}</td>
                    <td className="whitespace-nowrap">
                      {item.responsible_person ?? '--'}
                    </td>
                    <td className="whitespace-nowrap">
                      {item.planned_completion_date ?? '--'}
                    </td>
                    <td>
                      <select
                        value={item.status}
                        onChange={(e) =>
                          handleStatusChange(item, e.target.value)
                        }
                        className="select-field text-xs"
                      >
                        <option value="open">Open</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="accepted_risk">Accepted Risk</option>
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4">
            <div className="flex items-center justify-between px-5 py-4 border-b border-eaw-border">
              <h2 className="text-base font-semibold text-eaw-font flex items-center gap-2">
                <AlertTriangle size={18} className="text-eaw-warning" />
                New POA&amp;M Item
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-eaw-muted hover:text-eaw-font"
              >
                <X size={18} />
              </button>
            </div>
            <div className="px-5 py-4 space-y-3">
              <div>
                <label className="block text-sm font-medium text-eaw-font mb-1">
                  Control
                </label>
                <select
                  value={newControlId}
                  onChange={(e) => setNewControlId(e.target.value)}
                  className="select-field w-full"
                >
                  <option value="">Select a control...</option>
                  {controls.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.control_number}: {c.title}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-eaw-font mb-1">
                  Weakness Description
                </label>
                <textarea
                  value={newWeakness}
                  onChange={(e) => setNewWeakness(e.target.value)}
                  className="input-field min-h-[60px] resize-y"
                  placeholder="Describe the weakness..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-eaw-font mb-1">
                  Remediation Plan
                </label>
                <textarea
                  value={newRemediation}
                  onChange={(e) => setNewRemediation(e.target.value)}
                  className="input-field min-h-[60px] resize-y"
                  placeholder="How will this be remediated?"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-eaw-font mb-1">
                    Risk Level
                  </label>
                  <select
                    value={newRisk}
                    onChange={(e) => setNewRisk(e.target.value)}
                    className="select-field w-full"
                  >
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="moderate">Moderate</option>
                    <option value="low">Low</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-eaw-font mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="input-field"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-eaw-font mb-1">
                  Responsible Person
                </label>
                <input
                  type="text"
                  value={newOwner}
                  onChange={(e) => setNewOwner(e.target.value)}
                  className="input-field"
                  placeholder="Name or role..."
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 px-5 py-4 border-t border-eaw-border">
              <button
                className="btn-secondary"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={handleAdd}
                disabled={submitting || !newControlId || !newWeakness}
              >
                {submitting ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
