import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import axiosInstance from '../../api/axiosInstance';
import { useAuth } from '../../context/AuthContext';
import {
  GraduationCap, Layers, ClipboardList, Users,
  TrendingUp, Loader2, Cake, Send
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line
} from 'recharts';

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

export default function DashboardPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [birthdays, setBirthdays] = useState([]);
  const [wishSent, setWishSent] = useState({});
  const [wishLoading, setWishLoading] = useState({});

  useEffect(() => {
    if (isAdmin) {
      axiosInstance.get('/dashboard/stats')
        .then(r => setStats(r.data))
        .catch(() => setError('Failed to load dashboard stats'))
        .finally(() => setLoading(false));

      axiosInstance.get('/birthday/today')
        .then(r => setBirthdays(r.data))
        .catch(() => {});
    } else {
      setLoading(false);
    }
  }, [isAdmin]);

  async function sendWish(student) {
    setWishLoading(prev => ({ ...prev, [student.id]: true }));
    try {
      await axiosInstance.post(`/birthday/${student.id}/send-wish`);
      setWishSent(prev => ({ ...prev, [student.id]: true }));
    } catch {
      alert('Failed to send wish');
    } finally {
      setWishLoading(prev => ({ ...prev, [student.id]: false }));
    }
  }

  function getWhatsAppMessage(student) {
    return encodeURIComponent(
      `🎂 Happy Birthday ${student.fullName}! 🎉\n\n` +
      `On behalf of the entire FirstBit Solutions family, we wish you a wonderful birthday!\n\n` +
      `We are proud to have you as part of our ${student.batchName} batch. ` +
      `Keep learning, keep growing, and may this year bring you great success! 🌟\n\n` +
      `Warm wishes,\nFirstBit Solutions Team`
    );
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-fbs-darker border border-fbs-border rounded-lg px-3 py-2 text-xs">
          <p className="text-gray-400 mb-1">{label}</p>
          <p className="text-fbs-green font-semibold">{payload[0].value} students</p>
        </div>
      );
    }
    return null;
  };

  // ── Non-admin greeting ────────────────────────────────────────────────────
  if (!isAdmin) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="text-center">
            <div className="text-5xl mb-6">👋</div>
            <h1 className="font-heading text-3xl font-bold text-white mb-3">
              {getGreeting()}, {user?.fullName?.split(' ')[0]}!
            </h1>
            <p className="text-gray-400 text-lg">
              Welcome to FBS Student Management System
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ── Admin dashboard ───────────────────────────────────────────────────────
  const statCards = stats ? [
    { label: 'Total Students', value: stats.totalStudents, icon: GraduationCap, color: 'text-fbs-green', bg: 'bg-fbs-green/10', border: 'border-fbs-green/20' },
    { label: 'Total Batches', value: stats.totalBatches, icon: Layers, color: 'text-fbs-yellow', bg: 'bg-fbs-yellow/10', border: 'border-fbs-yellow/20' },
    { label: 'Pending Requests', value: stats.pendingRequests, icon: ClipboardList, color: 'text-orange-400', bg: 'bg-orange-400/10', border: 'border-orange-400/20' },
    { label: 'Active Users', value: stats.activeUsers, icon: Users, color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/20' },
    { label: 'New This Month', value: stats.newStudentsThisMonth, icon: TrendingUp, color: 'text-purple-400', bg: 'bg-purple-400/10', border: 'border-purple-400/20' },
  ] : [];

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-6">
          <h1 className="font-heading text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-400 text-sm mt-0.5">
            {getGreeting()}, {user?.fullName} — here's what's happening
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-7 h-7 animate-spin text-fbs-green" />
          </div>
        ) : error ? (
          <div className="bg-red-900/30 border border-red-700 text-red-400 text-sm rounded-lg px-4 py-3">
            {error}
          </div>
        ) : (
          <>
            {/* Birthday Widget */}
            {birthdays.length > 0 && (
              <div className="bg-gradient-to-r from-fbs-green/10 to-fbs-yellow/10 border border-fbs-green/30 rounded-2xl p-5 mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <Cake className="w-5 h-5 text-fbs-green" />
                  <h2 className="text-sm font-semibold text-white">
                    🎂 Today's Birthdays — {birthdays.length} student{birthdays.length > 1 ? 's' : ''}
                  </h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {birthdays.map(student => (
                    <div key={student.id}
                      className="bg-fbs-darker border border-fbs-border rounded-xl p-4 flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-fbs-card border-2 border-fbs-green/30 flex items-center justify-center flex-shrink-0">
                        {student.photoUrl ? (
                          <img src={student.photoUrl} alt={student.fullName} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-fbs-green font-bold text-sm">
                            {student.fullName?.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-semibold truncate">{student.fullName}</p>
                        <p className="text-xs text-gray-500 truncate">{student.batchName}</p>
                        {student.age > 0 && (
                          <p className="text-xs text-fbs-green mt-0.5">Turning {student.age} today 🎉</p>
                        )}
                      </div>
                      <div className="flex flex-col gap-1.5 flex-shrink-0">
                        {student.phone && (
                          <a href={`https://wa.me/91${student.phone}?text=${getWhatsAppMessage(student)}`}
                            target="_blank" rel="noreferrer"
                            className="flex items-center gap-1 px-2 py-1 bg-green-900/20 border border-green-700/30 text-green-400 rounded-lg text-xs hover:bg-green-900/30 transition">
                            <Send className="w-3 h-3" /> WA
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
              {statCards.map(({ label, value, icon: Icon, color, bg, border }) => (
                <div key={label} className={`bg-fbs-darker border ${border} rounded-2xl p-5 flex flex-col gap-3`}>
                  <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${color}`} />
                  </div>
                  <div>
                    <div className={`text-2xl font-bold ${color}`}>{value}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{label}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-fbs-darker border border-fbs-border rounded-2xl p-5">
                <div className="mb-4">
                  <h2 className="text-sm font-semibold text-white">Students per Batch</h2>
                  <p className="text-xs text-gray-500 mt-0.5">Active students grouped by batch</p>
                </div>
                {stats.studentsPerBatch?.length === 0 ? (
                  <div className="flex items-center justify-center h-48 text-gray-600 text-sm">No data yet</div>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={stats.studentsPerBatch} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#565656" vertical={false} />
                      <XAxis dataKey="batchName" tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip content={<CustomTooltip />} cursor={{ fill: '#444444' }} />
                      <Bar dataKey="count" fill="#8DC63F" radius={[6, 6, 0, 0]} maxBarSize={50} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>

              <div className="bg-fbs-darker border border-fbs-border rounded-2xl p-5">
                <div className="mb-4">
                  <h2 className="text-sm font-semibold text-white">Student Growth</h2>
                  <p className="text-xs text-gray-500 mt-0.5">New students added in last 6 months</p>
                </div>
                {stats.studentGrowth?.every(d => d.count === 0) ? (
                  <div className="flex items-center justify-center h-48 text-gray-600 text-sm">No data yet</div>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={stats.studentGrowth} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#565656" vertical={false} />
                      <XAxis dataKey="month" tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Line type="monotone" dataKey="count" stroke="#8DC63F" strokeWidth={2.5}
                        dot={{ fill: '#8DC63F', strokeWidth: 0, r: 4 }}
                        activeDot={{ r: 6, fill: '#C8D400' }} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}