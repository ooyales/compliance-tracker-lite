import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileText, Download, CheckCircle, AlertTriangle, X } from 'lucide-react';
import { evidenceApi } from '@/api/evidence';

const TEMPLATE_HEADERS = 'control_number,evidence_type,title,description,external_url';
const TEMPLATE_SAMPLE = `3.1.1,policy,Access Control Policy v2.1,Corporate access control policy document,https://wiki.example.com/policies/ac
3.5.3,screenshot,MFA Configuration Screenshot,Screenshot showing MFA enabled for all admin accounts,
3.13.1,configuration,TLS 1.2 Configuration Export,Network device TLS configuration showing FIPS-validated ciphers,https://wiki.example.com/configs/tls`;

function downloadTemplate() {
  const content = TEMPLATE_HEADERS + '\n' + TEMPLATE_SAMPLE + '\n';
  const blob = new Blob([content], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'evidence_template.csv';
  a.click();
  URL.revokeObjectURL(url);
}

export default function UploadEvidencePage() {
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string[][]>([]);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{ created: number; errors: { row: number; message: string }[] } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const parseCSV = useCallback((text: string) => {
    const lines = text.trim().split('\n').map((l) => l.split(',').map((c) => c.trim()));
    return lines;
  }, []);

  const handleFile = useCallback((f: File) => {
    setFile(f);
    setResult(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setPreview(parseCSV(text));
    };
    reader.readAsText(f);
  }, [parseCSV]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f && (f.name.endsWith('.csv') || f.type === 'text/csv')) {
      handleFile(f);
    }
  }, [handleFile]);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const onDragLeave = useCallback(() => setDragOver(false), []);

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    try {
      const res = await evidenceApi.bulkUpload(file);
      setResult(res);
    } catch {
      setResult({ created: 0, errors: [{ row: 0, message: 'Upload failed. Check file format.' }] });
    } finally {
      setUploading(false);
    }
  };

  const headers = preview.length > 0 ? preview[0] : [];
  const rows = preview.length > 1 ? preview.slice(1) : [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-eaw-font flex items-center gap-2">
            <Upload size={22} className="text-eaw-primary" />
            Upload Evidence
          </h1>
          <p className="text-sm text-eaw-muted mt-1">
            Bulk import evidence artifacts from a CSV file
          </p>
        </div>
        <button className="btn-secondary flex items-center gap-2" onClick={downloadTemplate}>
          <Download size={16} />
          Download Template
        </button>
      </div>

      {/* Template info */}
      <div className="eaw-section mb-4">
        <div className="eaw-section-header">
          <FileText size={16} className="text-eaw-primary" />
          <span>CSV Format</span>
        </div>
        <div className="eaw-section-content">
          <p className="text-sm text-eaw-muted mb-3">
            Your CSV file should contain these columns. The <strong>control_number</strong> must match
            an existing NIST 800-171 control (e.g. 3.1.1, 3.5.3).
          </p>
          <div className="overflow-x-auto">
            <table className="eaw-table text-xs">
              <thead>
                <tr>
                  <th>Column</th>
                  <th>Required</th>
                  <th>Description</th>
                  <th>Example</th>
                </tr>
              </thead>
              <tbody>
                <tr><td className="font-medium">control_number</td><td>Yes</td><td>NIST control number</td><td>3.1.1</td></tr>
                <tr><td className="font-medium">evidence_type</td><td>No</td><td>policy, screenshot, configuration, log, report, attestation, procedure, other</td><td>policy</td></tr>
                <tr><td className="font-medium">title</td><td>Yes</td><td>Brief title for the evidence</td><td>Access Control Policy v2.1</td></tr>
                <tr><td className="font-medium">description</td><td>No</td><td>Detailed description</td><td>Corporate access control policy document</td></tr>
                <tr><td className="font-medium">external_url</td><td>No</td><td>Link to evidence artifact</td><td>https://wiki.example.com/policies/ac</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Drop zone */}
      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors mb-4 ${
          dragOver
            ? 'border-eaw-primary bg-blue-50'
            : file
            ? 'border-green-400 bg-green-50'
            : 'border-gray-300 hover:border-eaw-primary hover:bg-gray-50'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />
        {file ? (
          <div className="flex flex-col items-center gap-2">
            <CheckCircle size={40} className="text-green-500" />
            <p className="text-sm font-medium text-eaw-font">{file.name}</p>
            <p className="text-xs text-eaw-muted">{rows.length} data row{rows.length !== 1 ? 's' : ''} detected</p>
            <button
              className="text-xs text-eaw-link hover:underline mt-1"
              onClick={(e) => {
                e.stopPropagation();
                setFile(null);
                setPreview([]);
                setResult(null);
              }}
            >
              Remove file
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload size={40} className="text-eaw-muted" />
            <p className="text-sm font-medium text-eaw-font">
              Drop a CSV file here, or click to browse
            </p>
            <p className="text-xs text-eaw-muted">Accepts .csv files</p>
          </div>
        )}
      </div>

      {/* Preview table */}
      {rows.length > 0 && (
        <div className="eaw-section mb-4">
          <div className="eaw-section-header">
            <span>Preview ({rows.length} row{rows.length !== 1 ? 's' : ''})</span>
          </div>
          <div className="eaw-section-content overflow-x-auto">
            <table className="eaw-table text-sm">
              <thead>
                <tr>
                  <th className="w-8">#</th>
                  {headers.map((h, i) => (
                    <th key={i}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 20).map((row, ri) => (
                  <tr key={ri}>
                    <td className="text-eaw-muted">{ri + 1}</td>
                    {row.map((cell, ci) => (
                      <td key={ci} className="max-w-xs truncate">{cell || <span className="text-eaw-muted">--</span>}</td>
                    ))}
                  </tr>
                ))}
                {rows.length > 20 && (
                  <tr>
                    <td colSpan={headers.length + 1} className="text-center text-eaw-muted text-xs py-2">
                      ...and {rows.length - 20} more rows
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Upload button + results */}
      {file && !result && (
        <div className="flex justify-end">
          <button
            className="btn-primary flex items-center gap-2"
            onClick={handleUpload}
            disabled={uploading || rows.length === 0}
          >
            <Upload size={16} />
            {uploading ? 'Uploading...' : `Upload ${rows.length} Evidence Item${rows.length !== 1 ? 's' : ''}`}
          </button>
        </div>
      )}

      {result && (
        <div className="eaw-section">
          <div className="eaw-section-header">
            <span>Upload Results</span>
          </div>
          <div className="eaw-section-content space-y-3">
            {result.created > 0 && (
              <div className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 rounded px-4 py-3">
                <CheckCircle size={18} />
                <span className="text-sm font-medium">
                  Successfully created {result.created} evidence item{result.created !== 1 ? 's' : ''}
                </span>
              </div>
            )}
            {result.errors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded px-4 py-3">
                <div className="flex items-center gap-2 text-red-700 mb-2">
                  <AlertTriangle size={18} />
                  <span className="text-sm font-medium">
                    {result.errors.length} error{result.errors.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <ul className="text-xs text-red-600 space-y-1 ml-6">
                  {result.errors.map((err, i) => (
                    <li key={i}>Row {err.row}: {err.message}</li>
                  ))}
                </ul>
              </div>
            )}
            <div className="flex gap-3">
              <button className="btn-primary" onClick={() => navigate('/evidence')}>
                View Evidence
              </button>
              <button
                className="btn-secondary"
                onClick={() => { setFile(null); setPreview([]); setResult(null); }}
              >
                Upload Another
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
