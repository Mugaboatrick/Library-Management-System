import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import UserLayout from '../components/layout/UserLayout';
import UserAvatar from '../components/common/UserAvatar';
import StatCard from '../components/common/StatCard';
import { useAuth } from '../context/AuthContext';
import { authService, fineService, borrowService } from '../services';
import { toast } from 'react-toastify';

const borrowLimits = { STUDENT: 3, TEACHER: 10, GUEST: 1 };

const quickActions = [
  { label: 'Borrow Books', desc: 'Browse the catalog & borrow available books', href: '/books', icon: '📚', color: 'from-emerald-500 to-teal-400' },
  { label: 'My QR Card', desc: 'View your library access card', href: '/my-qr', icon: '🪪', color: 'from-primary-600 to-blue-400' },
  { label: 'Read E-Books', desc: 'Access digital resources', href: '/reader', icon: '📖', color: 'from-fuchsia-500 to-pink-400' }
];

const UserDashboard = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [fines, setFines] = useState(null);
  const [myBorrowings, setMyBorrowings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const [meRes, fineRes, borrowRes] = await Promise.all([
        authService.getMe(),
        fineService.mine(),
        borrowService.mine()
      ]);
      setProfile(meRes.data);
      setFines(fineRes.data);
      setMyBorrowings(borrowRes.data.data);
    } catch (err) {
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const roleLabel = user?.role?.charAt(0) + user?.role?.slice(1).toLowerCase();
  const limit = borrowLimits[user?.role] || 1;
  const activeCount = profile?.activeBorrowings || 0;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const today = new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  if (loading) {
    return (
      <UserLayout>
        <div className="text-center py-24">
          <div className="w-12 h-12 mx-auto rounded-full border-4 border-primary-200 border-t-primary-600 animate-spin"></div>
          <p className="text-gray-500 mt-4 text-sm">Loading dashboard...</p>
        </div>
      </UserLayout>
    );
  }

  return (
    <UserLayout>
      {/* ===== Hero header ===== */}
      <div className="relative overflow-hidden rounded-3xl animate-gradient bg-gradient-to-br from-primary-800 via-primary-700 to-blue-600 text-white p-6 sm:p-10 mb-8">
        <div className="absolute inset-0">
          <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-cyan-300/25 animate-blob"></div>
          <div className="absolute bottom-0 left-1/3 w-56 h-56 rounded-full bg-indigo-400/25 animate-blob-slow"></div>
          <div className="absolute top-8 left-10 text-5xl opacity-20 animate-float select-none">📚</div>
          <div className="absolute bottom-6 right-1/4 text-4xl opacity-20 animate-float select-none" style={{ animationDelay: '-2s' }}>📖</div>
        </div>
        <div className="relative flex flex-wrap items-center gap-6">
          <span className="rounded-full shadow-xl animate-bounce-soft">
            <UserAvatar user={user || profile?.user} size="lg" className="ring-4 ring-white/30" />
          </span>
          <div className="min-w-0">
            <span className="inline-flex items-center gap-2 glass-card-dark rounded-full px-3 py-1 text-xs font-medium text-blue-100 animate-fade-down">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse-soft"></span>
              {today}
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold mt-2 animate-fade-up">
              {greeting}, {user?.first_name}! <span role="img" aria-label="wave">👋</span>
            </h1>
            <p className="text-blue-100/90 text-sm mt-1 animate-fade-up" style={{ animationDelay: '100ms' }}>
              {roleLabel} · {user?.customer_id}
            </p>
          </div>
        </div>
      </div>

      {/* ===== Quick actions ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10 stagger-children">
        {quickActions.map((a) => (
          <Link
            key={a.href}
            to={a.href}
            className={`card-hover relative overflow-hidden rounded-2xl p-5 bg-gradient-to-r ${a.color} text-white shadow-md group`}
          >
            <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full bg-white/15 group-hover:scale-150 transition-transform duration-500"></div>
            <div className="relative flex items-center gap-4">
              <span className="text-4xl group-hover:scale-110 group-hover:-rotate-6 transition-transform duration-300 inline-block animate-float">{a.icon}</span>
              <div>
                <div className="font-bold text-lg leading-tight">{a.label}</div>
                <div className="text-xs text-white/80 mt-0.5">{a.desc}</div>
              </div>
              <span className="ml-auto text-white/70 text-xl group-hover:translate-x-1 transition-transform">→</span>
            </div>
          </Link>
        ))}
      </div>

      {/* ===== Stats ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10 stagger-children">
        <StatCard glass label="Active Borrowings" value={`${activeCount} / ${limit}`} icon="📚" color="bg-gradient-to-br from-primary-600 to-blue-400" animate />
        <StatCard glass label="Unpaid Fines" value={`${fines?.totals?.unpaid || 0} RWF`} icon="💰" color="bg-gradient-to-br from-red-500 to-rose-400" animate />
        <StatCard glass label="Total Borrowed" value={myBorrowings.length || 0} icon="📋" color="bg-gradient-to-br from-blue-500 to-cyan-400" animate />
        <StatCard glass label="Borrow Limit" value={limit} icon="🔢" color="bg-gradient-to-br from-teal-500 to-emerald-400" animate />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10 stagger-children">
        {/* Recent borrowings */}
        <div className="glass-card rounded-2xl border border-white/60 p-6 shadow-sm">
          <div className="flex justify-between items-center mb-4 animate-fade-right">
            <h2 className="font-bold text-gray-800 flex items-center gap-2">📋 Recent Borrowings</h2>
            <Link to="/cart" className="text-sm text-primary-600 hover:underline">View all →</Link>
          </div>
          {myBorrowings.length === 0 ? (
            <p className="text-gray-400 text-center py-6 text-sm">No borrowings yet</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {myBorrowings.slice(0, 5).map((b, i) => (
                <li key={b.id} className="py-3 flex justify-between items-center card-hover rounded-lg px-2" style={{ animationDelay: `${i * 60}ms` }}>
                  <div>
                    <p className="font-medium text-sm">{b.title}</p>
                    <p className="text-xs text-gray-400">{b.copy_code} · Due {new Date(b.due_date).toLocaleDateString()}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    b.status === 'RETURNED' ? 'bg-green-100 text-green-700' :
                    b.status === 'OVERDUE' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                  }`}>{b.status}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Unpaid fines */}
        <div className="glass-card rounded-2xl border border-white/60 p-6 shadow-sm">
          <div className="flex justify-between items-center mb-4 animate-fade-right">
            <h2 className="font-bold text-gray-800 flex items-center gap-2">💰 Your Fines</h2>
            <Link to="/my-fines" className="text-sm text-primary-600 hover:underline">Manage →</Link>
          </div>
          {fines?.data?.length === 0 ? (
            <p className="text-gray-400 text-center py-6 text-sm">You have no fines 🎉</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {(fines?.data || []).slice(0, 5).map((f, i) => (
                <li key={f.id} className="py-3 flex justify-between items-center card-hover rounded-lg px-2" style={{ animationDelay: `${i * 60}ms` }}>
                  <div>
                    <p className="font-medium text-sm">{f.title || 'Fine'}</p>
                    <p className="text-xs text-gray-400">{f.days_overdue} overdue days</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-red-600">{f.amount} RWF</p>
                    <span className="text-xs text-gray-400">{f.status}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
          {(fines?.totals?.unpaid || 0) > 0 && (
            <Link to="/my-fines" className="btn-hero mt-4 block w-full py-2.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl text-sm text-center font-semibold">
              Pay All Fines ({fines.totals.unpaid} RWF)
            </Link>
          )}
        </div>
      </div>
    </UserLayout>
  );
};

export default UserDashboard;