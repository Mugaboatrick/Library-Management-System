import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../../components/layout/AdminLayout';
import StatCard from '../../components/common/StatCard';
import { reportService } from '../../services';
import { toast } from 'react-toastify';

const quickActions = [
  { label: 'Borrow a Book', href: '/admin/borrow', icon: '📥', color: 'from-blue-500 to-cyan-400' },
  { label: 'Add Book', href: '/admin/books', icon: '📚', color: 'from-emerald-500 to-teal-400' },
  { label: 'QR Cards', href: '/admin/qr-cards', icon: '📱', color: 'from-purple-500 to-indigo-400' },
  { label: 'Reports', href: '/admin/reports', icon: '📊', color: 'from-amber-500 to-orange-400' },
  { label: 'Settings', href: '/settings', icon: '⚙️', color: 'from-slate-600 to-slate-400' }
];

const sectionTitles = [
  { label: 'Users', icon: '👥' },
  { label: 'Books', icon: '📚' },
  { label: 'Fines', icon: '💰' }
];

const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const res = await reportService.dashboard();
      setData(res.data.data);
    } catch (err) {
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="text-center py-24">
          <div className="w-12 h-12 mx-auto rounded-full border-4 border-primary-200 border-t-primary-600 animate-spin"></div>
          <p className="text-gray-500 mt-4 text-sm">Loading dashboard...</p>
        </div>
      </AdminLayout>
    );
  }

  const u = data?.users || {};
  const b = data?.books || {};
  const f = data?.fines || {};
  const c = data?.circulation || {};

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const today = new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <AdminLayout>
      {/* ===== Hero header ===== */}
      <div className="relative overflow-hidden rounded-3xl animate-gradient bg-gradient-to-br from-primary-800 via-primary-700 to-blue-600 text-white p-6 sm:p-10 mb-8">
        <div className="absolute inset-0">
          <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-cyan-300/25 animate-blob"></div>
          <div className="absolute bottom-0 left-1/3 w-56 h-56 rounded-full bg-indigo-400/25 animate-blob-slow"></div>
          <div className="absolute top-8 left-10 text-5xl opacity-20 animate-float select-none">📚</div>
          <div className="absolute bottom-6 right-1/4 text-4xl opacity-20 animate-float select-none" style={{ animationDelay: '-2s' }}>📖</div>
        </div>
        <div className="relative">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div>
              <span className="inline-flex items-center gap-2 glass-card-dark rounded-full px-3 py-1 text-xs font-medium text-blue-100 animate-fade-down">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse-soft"></span>
                {today}
              </span>
              <h1 className="text-3xl sm:text-4xl font-extrabold mt-3 animate-fade-up">
                {greeting}, Librarian <span role="img" aria-label="wave">👋</span>
              </h1>
              <p className="text-blue-100/90 mt-1 text-sm sm:text-base animate-fade-up" style={{ animationDelay: '100ms' }}>
                Here is what is happening at Hope Haven School Library today.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ===== Quick actions ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10 stagger-children">
        {quickActions.map((a) => (
          <Link
            key={a.href + a.label}
            to={a.href}
            className={`card-hover flex items-center gap-4 rounded-2xl p-4 bg-gradient-to-r ${a.color} text-white shadow-md`}
          >
            <span className="text-3xl">{a.icon}</span>
            <span className="font-semibold">{a.label}</span>
            <span className="ml-auto text-white/70">→</span>
          </Link>
        ))}
      </div>

      {/* ===== Users ===== */}
      <div className="flex items-center gap-2 mb-4 animate-fade-right">
        <span className="text-lg">{sectionTitles[0].icon}</span>
        <h2 className="text-lg font-semibold text-gray-800">Users</h2>
        <span className="text-xs text-gray-400 ml-auto">Registered members</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10 stagger-children">
        <StatCard glass label="Total Students" value={u.students || 0} icon="🎓" color="bg-gradient-to-br from-blue-500 to-cyan-400" animate />
        <StatCard glass label="Total Teachers" value={u.teachers || 0} icon="👩‍🏫" color="bg-gradient-to-br from-purple-500 to-indigo-400" animate />
        <StatCard glass label="Total Guests" value={u.guests || 0} icon="🪪" color="bg-gradient-to-br from-teal-500 to-emerald-400" animate />
        <StatCard glass label="Total Users" value={Number(u.students || 0) + Number(u.teachers || 0) + Number(u.guests || 0)} icon="👥" color="bg-gradient-to-br from-gray-600 to-slate-500" animate />
      </div>

      {/* ===== Books ===== */}
      <div className="flex items-center gap-2 mb-4 animate-fade-right" style={{ animationDelay: '80ms' }}>
        <span className="text-lg">{sectionTitles[1].icon}</span>
        <h2 className="text-lg font-semibold text-gray-800">Books</h2>
        <span className="text-xs text-gray-400 ml-auto">Titles and copy availability</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10 stagger-children">
        <StatCard glass label="Total Books (titles)" value={b.total_books || 0} icon="📚" color="bg-gradient-to-br from-primary-600 to-blue-400" animate />
        <StatCard glass label="Available Copies" value={b.available || 0} icon="✅" color="bg-gradient-to-br from-green-500 to-emerald-400" animate />
        <StatCard glass label="Borrowed Copies" value={b.borrowed || 0} icon="📤" color="bg-gradient-to-br from-amber-500 to-yellow-400" animate />
        <StatCard glass label="Retired Copies" value={b.retired || 0} icon="🗑️" color="bg-gradient-to-br from-red-500 to-rose-400" animate />
      </div>

      {/* ===== Fines ===== */}
      <div className="flex items-center gap-2 mb-4 animate-fade-right" style={{ animationDelay: '160ms' }}>
        <span className="text-lg">{sectionTitles[2].icon}</span>
        <h2 className="text-lg font-semibold text-gray-800">Fines</h2>
        <span className="text-xs text-gray-400 ml-auto">Amounts in RWF</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10 stagger-children">
        <StatCard glass label="Total Fines" value={`${f.total || 0} RWF`} icon="💰" color="bg-gradient-to-br from-indigo-500 to-blue-400" animate />
        <StatCard glass label="Settled Fines" value={`${f.settled || 0} RWF`} icon="✅" color="bg-gradient-to-br from-green-500 to-emerald-400" animate />
        <StatCard glass label="Unpaid Fines" value={`${f.unpaid || 0} RWF`} icon="⚠️" color="bg-gradient-to-br from-red-500 to-orange-400" animate />
        <StatCard glass label="Active Loans" value={`${c.active_loans || 0} (${c.overdue || 0} overdue)`} icon="📋" color="bg-gradient-to-br from-cyan-500 to-sky-400" animate />
      </div>

      {/* ===== E-books ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard glass label="Active E-Books" value={data?.ebooks || 0} icon="📖" color="bg-gradient-to-br from-fuchsia-500 to-pink-400" animate />
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;