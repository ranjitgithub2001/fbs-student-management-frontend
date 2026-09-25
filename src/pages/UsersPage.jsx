import { useState, useEffect } from 'react';
import DashboardLayout from "../components/DashboardLayout";
import axiosInstance from '../api/axiosInstance';
import { Users, Shield, Eye, Loader2, X, Search, ToggleLeft, ToggleRight } from 'lucide-react';
import ResponsiveTable from '../components/ResponsiveTable';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [actionLoading, setActionLoading] = useState(null); // user id being toggled

  useEffect(() => { fetchUsers(); }, []);

  async function fetchUsers() {
    setLoading(true); setError('');
    try {
      const res = await axiosInstance.get('/admin/users');
      setUsers(res.data);
    } catch { setError('Failed to load users'); }
    finally { setLoading(false); }
  }

  async function toggleStatus(user) {
    if (!confirm(`${user.isActive ? 'Deactivate' : 'Activate'} user "${user.fullName}"?`)) return;
    setActionLoading(user.id);
    try {
      await axiosInstance.put(`/admin/users/${user.id}/toggle-status`);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update user status');
    } finally { setActionLoading(null); }
  }

  const filtered = users.filter(u => {
    const matchSearch = !search ||
      u.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase());
    const matchRole = filterRole === 'ALL' || u.role === filterRole;
    const matchStatus = filterStatus === 'ALL' ||
      (filterStatus === 'ACTIVE' && u.isActive) ||
      (filterStatus === 'INACTIVE' && !u.isActive);
    return matchSearch && matchRole && matchStatus;
  });

  const roleBadge = (role) => {
    const styles = {
      ADMIN: 'bg-purple-900/30 border-purple-700/50 text-purple-400',
      VIEWER: 'bg-blue-900/30 border-blue-700/50 text-blue-400',
    };
    const icons = { ADMIN: <Shield className="w-3 h-3" />, VIEWER: <Eye className="w-3 h-3" /> };
    return (
      <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full border ${styles[role]}`}>
        {icons[role]} {role}
      </span>
    );
  };

  const counts = {
    total: users.length,
    admin: users.filter(u => u.role === 'ADMIN').length,
    viewer: users.filter(u => u.role === 'VIEWER').length,
    active: users.filter(u => u.isActive).length,
  };

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="mb-6">
          <h1 className="font-heading text-2xl font-bold text-white">Users</h1>
          <p className="text-gray-400 text-sm mt-0.5">Manage system users and their access</p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
          {[
            { label: 'Total Users', value: counts.total, color: 'text-white' },
            { label: 'Admins', value: counts.admin, color: 'text-purple-400' },
            { label: 'Viewers', value: counts.viewer, color: 'text-blue-400' },
            { label: 'Active', value: counts.active, color: 'text-fbs-green' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-fbs-darker border border-fbs-border rounded-2xl p-4 text-center">
              <div className={`text-2xl font-bold ${color}`}>{value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{label}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-fbs-darker border border-fbs-border rounded-2xl p-4 mb-4">
          <div className="flex gap-3 flex-wrap items-center">
            {/* Search */}
            <div className="relative flex-1 min-w-0 w-full sm:min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input type="text" value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by name or email..."
                className="w-full bg-fbs-dark border border-fbs-border rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-fbs-green transition"
              />
            </div>

            {/* Role filter */}
            <div className="flex flex-wrap gap-1 bg-fbs-dark border border-fbs-border rounded-lg p-1">
              {['ALL', 'ADMIN', 'VIEWER'].map(r => (
                <button key={r} onClick={() => setFilterRole(r)}
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition ${
                    filterRole === r ? 'bg-fbs-card text-fbs-green' : 'text-gray-500 hover:text-gray-300'
                  }`}>
                  {r}
                </button>
              ))}
            </div>

            {/* Status filter */}
            <div className="flex flex-wrap gap-1 bg-fbs-dark border border-fbs-border rounded-lg p-1">
              {['ALL', 'ACTIVE', 'INACTIVE'].map(s => (
                <button key={s} onClick={() => setFilterStatus(s)}
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition ${
                    filterStatus === s ? 'bg-fbs-card text-fbs-green' : 'text-gray-500 hover:text-gray-300'
                  }`}>
                  {s}
                </button>
              ))}
            </div>

            {/* Clear */}
            {(search || filterRole !== 'ALL' || filterStatus !== 'ALL') && (
              <button onClick={() => { setSearch(''); setFilterRole('ALL'); setFilterStatus('ALL'); }}
                className="flex items-center gap-1 px-3 py-2 bg-fbs-card border border-fbs-border rounded-lg text-xs text-gray-400 hover:bg-fbs-border transition">
                <X className="w-3 h-3" /> Clear
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-900/30 border border-red-700 text-red-400 text-sm rounded-lg px-4 py-3 mb-4">
            {error}
          </div>
        )}

        {/* Table */}
        <div className="bg-fbs-darker border border-fbs-border rounded-2xl overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-fbs-green" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <Users className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">No users found</p>
            </div>
          ) : (
            <ResponsiveTable>
            <table className="w-full">
              <thead>
                <tr className="border-b border-fbs-border">
                  <th className="text-left text-xs text-gray-500 uppercase tracking-widest px-5 py-3">User</th>
                  <th className="text-left text-xs text-gray-500 uppercase tracking-widest px-5 py-3">Email</th>
                  <th className="text-left text-xs text-gray-500 uppercase tracking-widest px-5 py-3">Role</th>
                  <th className="text-left text-xs text-gray-500 uppercase tracking-widest px-5 py-3">Designation</th>
                  <th className="text-left text-xs text-gray-500 uppercase tracking-widest px-5 py-3">Status</th>
                  <th className="text-left text-xs text-gray-500 uppercase tracking-widest px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u, i) => (
                  <tr key={u.id}
                    className={`border-b border-fbs-border/50 hover:bg-fbs-card/30 transition ${i % 2 === 0 ? '' : 'bg-fbs-dark/20'}`}>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-fbs-card border border-fbs-border flex items-center justify-center flex-shrink-0">
                          <span className="text-fbs-green text-xs font-semibold">
                            {u.fullName?.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                          </span>
                        </div>
                        <span className="text-sm text-white font-medium">{u.fullName}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-400">{u.email}</td>
                    <td className="px-5 py-3">{roleBadge(u.role)}</td>
                    <td className="px-5 py-3 text-sm text-gray-400">{u.designation || '—'}</td>
                    <td className="px-5 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full border ${
                        u.isActive
                          ? 'bg-fbs-green/10 border-fbs-green/30 text-fbs-green'
                          : 'bg-red-900/20 border-red-700/30 text-red-400'
                      }`}>
                        {u.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      {/* Can't deactivate ADMIN */}
                      {u.role !== 'ADMIN' && (
                        <button
                          onClick={() => toggleStatus(u)}
                          disabled={actionLoading === u.id}
                          title={u.isActive ? 'Deactivate user' : 'Activate user'}
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition ${
                            u.isActive
                              ? 'bg-red-900/20 border-red-700/30 text-red-400 hover:bg-red-900/30'
                              : 'bg-fbs-green/10 border-fbs-green/30 text-fbs-green hover:bg-fbs-green/20'
                          }`}>
                          {actionLoading === u.id
                            ? <Loader2 className="w-3 h-3 animate-spin" />
                            : u.isActive
                              ? <><ToggleRight className="w-3.5 h-3.5" /> Deactivate</>
                              : <><ToggleLeft className="w-3.5 h-3.5" /> Activate</>
                          }
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </ResponsiveTable>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}