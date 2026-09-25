import { useState } from 'react';
import axiosInstance from '../../api/axiosInstance';
import { X, Loader2 } from 'lucide-react';

export default function AddStudentModal({ batches, onClose, onSuccess }) {
  const [form, setForm] = useState({
    frn: '', fullName: '', email: '', phone: '',
    profile: { dob: '', collegeName: '', collegeLocation: '', currentYear: '', graduationYear: '', instagramId: '', linkedinId: '' },
    contacts: [{ contactType: 'PARENT', name: '', phone: '', email: '' }]
  });
  const [batchHint, setBatchHint] = useState('');
  const [frnError, setFrnError] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function handleFrnChange(val) {
    setForm(f => ({ ...f, frn: val }));
    const match = val.match(/^FRN-([A-Z0-9]{7})\/(\d{3})$/i);
    if (match) {
      setBatchHint(`Batch code: ${match[1].toUpperCase()}`);
      setFrnError('');
    } else if (val.length > 6) {
      setBatchHint('');
      setFrnError('Format: FRN-XXYNNNN/NNN (e.g. FRN-01J0126/001)');
    } else {
      setBatchHint(''); setFrnError('');
    }
  }

  function handleContactChange(field, val) {
    setForm(f => ({
      ...f,
      contacts: [{ ...f.contacts[0], [field]: val }]
    }));
  }

  function handleProfileChange(field, val) {
    setForm(f => ({ ...f, profile: { ...f.profile, [field]: val } }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (frnError) return;
    setError(''); setLoading(true);
    try {
      const payload = {
        frn: form.frn.toUpperCase(),
        fullName: form.fullName,
        email: form.email,
        phone: form.phone,
        profile: {
          ...form.profile,
          currentYear: form.profile.currentYear ? parseInt(form.profile.currentYear) : null,
          graduationYear: form.profile.graduationYear ? parseInt(form.profile.graduationYear) : null,
          dob: form.profile.dob || null,
        },
        contacts: form.contacts
      };
      await axiosInstance.post('/students', payload);
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add student');
    } finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-fbs-darker border border-fbs-border rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-fbs-border sticky top-0 bg-fbs-darker z-10">
          <div>
            <h2 className="font-heading text-xl font-bold">Add Student</h2>
            <p className="text-gray-400 text-xs mt-0.5">Fill in student details</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-fbs-card rounded-lg transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-6">
          {error && (
            <div className="bg-red-900/30 border border-red-700 text-red-400 text-sm rounded-lg px-4 py-3">
              {error}
            </div>
          )}

          {/* Identity */}
          <div>
            <div className="text-xs font-semibold text-fbs-green uppercase tracking-widest mb-3">
              Student Identity
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-xs text-gray-400 mb-1 block">FRN *</label>
                <input
                  required value={form.frn}
                  onChange={e => handleFrnChange(e.target.value)}
                  placeholder="FRN-01J0126/001"
                  className={`w-full bg-fbs-dark border ${frnError ? 'border-red-600' : 'border-fbs-border'} rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-fbs-green transition font-mono`}
                />
                {batchHint && <p className="text-xs text-fbs-green mt-1">{batchHint}</p>}
                {frnError && <p className="text-xs text-red-400 mt-1">{frnError}</p>}
              </div>
              {[
                { field: 'fullName', label: 'Full Name *', placeholder: 'Rahul Sharma', required: true },
                { field: 'email', label: 'Email *', placeholder: 'rahul@gmail.com', required: true, type: 'email' },
                { field: 'phone', label: 'Phone *', placeholder: '9876543210', required: true },
              ].map(({ field, label, placeholder, required, type = 'text' }) => (
                <div key={field}>
                  <label className="text-xs text-gray-400 mb-1 block">{label}</label>
                  <input
                    type={type} required={required}
                    value={form[field]}
                    onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                    placeholder={placeholder}
                    className="w-full bg-fbs-dark border border-fbs-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-fbs-green transition"
                  />
                </div>
              ))}
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Date of Birth</label>
                <input type="date"
                  value={form.profile.dob}
                  onChange={e => handleProfileChange('dob', e.target.value)}
                  className="w-full bg-fbs-dark border border-fbs-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-fbs-green transition"
                />
              </div>
            </div>
          </div>

          {/* Profile */}
          <div>
            <div className="text-xs font-semibold text-fbs-green uppercase tracking-widest mb-3">
              Profile Details
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { field: 'collegeName', label: 'College Name', placeholder: 'MIT College' },
                { field: 'collegeLocation', label: 'College Location', placeholder: 'Pune' },
                { field: 'currentYear', label: 'Current Year', placeholder: '3', type: 'number' },
                { field: 'graduationYear', label: 'Graduation Year', placeholder: '2026', type: 'number' },
                { field: 'instagramId', label: 'Instagram ID', placeholder: '@rahul_s' },
                { field: 'linkedinId', label: 'LinkedIn ID', placeholder: 'linkedin.com/in/rahul' },
              ].map(({ field, label, placeholder, type = 'text' }) => (
                <div key={field}>
                  <label className="text-xs text-gray-400 mb-1 block">{label}</label>
                  <input type={type}
                    value={form.profile[field]}
                    onChange={e => handleProfileChange(field, e.target.value)}
                    placeholder={placeholder}
                    className="w-full bg-fbs-dark border border-fbs-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-fbs-green transition"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div>
            <div className="text-xs font-semibold text-fbs-green uppercase tracking-widest mb-3">
              Parent / Guardian Contact *
            </div>
            <div className="bg-fbs-dark border border-fbs-border rounded-xl p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-xs text-gray-400 mb-1 block">Contact Type</label>
                  <select
                    value={form.contacts[0].contactType}
                    onChange={e => handleContactChange('contactType', e.target.value)}
                    className="w-full bg-fbs-darker border border-fbs-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-fbs-green">
                    <option value="PARENT">PARENT</option>
                    <option value="GUARDIAN">GUARDIAN</option>
                  </select>
                </div>
                {[
                  { field: 'name', label: 'Contact Name *', placeholder: 'Ramesh Sharma', required: true },
                  { field: 'phone', label: 'Contact Phone *', placeholder: '9123456780', required: true },
                  { field: 'email', label: 'Contact Email', placeholder: 'ramesh@gmail.com', type: 'email' },
                ].map(({ field, label, placeholder, required, type = 'text' }) => (
                  <div key={field} className={field === 'email' ? 'col-span-2' : ''}>
                    <label className="text-xs text-gray-400 mb-1 block">{label}</label>
                    <input type={type} required={required}
                      value={form.contacts[0][field]}
                      onChange={e => handleContactChange(field, e.target.value)}
                      placeholder={placeholder}
                      className="w-full bg-fbs-darker border border-fbs-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-fbs-green transition"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 border border-fbs-border rounded-lg text-sm text-gray-400 hover:bg-fbs-card transition">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-2.5 bg-fbs-green hover:bg-fbs-yellow text-black font-semibold rounded-lg text-sm transition flex items-center justify-center gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add Student'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}