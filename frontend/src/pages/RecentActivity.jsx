import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import UserLayout from '../components/layout/UserLayout';
import { useAuth } from '../context/AuthContext';
import { borrowService, fineService } from '../services';
import { toast } from 'react-toastify';

const statusMeta = {
  BORROWED: { label: 'BORROWED', cls: 'bg-green-100 text-green-700 border-green-200' },
  OVERDUE: { label: 'OVERDUE', cls: 'bg-red-100 text-red-700 border-red-200' },
  RETURNED: { label: 'RETURNED', cls: 'bg-blue-100 text-blue-700 border-blue-200' }
};

const RecentActivity = () => {
  const { user } = useAuth();
  const [borrowings, setBorrowings] = useState([]);
  const [fines, setFines] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const [borrowRes, fineRes] = await Promise.all([
        borrowService.mine(),
        fineService.mine()
      ]);
      setBorrowings(borrowRes.data.data || []);
      setFines(fineRes.data);
    } catch (err) {
      toast.error('Failed to load recent activity');
    } finally {
      setLoading(false);
    }
  };

  const activeCount = borrowings.filter((b) => ['BORROWED', 'OVERDUE'].includes(b.status)).length;
  const returnedCount = borrowings.filter((b) => b.status === 'RETURNED').length;
  const overdueCount = borrowings.filter((b) => b.status === 'OVERDUE' || b.current_overdue_days > 0).length;
  const unpaidTotal = fines?.totals?.unpaid || 0;

  const statCards = [
    { label: 'Active Borrowings', value: activeCount, icon: '', tile: 'bg-green-50 border-green-200', text: 'text-[#2d6f2d]' },
    { label: 'Returned', value: returnedCount, icon: '', tile: 'bg-blue-50 border-blue-200', text: 'text-blue-600' },
    { label: 'Overdue Alerts', value: overdueCount, icon: '⏰', tile: 'bg-red-50 border-red-200', text: 'text-red-600' },
    { label: 'Unpaid Fines', value: `${unpaidTotal} RWF`, icon: '', tile: 'bg-amber-50 border-amber-200', text: 'text-amber-600' }
  ];

  if (loading) {
    return (
      <UserLayout>
        <div className="text-center py-24">
          <div className="w-12 h-12 mx-auto rounded-full border-4 border-primary-200 border-t-primary-600 animate-spin"></div>
          <p className="text-gray-500 mt-4 text-sm">Loading recent activity...</p>
        </div>
      </UserLayout>
    );
  }

  return (
    <UserLayout>
      <div className="flex flex-wrap justify-between items-center mb-6 gap-3">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-[#2d6f2d]"> Recent Activity</h1>
          <p className="text-gray-500 text-base mt-1">Your recent borrowings and fines at a glance</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-gray-200 shadow-sm">
          <span className="text-lg">{user?.role === 'STUDENT' ? '🎓' : '👤'}</span>
          <span className="text-sm font-semibold text-gray-700">{user?.first_name} {user?.last_name}</span>
          <span className="text-xs text-gray-400 font-mono">{user?.customer_id}</span>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {statCards.map((c) => (
          <div key={c.label} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3 shadow-sm">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">{c.label}</p>
              <p className={`text-xl font-bold truncate ${c.text}`}>{c.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Borrowings */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-gray-800 flex items-center gap-2 text-lg"> Recent Borrowings</h2>
            </div>
            <span className="px-2.5 py-1 bg-green-50 text-green-700 ring-1 ring-green-200 rounded-full text-xs font-semibold">
              {borrowings.length} total
            </span>
          </div>
          {borrowings.length === 0 ? (
            <p className="text-gray-400 text-center py-12 text-sm">No borrowings yet</p>
          ) : (
            <ul className="divide-y divide-gray-100 max-h-[520px] overflow-y-auto">
              {borrowings.map((b) => {
                const meta = statusMeta[b.status] || { label: b.status, cls: 'bg-gray-100 text-gray-600 border-gray-200' };
                return (
                  <li key={b.id} className="py-3.5 px-5 flex items-center gap-4 hover:bg-gray-50 transition">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-base border ${
                      b.status === 'OVERDUE' ? 'bg-red-50 border-red-200' : b.status === 'RETURNED' ? 'bg-blue-50 border-blue-200' : 'bg-green-50 border-green-200'
                    }`}>
                      {b.status === 'RETURNED' ? '📥' : '📤'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm text-gray-800 truncate">
                        {b.copy_code} · Due {new Date(b.due_date).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5 truncate">{b.title || 'Book'}</p>
                    </div>
                    <span className={`shrink-0 px-2.5 py-1 rounded-full border text-xs font-bold ${meta.cls}`}>
                      {meta.label}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Your Fines */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-bold text-gray-800 flex items-center gap-2 text-lg"> Your Fines</h2>
            <Link to="/my-fines" className="text-sm text-[#2d6f2d] hover:underline font-semibold">Manage </Link>
          </div>
          {fines?.data?.length === 0 ? (
            <p className="text-gray-400 text-center py-12 text-sm">You have no fines </p>
          ) : (
            <>
              <ul className="divide-y divide-gray-100">
                {(fines?.data || []).map((f) => (
                  <li key={f.id} className="py-3.5 px-5 flex items-center gap-4 hover:bg-gray-50 transition">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border bg-red-50 border-red-200 text-xl">
                      
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm text-gray-800 truncate">{f.title || 'Fine'}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{f.days_overdue} overdue days</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-semibold text-red-600">{f.amount} RWF</p>
                      <span className="text-[11px] text-gray-400">{f.status}</span>
                    </div>
                  </li>
                ))}
              </ul>
              {unpaidTotal > 0 && (
                <div className="px-5 py-4 border-t border-gray-100">
                  <Link
                    to="/my-fines"
                    className="block w-full py-2.5 bg-gradient-to-r from-[#2d6f2d] to-[#3f9d3f] text-white rounded-xl text-sm text-center font-semibold hover:opacity-95 transition"
                  >
                    Pay All Fines ({unpaidTotal} RWF)
                  </Link>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </UserLayout>
  );
};

export default RecentActivity;