import React, { useEffect, useState, useCallback, useMemo } from 'react';
import AdminLayout from '../components/layout/AdminLayout';
import UserLayout from '../components/layout/UserLayout';
import { notificationService } from '../services';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const typeMeta = {
  OVERDUE:           { icon: '⏰', label: 'Overdue',          cls: 'bg-red-50 text-red-700 border-red-200' },
  BORROW_CONFIRMED:  { icon: '', label: 'Borrow Confirmed', cls: 'bg-green-50 text-green-700 border-green-200' },
  BORROW_APPROVED:   { icon: '', label: 'Approved',         cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  BORROW_REJECTED:   { icon: '', label: 'Declined',         cls: 'bg-red-50 text-red-600 border-red-200' },
  BOOK_RETURNED:     { icon: '', label: 'Returned',         cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  NEW_MESSAGE:       { icon: '', label: 'Message',          cls: 'bg-purple-50 text-purple-700 border-purple-200' }
};

const timeAgo = (d) => {
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

const Notifications = () => {
  const { user } = useAuth();
  const isLibrarian = user?.role === 'LIBRARIAN';

  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await notificationService.mine({ limit: 500 });
      setNotifs(res.data.data || []);
    } catch (err) {
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const unreadCount = notifs.filter((n) => !n.is_read).length;
  const readCount = notifs.length - unreadCount;
  const overdueCount = notifs.filter((n) => n.type === 'OVERDUE').length;

  const filtered = useMemo(() => {
    let list = notifs;
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((n) =>
        [n.title, n.message, n.type, typeMeta[n.type]?.label]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(q))
      );
    }
    if (statusFilter === 'unread') list = list.filter((n) => !n.is_read);
    else if (statusFilter === 'read') list = list.filter((n) => n.is_read);
    if (typeFilter) list = list.filter((n) => n.type === typeFilter);
    return list;
  }, [notifs, search, statusFilter, typeFilter]);

  const statCards = [
    { label: 'Total Notifications', value: notifs.length, icon: '', tile: 'bg-green-50 border-green-200', text: 'text-[#2d6f2d]' },
    { label: 'Unread', value: unreadCount, icon: '', tile: 'bg-amber-50 border-amber-200', text: 'text-amber-600' },
    { label: 'Marked Read', value: readCount, icon: '', tile: 'bg-blue-50 border-blue-200', text: 'text-blue-600' },
    { label: 'Overdue Alerts', value: overdueCount, icon: '⏰', tile: 'bg-red-50 border-red-200', text: 'text-red-600' }
  ];

  const handleMarkRead = async (n) => {
    if (n.is_read) return;
    await notificationService.markRead(n.id).catch(() => {});
    setNotifs((prev) => prev.map((x) => (x.id === n.id ? { ...x, is_read: 1 } : x)));
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllRead();
      setNotifs((prev) => prev.map((x) => ({ ...x, is_read: 1 })));
      toast.success('All notifications marked as read');
    } catch (err) {
      toast.error('Failed to mark as read');
    }
  };

  const Layout = isLibrarian ? AdminLayout : UserLayout;

  return (
    <Layout>
      <div className="flex flex-wrap justify-between items-center mb-6 gap-3">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-[#2d6f2d]">Notifications</h1>
          <p className="text-gray-500 text-base mt-1">Every update about your loans, returns, fines and messages</p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="px-5 py-2.5 bg-[#2d6f2d] text-white rounded-lg hover:bg-green-700 shadow font-semibold transition"
          >
             Mark all as read
          </button>
        )}
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {statCards.map((c) => (
          <div key={c.label} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3 shadow-sm">
            <div>
              <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">{c.label}</p>
              <p className={`text-2xl font-bold ${c.text}`}>{c.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="relative px-5 py-4 bg-gradient-to-r from-green-50 to-emerald-50/60 border-b border-green-100">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-gray-800">All Notifications</h2>
              <p className="text-xs text-gray-500">
                {search ? `Results for "${search}"` : 'Search, filter and review everything that reached your account'}
              </p>
            </div>
            <span className="px-2.5 py-1 bg-white ring-1 ring-green-200 text-[#2d6f2d] rounded-full text-xs font-semibold">{filtered.length} notif{filtered.length === 1 ? '' : 's'}</span>
          </div>
        </div>

        {/* Research space */}
        <div className="flex flex-col lg:flex-row gap-2 px-4 py-3 bg-gray-50/60 border-b border-gray-100">
          <div className="relative flex-1">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder=" Search any notification by title, message or type..."
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
          >
            <option value="">All Status</option>
            <option value="unread">Unread</option>
            <option value="read">Read</option>
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
          >
            <option value="">All Types</option>
            <option value="BORROW_CONFIRMED">Borrow Confirmed</option>
            <option value="BORROW_APPROVED">Request Approved</option>
            <option value="BORROW_REJECTED">Request Declined</option>
            <option value="BOOK_RETURNED">Book Returned</option>
            <option value="OVERDUE">Overdue</option>
            <option value="NEW_MESSAGE">New Message</option>
          </select>
        </div>

        {/* List */}
        {loading ? (
          <div className="px-4 py-12 text-center text-sm text-gray-400">Loading notifications…</div>
        ) : filtered.length === 0 ? (
          <div className="px-4 py-12 text-center text-sm text-gray-400">No notifications match your search.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filtered.map((n) => {
              const meta = typeMeta[n.type] || { icon: '', label: n.type || 'Notice', cls: 'bg-gray-50 text-gray-600 border-gray-200' };
              const unread = !n.is_read;
              return (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => handleMarkRead(n)}
                  className={`w-full text-left px-4 py-4 flex items-start gap-3 transition ${
                    unread ? 'bg-green-50/50 hover:bg-green-50/80' : 'hover:bg-gray-50/60'
                  }`}
                >
                  <span className="flex-1 min-w-0">
                    <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      {unread && <span className="h-2 w-2 rounded-full bg-[#2d6f2d]"></span>}
                      <span className={`text-sm font-semibold ${unread ? 'text-gray-900' : 'text-gray-600'}`}>{n.title}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold border shrink-0">{meta.label}</span>
                    </span>
                    <span className="block text-sm text-gray-500 mt-1 leading-relaxed break-words">{n.message}</span>
                    <span className="block text-[11px] text-gray-400 mt-1.5">{timeAgo(n.created_at)}</span>
                  </span>
                  {unread && (
                    <span className="shrink-0 text-[11px] font-semibold text-[#2d6f2d] border border-green-200 bg-white rounded-full px-2 py-1">Mark read</span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Notifications;