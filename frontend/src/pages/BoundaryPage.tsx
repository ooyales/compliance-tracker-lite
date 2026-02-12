import { useEffect, useState, useMemo } from 'react';
import { Lock, Plus, X, ToggleLeft, ToggleRight } from 'lucide-react';
import { boundaryApi } from '@/api/boundary';
import type { BoundaryAsset } from '@/types';

function classificationBadge(cls: string | null) {
  if (!cls) return <span className="badge-muted">--</span>;
  const upper = cls.toUpperCase();
  if (upper === 'CUI')
    return <span className="badge-danger">CUI</span>;
  if (upper === 'FCI')
    return <span className="badge-warning">FCI</span>;
  return <span className="badge-info">{cls}</span>;
}

export default function BoundaryPage() {
  const [assets, setAssets] = useState<BoundaryAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // New form
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState('');
  const [newBoundary, setNewBoundary] = useState('');
  const [newClassification, setNewClassification] = useState('CUI');
  const [newNotes, setNewNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    try {
      const data = await boundaryApi.getAll();
      setAssets(data);
    } catch {
      // keep empty
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const summary = useMemo(() => {
    const cuiCount = assets.filter(
      (a) =>
        a.in_scope === 1 &&
        a.data_classification?.toUpperCase() === 'CUI'
    ).length;
    const fciCount = assets.filter(
      (a) =>
        a.in_scope === 1 &&
        a.data_classification?.toUpperCase() === 'FCI'
    ).length;
    return { cuiCount, fciCount };
  }, [assets]);

  const handleAdd = async () => {
    if (!newName) return;
    setSubmitting(true);
    try {
      await boundaryApi.create({
        asset_name: newName,
        asset_type: newType || null,
        boundary_name: newBoundary || null,
        data_classification: newClassification,
        in_scope: 1,
        notes: newNotes || null,
      });
      setShowModal(false);
      setNewName('');
      setNewType('');
      setNewBoundary('');
      setNewClassification('CUI');
      setNewNotes('');
      loadData();
    } catch {
      // silent
    } finally {
      setSubmitting(false);
    }
  };

  const toggleScope = async (asset: BoundaryAsset) => {
    try {
      await boundaryApi.update(asset.id, {
        in_scope: asset.in_scope === 1 ? 0 : 1,
      });
      loadData();
    } catch {
      // silent
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-eaw-muted">
        Loading boundary assets...
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-eaw-font flex items-center gap-2">
            <Lock size={22} className="text-eaw-primary" />
            Authorization Boundary
          </h1>
          <p className="text-sm text-eaw-muted mt-1">
            {assets.length} boundary assets defined
          </p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} />
          Add Asset
        </button>
      </div>

      {/* Summary Card */}
      <div className="eaw-card mb-4">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="badge-danger text-sm px-3 py-1">CUI</span>
            <span className="text-sm font-semibold text-eaw-font">
              {summary.cuiCount} assets in scope
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="badge-warning text-sm px-3 py-1">FCI</span>
            <span className="text-sm font-semibold text-eaw-font">
              {summary.fciCount} assets in scope
            </span>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="eaw-section">
        <div className="overflow-x-auto">
          <table className="eaw-table">
            <thead>
              <tr>
                <th>Asset Name</th>
                <th>Type</th>
                <th>Classification</th>
                <th>Boundary</th>
                <th>In Scope</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {assets.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center text-eaw-muted py-8">
                    No boundary assets defined.
                  </td>
                </tr>
              ) : (
                assets.map((a) => (
                  <tr key={a.id}>
                    <td className="font-medium text-eaw-font">
                      {a.asset_name ?? '--'}
                    </td>
                    <td className="whitespace-nowrap">
                      {a.asset_type ? (
                        <span className="badge-info">{a.asset_type}</span>
                      ) : (
                        '--'
                      )}
                    </td>
                    <td>{classificationBadge(a.data_classification)}</td>
                    <td className="text-eaw-muted">
                      {a.boundary_name ?? '--'}
                    </td>
                    <td>
                      <button
                        onClick={() => toggleScope(a)}
                        className="flex items-center"
                        title={
                          a.in_scope === 1
                            ? 'Click to remove from scope'
                            : 'Click to add to scope'
                        }
                      >
                        {a.in_scope === 1 ? (
                          <ToggleRight
                            size={24}
                            className="text-eaw-success"
                          />
                        ) : (
                          <ToggleLeft
                            size={24}
                            className="text-eaw-muted"
                          />
                        )}
                      </button>
                    </td>
                    <td className="max-w-xs truncate text-eaw-muted text-xs">
                      {a.notes ?? '--'}
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
                <Lock size={18} className="text-eaw-primary" />
                Add Boundary Asset
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
                  Asset Name
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="input-field"
                  placeholder="e.g. File Server FS-01"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-eaw-font mb-1">
                    Asset Type
                  </label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                    className="select-field w-full"
                  >
                    <option value="">Select type...</option>
                    <option value="server">Server</option>
                    <option value="workstation">Workstation</option>
                    <option value="network_device">Network Device</option>
                    <option value="application">Application</option>
                    <option value="cloud_service">Cloud Service</option>
                    <option value="mobile_device">Mobile Device</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-eaw-font mb-1">
                    Data Classification
                  </label>
                  <select
                    value={newClassification}
                    onChange={(e) => setNewClassification(e.target.value)}
                    className="select-field w-full"
                  >
                    <option value="CUI">CUI</option>
                    <option value="FCI">FCI</option>
                    <option value="Public">Public</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-eaw-font mb-1">
                  Boundary Name
                </label>
                <input
                  type="text"
                  value={newBoundary}
                  onChange={(e) => setNewBoundary(e.target.value)}
                  className="input-field"
                  placeholder="e.g. Corporate LAN"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-eaw-font mb-1">
                  Notes
                </label>
                <textarea
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="input-field min-h-[60px] resize-y"
                  placeholder="Additional notes..."
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
                disabled={submitting || !newName}
              >
                {submitting ? 'Adding...' : 'Add Asset'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
