import { useState, useEffect } from 'react';
import DashboardLayout from "../components/DashboardLayout";
import axiosInstance from '../api/axiosInstance';
import { formatDate } from '../utils/dateUtils';
import {
  ClipboardList, Check, X, Loader2,
  User, Mail, Briefcase, BadgeCheck, Clock, XCircle, Shield
} from 'lucide-react';
import ResponsiveTable from '../components/ResponsiveTable';

const STATUS_TABS = ['ALL', 'PENDING', 'APPROVED', 'REJECTED'];

const ROLE_LABELS = {
  ADMIN: { label: 'Admin', color: 'text-red-400 bg-red-900/20 border-red-700/30' },
  TRAINER: { label: 'Trainer', color: 'text-blue-400 bg-blue-900/20 border-blue-700/30' },
  PLACEMENT: { label: 'Placement', color: 'text-purple-400 bg-purple-900/20 border-purple-700/30' },
  OFFICE_STAFF: { label: 'Office Staff', color: 'text-orange-400 bg-orange-900/20 border-orange-700/30' },
  VIEWER: { label: 'Viewer', color: 'text-gray-400 bg-gray-900/20 border-gray-700/30' },
};

function RoleBadge({ role }) {
  const r = ROLE_LABELS[role] || { label: role, color: 'text-gray-400 bg-gray-900/20 border-gray-700/30' };
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${r.color}`}>
      <Shield className="w-3 h-3" /> {r.label}
    </span>
  );
}

export default function AccessRequestsPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('PENDING');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [actionType, setActionType] = useState('');
  const [remarks, setRemarks] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');

  useEffect(() => { fetchRequests(); }, []);

  async function fetchRequests() {
    setLoading(true); setError('');
    try {
      const res = await axiosInstance.get('/auth/requests');
      setRequests(res.data);
    } catch { setError('Failed to load access requests'); }
    finally { setLoading(false); }
  }

  const filtered = requests.filter(r =>
    activeTab === 'ALL' ? true : r.status === activeTab
  );

  const counts = {
    ALL: requests.length,
    PENDING: requests.filter(r => r.status === 'PENDING').length,
    APPROVED: requests.filter(r => r.status === 'APPROVED').length,
    REJECTED: requests.filter(r => r.status === 'REJECTED').length,
  };

  function openAction(request, type) {
    setSelectedRequest(request);
    setActionType(type);
    setRemarks('');
    setActionError('');
    setShowModal(true);
  }

  async function handleAction() {
    if (actionType === 'reject' && !remarks.trim()) {
      setActionError('Please provide a reason for rejection');
      return;
    }
    setActionLoading(true); setActionError('');
    try {
      await axiosInstance.put(`/auth/requests/${selectedRequest.id}/${actionType}`, { remarks: remarks.trim() });
      setShowModal(false);
      fetchRequests();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Action failed');
    } finally { setActionLoading(false); }
  }

  const statusBadge = (status) => {
    const styles = {
      PENDING: 'bg-yellow-900/30 border-yellow-700/50 text-yellow-400',
      APPROVED: 'bg-green-900/30 border-green-700/50 text-fbs-green',
      REJECTED: 'bg-red-900/30 border-red-700/50 text-red-400',
    };
    const icons = {
      PENDING: <Clock className="w-3 h-3" />,
      APPROVED: <BadgeCheck className="w-3 h-3" />,
      REJECTED: <XCircle className="w-3 h-3" />,
    };
    return (
      <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full border ${styles[status]}`}>
        {icons[status]} {status}
      </span>
    );
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="mb-6">
          <h1 className="font-heading text-2xl font-bold text-white">Access Requests</h1>
          <p className="text-gray-400 text-sm mt-0.5">Review and manage staff access requests</p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
          {[
            { label: 'Total', count: counts.ALL, color: 'text-white', border: 'border-fbs-border' },
            { label: 'Pending', count: counts.PENDING, color: 'text-yellow-400', border: 'border-yellow-700/30' },
            { label: 'Approved', count: counts.APPROVED, color: 'text-fbs-green', border: 'border-fbs-green/30' },
            { label: 'Rejected', count: counts.REJECTED, color: 'text-red-400', border: 'border-red-700/30' },
          ].map(({ label, count, color, border }) => (
            <div key={label} className={`bg-fbs-darker border ${border} rounded-2xl p-4 text-center`}>
              <div className={`text-2xl font-bold ${color}`}>{count}</div>
              <div className="text-xs text-gray-500 mt-0.5">{label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-1 bg-fbs-darker border border-fbs-border rounded-xl p-1 mb-4 w-full sm:w-fit max-w-full">
          {STATUS_TABS.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === tab
                  ? 'bg-fbs-card text-fbs-green border border-fbs-border'
                  : 'text-gray-500 hover:text-gray-300'
              }`}>
              {tab} {counts[tab] > 0 && (
                <span className={`ml-1 ${activeTab === tab ? 'text-fbs-green' : 'text-gray-600'}`}>
                  ({counts[tab]})
                </span>
              )}
            </button>
          ))}
        </div>

        {error && (
          <div className="bg-red-900/30 border border-red-700 text-red-400 text-sm rounded-lg px-4 py-3 mb-4">{error}</div>
        )}

        {/* Table */}
        <div className="bg-fbs-darker border border-fbs-border rounded-2xl overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-fbs-green" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <ClipboardList className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">No {activeTab.toLowerCase()} requests</p>
            </div>
          ) : (
            <ResponsiveTable>
            <table className="w-full">
              <thead>
                <tr className="border-b border-fbs-border">
                  <th className="text-left text-xs text-gray-500 uppercase tracking-widest px-5 py-3">Name</th>
                  <th className="text-left text-xs text-gray-500 uppercase tracking-widest px-5 py-3">Email</th>
                  <th className="text-left text-xs text-gray-500 uppercase tracking-widest px-5 py-3">Designation</th>
                  <th className="text-left text-xs text-gray-500 uppercase tracking-widest px-5 py-3">Role Requested</th>
                  <th className="text-left text-xs text-gray-500 uppercase tracking-widest px-5 py-3">Requested</th>
                  <th className="text-left text-xs text-gray-500 uppercase tracking-widest px-5 py-3">Status</th>
                  <th className="text-left text-xs text-gray-500 uppercase tracking-widest px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, i) => (
                  <tr key={r.id}
                    className={`border-b border-fbs-border/50 hover:bg-fbs-card/30 transition ${i % 2 === 0 ? '' : 'bg-fbs-dark/20'}`}>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-fbs-card border border-fbs-border flex items-center justify-center flex-shrink-0">
                          <span className="text-fbs-green text-xs font-semibold">
                            {r.fullName?.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                          </span>
                        </div>
                        <span className="text-sm text-white font-medium">{r.fullName}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-400">{r.email}</td>
                    <td className="px-5 py-3 text-sm text-gray-400">{r.designation || '—'}</td>
                    <td className="px-5 py-3">
                      <RoleBadge role={r.requestedRole} />
                    </td>
                    <td className="px-5 py-3 text-xs text-gray-500">{formatDate(r.requestedAt)}</td>
                    <td className="px-5 py-3">{statusBadge(r.status)}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        {r.status === 'PENDING' && (
                          <>
                            <button onClick={() => openAction(r, 'approve')}
                              className="flex items-center gap-1 px-2.5 py-1 bg-fbs-green/10 border border-fbs-green/30 text-fbs-green rounded-lg text-xs font-semibold hover:bg-fbs-green/20 transition">
                              <Check className="w-3 h-3" /> Approve
                            </button>
                            <button onClick={() => openAction(r, 'reject')}
                              className="flex items-center gap-1 px-2.5 py-1 bg-red-900/20 border border-red-700/30 text-red-400 rounded-lg text-xs font-semibold hover:bg-red-900/30 transition">
                              <X className="w-3 h-3" /> Reject
                            </button>
                          </>
                        )}
                        {r.status !== 'PENDING' && r.adminRemarks && (
                          <span className="text-xs text-gray-600 italic truncate max-w-32" title={r.adminRemarks}>
                            {r.adminRemarks}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </ResponsiveTable>
          )}
        </div>
      </div>

      {/* Approve / Reject Modal */}
      {showModal && selectedRequest && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-fbs-darker border border-fbs-border rounded-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-fbs-border">
              <div>
                <h2 className="font-heading text-xl font-bold">
                  {actionType === 'approve' ? '✅ Approve Request' : '❌ Reject Request'}
                </h2>
                <p className="text-gray-400 text-xs mt-0.5">
                  {actionType === 'approve'
                    ? 'User account will be created and credentials emailed'
                    : 'Rejection reason will be emailed to applicant'}
                </p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-fbs-card rounded-lg transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-6">
              {/* Request summary */}
              <div className="bg-fbs-dark border border-fbs-border rounded-xl p-4 mb-4 space-y-2">
                <div className="flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-gray-500" />
                  <span className="text-sm text-white font-medium">{selectedRequest.fullName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-gray-500" />
                  <span className="text-sm text-gray-400">{selectedRequest.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Briefcase className="w-3.5 h-3.5 text-gray-500" />
                  <span className="text-sm text-gray-400">{selectedRequest.designation}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="w-3.5 h-3.5 text-gray-500" />
                  <span className="text-sm text-gray-400 mr-2">Requested Role:</span>
                  <RoleBadge role={selectedRequest.requestedRole} />
                </div>
                <div className="flex items-center gap-2">
                  <BadgeCheck className="w-3.5 h-3.5 text-gray-500" />
                  <span className="text-sm text-gray-400">Employee ID: {selectedRequest.employeeId}</span>
                </div>
              </div>

              {actionError && (
                <div className="bg-red-900/30 border border-red-700 text-red-400 text-sm rounded-lg px-4 py-3 mb-4">
                  {actionError}
                </div>
              )}

              <div className="mb-4">
                <label className="block text-fbs-green text-xs font-semibold uppercase tracking-widest mb-2">
                  {actionType === 'reject' ? 'Rejection Reason *' : 'Remarks (optional)'}
                </label>
                <textarea value={remarks} onChange={e => setRemarks(e.target.value)} rows={3}
                  placeholder={actionType === 'reject'
                    ? 'Please provide reason for rejection...'
                    : 'Any remarks for this approval...'}
                  className="w-full bg-fbs-dark border border-fbs-border rounded-lg px-4 py-2.5 text-white text-sm placeholder-gray-600 outline-none focus:border-fbs-green transition-colors resize-none"
                />
              </div>

              <div className="flex gap-3">
                <button onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 border border-fbs-border rounded-lg text-sm text-gray-400 hover:bg-fbs-card transition">
                  Cancel
                </button>
                <button onClick={handleAction} disabled={actionLoading}
                  className={`flex-1 py-2.5 font-semibold rounded-lg text-sm transition flex items-center justify-center gap-2 ${
                    actionType === 'approve'
                      ? 'bg-fbs-green hover:bg-fbs-yellow text-black'
                      : 'bg-red-700 hover:bg-red-600 text-white'
                  }`}>
                  {actionLoading
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : actionType === 'approve' ? 'Approve & Create Account' : 'Reject & Notify'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}