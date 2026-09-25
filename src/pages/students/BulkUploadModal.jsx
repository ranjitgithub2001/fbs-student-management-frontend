import { useState, useRef } from 'react';
import axiosInstance from '../../api/axiosInstance';
import { X, Upload, FileText, Loader2, CheckCircle, AlertCircle, SkipForward } from 'lucide-react';

const STEPS = ['upload', 'preview', 'result'];

export default function BulkUploadModal({ onClose, onSuccess }) {
  const [step, setStep] = useState('upload');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef();

  function handleFileDrop(e) {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) setFile(f);
  }

  async function handlePreview() {
    if (!file) return;
    setLoading(true); setError('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await axiosInstance.post('/students/bulk/preview', fd);
      setPreview(res.data);
      setStep('preview');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to parse file');
    } finally { setLoading(false); }
  }

  async function handleImport() {
    setLoading(true); setError('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await axiosInstance.post('/students/bulk', fd);
      setResult(res.data);
      setStep('result');
    } catch (err) {
      setError(err.response?.data?.message || 'Import failed');
    } finally { setLoading(false); }
  }

  // Count importable rows (READY + REACTIVATE)
  const importCount = preview?.rows?.filter(r => r.status === 'READY' || r.status === 'REACTIVATE').length || 0;

  const statusColor = {
    READY:      'text-fbs-green',
    REACTIVATE: 'text-blue-400',
    DUPLICATE:  'text-yellow-400',
    ERROR:      'text-red-400',
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-fbs-darker border border-fbs-border rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-fbs-border sticky top-0 bg-fbs-darker z-10">
          <div>
            <h2 className="font-heading text-xl font-bold">Bulk Upload Students</h2>
            <div className="flex gap-2 mt-1">
              {['Upload', 'Preview', 'Result'].map((s, i) => (
                <span key={s} className={`text-xs px-2 py-0.5 rounded-full ${
                  STEPS[i] === step ? 'bg-fbs-green text-black font-semibold' :
                  STEPS.indexOf(step) > i ? 'bg-fbs-card text-gray-400' : 'text-gray-600'
                }`}>{i + 1}. {s}</span>
              ))}
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-fbs-card rounded-lg transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="bg-red-900/30 border border-red-700 text-red-400 text-sm rounded-lg px-4 py-3 mb-4">
              {error}
            </div>
          )}

          {/* Step 1 — Upload */}
          {step === 'upload' && (
            <div>
              <div
                onDragOver={e => e.preventDefault()}
                onDrop={handleFileDrop}
                onClick={() => fileRef.current.click()}
                className="border-2 border-dashed border-fbs-border rounded-xl p-12 text-center cursor-pointer hover:border-fbs-green transition">
                <Upload className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400 mb-1">Drop your CSV or Excel file here</p>
                <p className="text-xs text-gray-600">Supports .csv and .xlsx up to 10MB</p>
                {file && (
                  <div className="mt-3 inline-flex items-center gap-2 bg-fbs-card border border-fbs-border rounded-lg px-3 py-1.5 text-sm text-fbs-green">
                    <FileText className="w-4 h-4" /> {file.name}
                  </div>
                )}
              </div>
              <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" className="hidden"
                onChange={e => setFile(e.target.files[0])} />

              <div className="mt-4 bg-fbs-dark border border-fbs-border rounded-xl p-4">
                <p className="text-xs font-semibold text-fbs-green uppercase tracking-widest mb-2">Required Columns</p>
                <p className="text-xs text-gray-400 leading-relaxed">
                  FRN · Full Name · Phone · Batch Name — all other fields are optional
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  💡 Use our Excel template for best results
                </p>
              </div>

              <div className="flex gap-3 mt-4">
                <button onClick={onClose}
                  className="flex-1 py-2.5 border border-fbs-border rounded-lg text-sm text-gray-400 hover:bg-fbs-card transition">
                  Cancel
                </button>
                <button onClick={handlePreview} disabled={!file || loading}
                  className="flex-1 py-2.5 bg-fbs-green hover:bg-fbs-yellow text-black font-semibold rounded-lg text-sm transition flex items-center justify-center gap-2 disabled:opacity-50">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Preview File'}
                </button>
              </div>
            </div>
          )}

          {/* Step 2 — Preview */}
          {step === 'preview' && preview && (
            <div>
              {/* Summary chips */}
              <div className="grid grid-cols-5 gap-2 mb-4">
                {[
                  { label: 'Total',      value: preview.total,   color: 'text-white' },
                  { label: 'Ready',      value: preview.rows?.filter(r => r.status === 'READY').length || 0,      color: 'text-fbs-green' },
                  { label: 'Reactivate', value: preview.rows?.filter(r => r.status === 'REACTIVATE').length || 0, color: 'text-blue-400' },
                  { label: 'Duplicates', value: preview.skipped, color: 'text-yellow-400' },
                  { label: 'Errors',     value: preview.errors,  color: 'text-red-400' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="bg-fbs-dark border border-fbs-border rounded-xl p-3 text-center">
                    <div className={`text-xl font-bold ${color}`}>{value}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{label}</div>
                  </div>
                ))}
              </div>

              {/* Legend */}
              <div className="flex gap-4 mb-3 text-xs">
                <span className="text-fbs-green">● READY — new student</span>
                <span className="text-blue-400">● REACTIVATE — was inactive, will be restored</span>
                <span className="text-yellow-400">● DUPLICATE — already active</span>
                <span className="text-red-400">● ERROR — missing required field</span>
              </div>

              {/* Table */}
              <div className="border border-fbs-border rounded-xl overflow-hidden mb-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-fbs-border bg-fbs-dark">
                      <th className="text-left text-xs text-gray-500 px-4 py-2">Status</th>
                      <th className="text-left text-xs text-gray-500 px-4 py-2">FRN</th>
                      <th className="text-left text-xs text-gray-500 px-4 py-2">Name</th>
                      <th className="text-left text-xs text-gray-500 px-4 py-2">Batch</th>
                      <th className="text-left text-xs text-gray-500 px-4 py-2">Issue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.rows.map((row, i) => (
                      <tr key={i} className="border-b border-fbs-border/50">
                        <td className={`px-4 py-2 text-xs font-bold ${statusColor[row.status] || 'text-gray-400'}`}>
                          {row.status}
                        </td>
                        <td className="px-4 py-2 text-xs font-mono text-fbs-green">{row.frn}</td>
                        <td className="px-4 py-2 text-xs text-white">{row.fullName}</td>
                        <td className="px-4 py-2 text-xs text-gray-400">{row.batchCode}</td>
                        <td className="px-4 py-2 text-xs text-red-400">{row.issue || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep('upload')}
                  className="flex-1 py-2.5 border border-fbs-border rounded-lg text-sm text-gray-400 hover:bg-fbs-card transition">
                  Back
                </button>
                <button onClick={handleImport} disabled={loading || importCount === 0}
                  className="flex-1 py-2.5 bg-fbs-green hover:bg-fbs-yellow text-black font-semibold rounded-lg text-sm transition flex items-center justify-center gap-2 disabled:opacity-50">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : `Import ${importCount} Students`}
                </button>
              </div>
            </div>
          )}

          {/* Step 3 — Result */}
          {step === 'result' && result && (
            <div>
              <div className="text-center mb-6">
                <CheckCircle className="w-14 h-14 text-fbs-green mx-auto mb-3" />
                <h3 className="font-heading text-xl font-bold">Import Complete</h3>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-4">
                {[
                  { label: 'Imported', value: result.inserted, icon: CheckCircle, color: 'text-fbs-green' },
                  { label: 'Skipped',  value: result.skipped,  icon: SkipForward,  color: 'text-yellow-400' },
                  { label: 'Errors',   value: result.errors,   icon: AlertCircle,  color: 'text-red-400' },
                ].map(({ label, value, icon: Icon, color }) => (
                  <div key={label} className="bg-fbs-dark border border-fbs-border rounded-xl p-4 text-center">
                    <Icon className={`w-5 h-5 ${color} mx-auto mb-1`} />
                    <div className={`text-2xl font-bold ${color}`}>{value}</div>
                    <div className="text-xs text-gray-500">{label}</div>
                  </div>
                ))}
              </div>

              {(result.skippedRows?.length > 0 || result.errorRows?.length > 0) && (
                <div className="bg-fbs-dark border border-fbs-border rounded-xl p-4 mb-4 max-h-40 overflow-y-auto">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Skip / Error Report</p>
                  {[...(result.skippedRows || []), ...(result.errorRows || [])].map((row, i) => (
                    <div key={i} className="text-xs py-1 border-b border-fbs-border/50 flex gap-3">
                      <span className="font-mono text-fbs-green">{row.frn}</span>
                      <span className="text-gray-400">{row.name}</span>
                      <span className="text-red-400 ml-auto">{row.reason}</span>
                    </div>
                  ))}
                </div>
              )}

              <button onClick={onSuccess}
                className="w-full py-2.5 bg-fbs-green hover:bg-fbs-yellow text-black font-semibold rounded-lg text-sm transition">
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}