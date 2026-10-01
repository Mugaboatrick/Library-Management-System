import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { connectSocket } from '../../services/socket';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import { borrowService, notificationService } from '../../services';
import Sidebar from './Sidebar';
import BackButton from '../common/BackButton';

const AdminLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [notifs, setNotifs] = useState([]);
  const [unread, setUnread] = useState(0);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [processingId, setProcessingId] = useState(null);
  const bellRef = useRef(null);

  const timeAgo = (dateStr) => {
    const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return new Date(dateStr).toLocaleDateString();
  };

  const loadNotifs = useCallback(async () => {
    if (!user) return;
    try {
      const res = await notificationService.mine();
      setNotifs(res.data.data || []);
      setUnread(res.data.unread || 0);
    } catch (err) {
      // ignore — notification load failures should not disrupt the app
    }
  }, [user]);

  const loadPendingRequests = useCallback(async () => {
    if (!user) return;
    try {
      const res = await borrowService.list({ status: 'REQUESTED', limit: 25 });
      setPendingRequests(res.data?.data || []);
    } catch (err) {
      // ignore request load failures so the UI keeps working
    }
  }, [user]);

  useEffect(() => {
    loadPendingRequests();
    loadNotifs();
  }, [loadNotifs, loadPendingRequests]);

  // The bell used to refresh only on mount and on a socket event, so a request
  // made while the tab was backgrounded (the browser suspends timers and the
  // event is missed) stayed invisible until a manual reload. Poll as well.
  useEffect(() => {
    if (!user) return;
    const id = setInterval(() => {
      // Skip polling while the tab is hidden; refresh immediately when it
      // becomes visible again instead.
      if (typeof document !== 'undefined' && document.hidden) return;
      loadPendingRequests();
      loadNotifs();
    }, 20000);
    const onVisible = () => {
      if (!document.hidden) {
        loadPendingRequests();
        loadNotifs();
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [user, loadPendingRequests, loadNotifs]);

  useEffect(() => {
    if (!user) return;

    // connectSocket is idempotent: reuses the existing socket if present
    const socket = connectSocket(user.role, user.id);

    socket.off('book_borrowed');
    socket.off('book_returned');
    socket.off('book_requested');
    socket.off('borrow_approved');
    socket.off('borrow_rejected');
    socket.off('new_message');

    socket.on('book_borrowed', (data) => {
      const msg = ` ${data.customer} borrowed ${data.copy}`;
      setNotifications(prev => [{ id: Date.now(), text: msg, type: 'borrowed' }, ...prev].slice(0, 10));
      toast.info(`Borrow: ${data.customer}  ${data.copy}`);
      setUnread(u => u + 1);
    });

    socket.on('book_requested', (data) => {
      const msg = `⏳ ${data.user_name} requested ${data.copy} (${data.title})`;
      setNotifications(prev => [{ id: Date.now(), text: msg, type: 'requested' }, ...prev].slice(0, 10));
      toast.info(`Request: ${data.user_name}  ${data.title}`);
      loadPendingRequests();
      loadNotifs();
    });

    socket.on('book_returned', (data) => {
      const fineText = data.fine > 0 ? ` +${data.fine} RWF fine` : '';
      const condText = data.condition && data.condition !== 'GOOD' ? ` (${data.condition})` : '';
      const msg = ` ${data.copy} returned${condText}${fineText}`;
      setNotifications(prev => [{ id: Date.now(), text: msg, type: 'returned' }, ...prev].slice(0, 10));
      toast.info(`Return: ${data.copy}${fineText}`);
      setUnread(u => u + 1);
    });

    socket.on('borrow_approved', (data) => {
      const msg = ` Approved: ${data.customer}  ${data.copy}`;
      setNotifications(prev => [{ id: Date.now(), text: msg, type: 'approved' }, ...prev].slice(0, 10));
      toast.success(`Approved: ${data.copy} issued to ${data.customer}`);
      loadPendingRequests();
      loadNotifs();
    });

    socket.on('borrow_rejected', (data) => {
      const msg = ` Rejected: ${data.customer}  ${data.copy}`;
      setNotifications(prev => [{ id: Date.now(), text: msg, type: 'rejected' }, ...prev].slice(0, 10));
      toast.warning(`Rejected: ${data.copy} not issued to ${data.customer}`);
      loadPendingRequests();
      loadNotifs();
    });

    socket.on('new_message', (data) => {
      toast.info(` New message from ${data.from}: "${(data.body || data.subject || '').slice(0, 80)}"`);
      loadNotifs();
    });

    return () => {
      socket.off('book_borrowed');
      socket.off('book_returned');
      socket.off('book_requested');
      socket.off('borrow_approved');
      socket.off('borrow_rejected');
      socket.off('new_message');
      // Do NOT disconnect — the socket is shared and reused on remount.
      // Only logout() disconnects it.
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loadPendingRequests, loadNotifs]);

  useEffect(() => {
    const onDocClick = (event) => {
      if (bellRef.current && !bellRef.current.contains(event.target)) {
        setBellOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const clearNotifications = () => setNotifications([]);

  const handleMarkNotifRead = async (id) => {
    try {
      await notificationService.markRead(id);
      setNotifs((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: 1 } : n)));
      setUnread((u) => Math.max(0, u - 1));
    } catch (err) {
      // ignore
    }
  };

  const handleMarkAllNotifsRead = async () => {
    try {
      await notificationService.markAllRead();
      setNotifs((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
      setUnread(0);
    } catch (err) {
      // ignore
    }
  };

  const handleApprove = async (id) => {
    setProcessingId(id);
    try {
      const res = await borrowService.approve(id);
      toast.success(res.data.message);
      setPendingRequests(prev => prev.filter(item => item.id !== id));
      // Keep the bell open so the librarian can work through a whole queue
      // without reopening it for every request, and refresh the badge so the
      // handled request stops being counted as unread.
      loadNotifs();
      loadPendingRequests();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to approve request');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id) => {
    setProcessingId(id);
    try {
      const res = await borrowService.reject(id);
      toast.success(res.data.message);
      setPendingRequests(prev => prev.filter(item => item.id !== id));
      loadNotifs();
      loadPendingRequests();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reject request');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div
      className="flex min-h-screen"
      style={{
        background: '#ffffff',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* Sidebar */}
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <div className="flex-1 flex flex-col min-w-0">
        {/* Hamburger toggle */}
        <button
          onClick={() => setSidebarOpen(prev => !prev)}
          className="fixed top-3 left-3 z-50 lg:hidden w-10 h-10 rounded-lg bg-white/90 backdrop-blur shadow flex items-center justify-center text-gray-700 hover:bg-white transition"
          aria-label="Toggle sidebar"
        >
          <span className="text-xl">{sidebarOpen ? '✕' : '☰'}</span>
        </button>

        <div className="flex justify-end px-4 pt-3 sm:px-6 lg:px-8">
          <div className="relative" ref={bellRef}>
            <button
              type="button"
              onClick={() => setBellOpen(prev => !prev)}
              className="relative flex items-center justify-center h-11 w-11 rounded-xl bg-gray-100 text-gray-700 shadow hover:bg-gray-200 transition"
              aria-label="Borrow request notifications"
            >
              <span className="text-xl">🔔</span>
              {(pendingRequests.length > 0 || unread > 0) && (
                <span className="absolute -top-1 -right-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                  {(pendingRequests.length + unread) > 9 ? '9+' : (pendingRequests.length + unread)}
                </span>
              )}
            </button>

            {bellOpen && (
              <div className="absolute right-0 top-12 z-50 w-[360px] max-w-[88vw] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl">
                <div className="flex items-center justify-between border-b border-gray-100 bg-[#f9fbf8] px-4 py-3">
                  <div>
                    <p className="text-sm font-bold text-gray-800">Borrow requests</p>
                    <p className="text-[11px] text-gray-500">Pending approvals from members</p>
                  </div>
                  {notifications.length > 0 && (
                    <button onClick={clearNotifications} className="text-[11px] font-medium text-[#2d6f2d] hover:underline">Clear</button>
                  )}
                </div>

                <div className="max-h-[420px] overflow-y-auto">
                  {pendingRequests.length === 0 ? (
                    <div className="px-4 py-6 text-center text-sm text-gray-500">No borrow requests pending.</div>
                  ) : (
                    pendingRequests.map((req) => (
                      <div key={req.id} className="border-b border-gray-100 px-4 py-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-gray-800">
                              {req.first_name || 'User'} {req.last_name || ''}
                            </p>
                            <p className="text-[11px] text-gray-500">{req.customer_id} • {req.role}</p>
                          </div>
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">Pending</span>
                        </div>

                        <p className="mt-2 text-sm text-gray-700">
                          Requested: <span className="font-medium">{req.title}</span>
                        </p>
                        <p className="text-[11px] text-gray-500">Copy: {req.copy_code} • {new Date(req.borrow_date).toLocaleString()}</p>

                        <div className="mt-3 flex gap-2">
                          <button
                            onClick={() => handleApprove(req.id)}
                            disabled={processingId === req.id}
                            className="flex-1 rounded-lg bg-green-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-green-700 disabled:opacity-60"
                          >
                            {processingId === req.id ? 'Approving...' : 'Approve'}
                          </button>
                          <button
                            onClick={() => handleReject(req.id)}
                            disabled={processingId === req.id}
                            className="flex-1 rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
                          >
                            {processingId === req.id ? 'Rejecting...' : 'Reject'}
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {notifs.length > 0 && (
                  <>
                    <div className="flex items-center justify-between border-t border-gray-100 bg-[#f9fbf8] px-4 py-3">
                      <p className="text-sm font-bold text-gray-800">Notifications</p>
                      {unread > 0 && (
                        <button onClick={handleMarkAllNotifsRead} className="text-[11px] font-medium text-[#2d6f2d] hover:underline">
                          Mark all as read
                        </button>
                      )}
                    </div>
                    <div className="max-h-[300px] overflow-y-auto">
                      {notifs.map((n) => (
                        <button
                          key={n.id}
                          onClick={() => handleMarkNotifRead(n.id)}
                          className={`w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition ${n.is_read ? '' : 'bg-blue-50'}`}
                        >
                          <p className="text-sm font-medium flex items-center gap-2">
                            {!n.is_read && <span className="w-2 h-2 rounded-full bg-primary-600"></span>}
                            {n.title}
                          </p>
                          <p className="text-xs text-gray-600 mt-0.5 line-clamp-3">{n.message}</p>
                          <p className="text-[10px] text-gray-400 mt-1">{timeAgo(n.created_at)}</p>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Logout */}
          <button
            type="button"
            onClick={() => { logout(); navigate('/'); }}
            title="Logout"
            className="ml-3 inline-flex items-center gap-2 h-11 px-4 rounded-xl bg-white text-red-600 border border-red-200 shadow-sm font-semibold text-sm hover:bg-red-50 hover:border-red-300 transition"
          >
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>

        {/* Real-time notification bar */}
        {notifications.length > 0 && (
          <div className="bg-[#3d8f3a] border-b border-[#2d6f2d] px-6 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2 overflow-x-auto flex-1">
              {notifications.map((n) => (
                <span key={n.id} className="text-xs px-2 py-1 rounded-full whitespace-nowrap bg-[#ffffff] text-[#2d6f2d] font-medium">
                  {n.text}
                </span>
              ))}
            </div>
            <button onClick={clearNotifications} className="text-xs text-white hover:text-[#eaf7e1] ml-3 font-medium">Clear</button>
          </div>
        )}
        <main className="flex-1 p-2 sm:p-3 lg:p-4 min-w-0">
          <div className="w-full max-w-none">
            <div className="mb-2 flex justify-start">
              <BackButton />
            </div>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;