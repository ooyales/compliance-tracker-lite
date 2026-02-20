import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  ChevronDown,
  ChevronUp,
  FileText,
  ClipboardList,
  CheckCircle2,
  Circle,
  AlertCircle,
  Plus,
} from 'lucide-react';
import { controlsApi } from '@/api/controls';
import type { Control, AssessmentObjective } from '@/types';

const STATUSES = [
  { value: 'implemented', label: 'Implemented' },
  { value: 'partially_implemented', label: 'Partially Implemented' },
  { value: 'planned', label: 'Planned' },
  { value: 'not_implemented', label: 'Not Implemented' },
  { value: 'not_applicable', label: 'Not Applicable' },
  { value: 'not_assessed', label: 'Not Assessed' },
];

const OBJ_STATUSES = [
  { value: 'met', label: 'Met' },
  { value: 'not_met', label: 'Not Met' },
  { value: 'not_assessed', label: 'Not Assessed' },
];

function statusBadge(status: string) {
  const map: Record<string, string> = {
    implemented: 'badge-success',
    partially_implemented: 'badge-warning',
    planned: 'badge-info',
    not_implemented: 'badge-danger',
    not_applicable: 'badge-muted',
    not_assessed: 'badge-muted',
  };
  return map[status] ?? 'badge-muted';
}

function objStatusIcon(status: string) {
  switch (status) {
    case 'met':
      return <CheckCircle2 size={16} className="text-eaw-success" />;
    case 'not_met':
      return <AlertCircle size={16} className="text-eaw-danger" />;
    default:
      return <Circle size={16} className="text-eaw-muted" />;
  }
}

interface CollapsibleSectionProps {
  title: string;
  icon: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

function CollapsibleSection({
  title,
  icon,
  defaultOpen = true,
  children,
}: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="eaw-section">
      <div className="eaw-section-header" onClick={() => setOpen(!open)}>
        <div className="flex items-center gap-2">
          {icon}
          <span>{title}</span>
        </div>
        {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </div>
      {open && <div className="eaw-section-content">{children}</div>}
    </div>
  );
}

export default function ControlDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [control, setControl] = useState<Control | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [implStatus, setImplStatus] = useState('');
  const [implNotes, setImplNotes] = useState('');
  const [assessorNotes, setAssessorNotes] = useState('');

