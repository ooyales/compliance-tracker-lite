import { useEffect, useState, useMemo } from 'react';
import {
  FileText,
  Filter,
  Plus,
  X,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import { evidenceApi } from '@/api/evidence';
import { controlsApi } from '@/api/controls';
import type { Evidence, Control } from '@/types';

const EVIDENCE_TYPES = [
  '',
  'policy',
  'procedure',
  'screenshot',
  'configuration',
  'log',
  'report',
  'attestation',
  'other',
];

export default function EvidencePage() {
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [controls, setControls] = useState<Control[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('');
  const [showModal, setShowModal] = useState(false);

  // New evidence form
  const [newControlId, setNewControlId] = useState('');
  const [newType, setNewType] = useState('policy');
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    try {
      const [e, c] = await Promise.all([
        evidenceApi.getAll(),
        controlsApi.getControls(),
      ]);
      setEvidence(e);
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
    return evidence.filter((e) => {
      if (typeFilter && e.evidence_type !== typeFilter) return false;
      return true;
    });
  }, [evidence, typeFilter]);

  const handleAdd = async () => {
    if (!newControlId || !newTitle) return;
    setSubmitting(true);
    try {
      await evidenceApi.create({
        control_id: newControlId,
        evidence_type: newType,
        title: newTitle,
        description: newDescription || null,
        external_url: newUrl || null,
      });
      setShowModal(false);
      setNewControlId('');
      setNewType('policy');
      setNewTitle('');
      setNewDescription('');
      setNewUrl('');
      loadData();
    } catch {
      // silent
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this evidence?')) return;
    try {
      await evidenceApi.delete(id);
      loadData();
    } catch {
      // silent
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-eaw-muted">
        Loading evidence...
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg md:text-xl font-bold text-eaw-font flex items-center gap-2">
            <FileText size={22} className="text-eaw-primary" />
            Evidence Artifacts
          </h1>
          <p className="text-sm text-eaw-muted mt-1">
            {filtered.length} of {evidence.length} items shown
          </p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} />
          <span className="hidden sm:inline">Add Evidence</span>
          <span className="sm:hidden">Add</span>
        </button>
      </div>

      {/* Filter */}
      <div className="eaw-card mb-4">
        <div className="flex flex-wrap items-center gap-3">
          <Filter size={16} className="text-eaw-muted" />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="select-field w-full sm:w-auto"
          >
            <option value="">All Types</option>
            {EVIDENCE_TYPES.filter(Boolean).map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Desktop Table */}
      <div className="eaw-section hidden md:block">
        <div className="overflow-x-auto">
          <table className="eaw-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Type</th>
                <th>Control #</th>
                <th>Description</th>
                <th>Link/File</th>
                <th>Uploaded</th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center text-eaw-muted py-8">
                    No evidence found.
                  </td>
                </tr>
              ) : (
                filtered.map((e) => (
                  <tr key={e.id}>
                    <td className="font-medium text-eaw-font">{e.title}</td>
                    <td>
                      <span className="badge-info">{e.evidence_type}</span>
                    </td>
                    <td className="text-eaw-link whitespace-nowrap">
                      {e.control_number ?? '--'}
                    </td>
                    <td className="max-w-xs truncate text-eaw-muted">
                      {e.description ?? '--'}
                    </td>
                    <td>
                      {e.external_url ? (
                        <a
                          href={e.external_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm text-eaw-link hover:text-eaw-link-hover"
                        >
                          <ExternalLink size={14} />
                          Link
                        </a>
                      ) : e.file_path ? (
                        <span className="text-sm text-eaw-muted">
                          {e.file_path}
                        </span>
                      ) : (
                        '--'
                      )}
                    </td>
                    <td className="whitespace-nowrap text-eaw-muted text-xs">
                      {e.uploaded_at
                        ? new Date(e.uploaded_at).toLocaleDateString()
                        : '--'}
                    </td>
                    <td>
                      <button
                        onClick={() => handleDelete(e.id)}
                        className="text-eaw-muted hover:text-eaw-danger transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card List */}
      <div className="md:hidden mobile-card-table">
        {filtered.length === 0 ? (
          <div className="text-center text-eaw-muted py-8">
            No evidence found.
          </div>
        ) : (
          filtered.map((e) => (
            <div key={e.id} className="mobile-card-row">
              <div className="flex items-start justify-between gap-2 mb-1">
                <div className="font-medium text-eaw-font">{e.title}</div>
                <button
                  onClick={() => handleDelete(e.id)}
                  className="text-eaw-muted hover:text-eaw-danger transition-colors shrink-0 p-1"
                  title="Delete"
                >
                  <Trash2 size={14} />
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5 mb-2">
                <span className="badge-info">{e.evidence_type}</span>
                {e.control_number && (
                  <span className="text-xs text-eaw-link">{e.control_number}</span>
                )}
              </div>
              {e.description && (
                <div className="text-xs text-eaw-muted mb-2 line-clamp-2">
                  {e.description}
                </div>
              )}
              <div className="flex items-center justify-between text-xs text-eaw-muted">
                <span>
                  {e.uploaded_at
                    ? new Date(e.uploaded_at).toLocaleDateString()
                    : '--'}
                </span>
                {e.external_url && (
                  <a
                    href={e.external_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-eaw-link hover:text-eaw-link-hover"
                  >
                    <ExternalLink size={12} />
                    Link
                  </a>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4">
            <div className="flex items-center justify-between px-5 py-4 border-b border-eaw-border">
              <h2 className="text-base font-semibold text-eaw-font flex items-center gap-2">
                <FileText size={18} className="text-eaw-primary" />
                Add Evidence
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-eaw-muted hover:text-eaw-font"
              >
                <X size={18} />
              </button>
            </div>
            <div className="px-5 py-4 space-y-3 max-h-[70vh] overflow-y-auto">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-eaw-font mb-1">
                    Evidence Type
                  </label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                    className="select-field w-full"
                  >
                    {EVIDENCE_TYPES.filter(Boolean).map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-eaw-font mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="input-field"
                    placeholder="Evidence title..."
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-eaw-font mb-1">
                  Description
                </label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="input-field min-h-[60px] resize-y"
                  placeholder="Describe this evidence..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-eaw-font mb-1">
                  External URL
                </label>
                <input
                  type="url"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  className="input-field"
                  placeholder="https://..."
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
                disabled={submitting || !newControlId || !newTitle}
              >
                {submitting ? 'Adding...' : 'Add Evidence'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
