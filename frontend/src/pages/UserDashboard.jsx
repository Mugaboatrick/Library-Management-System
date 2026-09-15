import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import UserLayout from '../components/layout/UserLayout';
import StatCard from '../components/common/StatCard';
import { useAuth } from '../context/AuthContext';
import { authService, fineService, borrowService } from '../services';
import { toast } from 'react-toastify';

const borrowLimits = { STUDENT: 3, TEACHER: 10, GUEST: 1 };

const sectionTitles = [
  { label: 'Your Library', icon: '📚' },
  { label: 'Recent Activity', icon: '📋' }
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
      <div
        className="relative overflow-hidden"
        style={{
          backgroundImage: "linear-gradient(rgba(15,23,42,0.5), rgba(15,23,42,0.5)), url('/dashboard-bg.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed'
        }}
      >
        <div className="relative z-10">
          {/* ===== Dashboard Introduction ===== */}
          <section className="mb-10 px-4 py-12 text-center sm:py-16">
            <div className="mx-auto max-w-4xl">
              <p className="mb-4 text-sm font-bold uppercase tracking-[0.28em] text-white sm:text-base">
                Hope Haven School Library
              </p>
              <h1 className="text-4xl font-black leading-tight text-white sm:text-6xl">
                Your reading and learning dashboard
              </h1>
              <p className="mx-auto mt-6 max-w-3xl text-base leading-8 text-white sm:text-lg">
                {roleLabel} · {user?.customer_id} — manage your books, borrowings, digital reading, and fines from one place.
              </p>
              <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
                <Link
                  to="/books"
                  className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary-600 to-blue-500 text-white px-5 py-2.5 text-sm font-bold shadow-lg"
                >
                  📚 Borrow Books
                </Link>
                <Link
                  to="/my-qr"
                  className="inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
                >
                  🪪 My QR Card
                </Link>
                <Link
                  to="/reader"
                  className="inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
                >
                  📖 Read E-Books
                </Link>
              </div>
            </div>
          </section>

          {/* ===== Your Library ===== */}
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg">{sectionTitles[0].icon}</span>
            <h2 className="text-lg font-semibold text-gray-800">Your Library</h2>
            <span className="text-xs text-gray-400 ml-auto">Your membership at a glance</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            <StatCard glass label="Active Borrowings" value={`${activeCount} / ${limit}`} icon="📚" color="bg-gradient-to-br from-primary-600 to-blue-400" />
            <StatCard glass label="Unpaid Fines" value={`${fines?.totals?.unpaid || 0} RWF`} icon="💰" color="bg-gradient-to-br from-red-500 to-rose-400" />
            <StatCard glass label="Total Borrowed" value={myBorrowings.length || 0} icon="📋" color="bg-gradient-to-br from-cyan-500 to-sky-400" />
            <StatCard glass label="Borrow Limit" value={limit} icon="🔢" color="bg-gradient-to-br from-teal-500 to-emerald-400" />
          </div>

          {/* ===== Recent Activity ===== */}
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg">{sectionTitles[1].icon}</span>
            <h2 className="text-lg font-semibold text-gray-800">Recent Activity</h2>
            <span className="text-xs text-gray-400 ml-auto">Borrowings and fines</span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
            {/* Recent borrowings */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-bold text-gray-800 flex items-center gap-2">📋 Recent Borrowings</h2>
                <Link to="/cart" className="text-sm text-primary-600 hover:underline">View all →</Link>
              </div>
              {myBorrowings.length === 0 ? (
                <p className="text-gray-400 text-center py-6 text-sm">No borrowings yet</p>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {myBorrowings.slice(0, 5).map((b) => (
                    <li key={b.id} className="py-3 flex justify-between items-center card-hover rounded-lg px-2">
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
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-bold text-gray-800 flex items-center gap-2">💰 Your Fines</h2>
                <Link to="/my-fines" className="text-sm text-primary-600 hover:underline">Manage →</Link>
              </div>
              {fines?.data?.length === 0 ? (
                <p className="text-gray-400 text-center py-6 text-sm">You have no fines 🎉</p>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {(fines?.data || []).slice(0, 5).map((f) => (
                    <li key={f.id} className="py-3 flex justify-between items-center card-hover rounded-lg px-2">
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
        </div>
      </div>
    </UserLayout>
  );
};

export default UserDashboard;