  const loadControl = useCallback(async () => {
    if (!id) return;
    try {
      const data = await controlsApi.getControl(id);
      setControl(data);
      setImplStatus(data.implementation_status);
      setImplNotes(data.implementation_notes ?? '');
      setAssessorNotes(data.assessor_notes ?? '');
    } catch {
      // stay on page with error state
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadControl();
  }, [loadControl]);

  const handleSave = async () => {
    if (!id) return;
    setSaving(true);
    try {
      const updated = await controlsApi.updateControl(id, {
        implementation_status: implStatus,
        implementation_notes: implNotes,
        assessor_notes: assessorNotes,
      });
      setControl(updated);
    } catch {
      // silent fail
    } finally {
      setSaving(false);
    }
  };

  const handleObjectiveToggle = async (obj: AssessmentObjective) => {
    const nextStatus =
      obj.status === 'met'
        ? 'not_met'
        : obj.status === 'not_met'
        ? 'not_assessed'
        : 'met';
    try {
      await controlsApi.updateObjective(obj.id, { status: nextStatus });
      loadControl();
    } catch {
      // silent
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-eaw-muted">
        Loading control...
      </div>
    );
  }

  if (!control) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-eaw-muted">Control not found.</p>
        <button className="btn-secondary" onClick={() => navigate('/controls')}>
          Back to Controls
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div className="min-w-0 flex-1">
          <button
            onClick={() => navigate('/controls')}
            className="flex items-center gap-1 text-sm text-eaw-link hover:text-eaw-link-hover mb-2"
          >
            <ArrowLeft size={14} />
            Back to Controls
          </button>
          <h1 className="text-lg md:text-xl font-bold text-eaw-font">
            {control.control_number}: {control.title}
          </h1>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            {control.family_code && (
              <span className="badge-info">{control.family_code}</span>
            )}
            {control.family_name && (
              <span className="text-sm text-eaw-muted">
                {control.family_name}
              </span>
            )}
            <span className="badge-muted">{control.control_type}</span>
            <span className="text-sm text-eaw-muted">
              Weight: {control.weight}
            </span>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <select
            value={implStatus}
            onChange={(e) => setImplStatus(e.target.value)}
            className={`select-field font-medium ${statusBadge(implStatus)}`}
          >
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          <button
            className="btn-primary"
            onClick={handleSave}
            disabled={saving}
          >
            <Save size={16} />
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {/* Requirement */}
      <CollapsibleSection
        title="Requirement"
        icon={<FileText size={16} className="text-eaw-primary" />}
      >
        <p className="text-sm leading-relaxed text-eaw-font whitespace-pre-wrap">
          {control.requirement_text || 'No requirement text available.'}
        </p>
      </CollapsibleSection>

      {/* Plain English */}
      <CollapsibleSection
        title="Plain English"
        icon={<FileText size={16} className="text-eaw-info" />}
      >
        <p className="text-sm leading-relaxed text-eaw-font whitespace-pre-wrap">
          {control.plain_english || 'No plain English summary available.'}
        </p>
      </CollapsibleSection>

      {/* Guidance */}
      <CollapsibleSection
        title="Guidance"
        icon={<FileText size={16} className="text-eaw-success" />}
        defaultOpen={false}
      >
        <p className="text-sm leading-relaxed text-eaw-font whitespace-pre-wrap">
          {control.guidance_text ||
            'No guidance text available for this control.'}
        </p>
      </CollapsibleSection>

      {/* Assessment Objectives */}
      <CollapsibleSection
        title="Assessment Objectives"
        icon={<CheckCircle2 size={16} className="text-eaw-warning" />}
      >
        {control.objectives && control.objectives.length > 0 ? (
          <div className="space-y-2">
            {control.objectives.map((obj) => (
              <div
                key={obj.id}
                className="flex items-start gap-3 p-3 bg-gray-50 rounded border border-eaw-border-light hover:bg-gray-100 cursor-pointer"
                onClick={() => handleObjectiveToggle(obj)}
              >
                {objStatusIcon(obj.status)}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-eaw-font">
                    {obj.objective_number}
                  </div>
                  <div className="text-sm text-eaw-muted mt-0.5">
                    {obj.objective_text}
                  </div>
                </div>
                <select
                  value={obj.status}
                  onClick={(e) => e.stopPropagation()}
                  onChange={async (e) => {
                    try {
                      await controlsApi.updateObjective(obj.id, {
                        status: e.target.value,
                      });
                      loadControl();
                    } catch {
                      // silent
                    }
                  }}
                  className="select-field text-xs"
                >
                  {OBJ_STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-eaw-muted">
            No assessment objectives loaded for this control.
          </p>
        )}
      </CollapsibleSection>

      {/* Implementation Notes */}
      <CollapsibleSection
        title="Implementation Notes"
        icon={<ClipboardList size={16} className="text-eaw-primary" />}
      >
        <textarea
          value={implNotes}
          onChange={(e) => setImplNotes(e.target.value)}
          className="input-field min-h-[120px] resize-y"
          placeholder="Describe how this control is implemented in your environment..."
        />
        <textarea
          value={assessorNotes}
          onChange={(e) => setAssessorNotes(e.target.value)}
          className="input-field min-h-[80px] resize-y mt-3"
          placeholder="Assessor notes..."
        />
      </CollapsibleSection>

      {/* Evidence */}
      <CollapsibleSection
        title="Evidence"
        icon={<FileText size={16} className="text-eaw-success" />}
        defaultOpen={false}
      >
        {control.evidence && control.evidence.length > 0 ? (
          <div className="space-y-2">
            {control.evidence.map((ev) => (
              <div
                key={ev.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-gray-50 rounded border border-eaw-border-light gap-2"
              >
                <div>
                  <div className="text-sm font-medium text-eaw-font">
                    {ev.title}
                  </div>
                  <div className="text-xs text-eaw-muted">
                    {ev.evidence_type} &middot; {ev.uploaded_at}
                  </div>
                </div>
                {ev.external_url && (
                  <a
                    href={ev.external_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-eaw-link hover:text-eaw-link-hover"
                  >
                    View
                  </a>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-eaw-muted">
            No evidence linked to this control.
          </p>
        )}
        <button
          className="btn-secondary mt-3"
          onClick={() => navigate(`/evidence?control=${control.id}`)}
        >
          <Plus size={14} />
          Add Evidence
        </button>
      </CollapsibleSection>

      {/* POA&M Items */}
      <CollapsibleSection
        title="POA&M Items"
        icon={<AlertCircle size={16} className="text-eaw-danger" />}
        defaultOpen={false}
      >
        {control.poam_items && control.poam_items.length > 0 ? (
          <div className="space-y-2">
            {control.poam_items.map((item) => (
              <div
                key={item.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-gray-50 rounded border border-eaw-border-light gap-2"
              >
                <div>
                  <div className="text-sm font-medium text-eaw-font">
                    {item.weakness_description ?? 'Weakness not described'}
                  </div>
                  <div className="text-xs text-eaw-muted">
                    Risk: {item.risk_level} &middot; Status: {item.status}
                    {item.planned_completion_date &&
                      ` · Due: ${item.planned_completion_date}`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-eaw-muted">
            No POA&amp;M items for this control.
          </p>
        )}
        <button
          className="btn-secondary mt-3"
          onClick={() => navigate(`/poam?control=${control.id}`)}
        >
          <Plus size={14} />
          Add POA&amp;M Item
        </button>
      </CollapsibleSection>
    </div>
  );
}
