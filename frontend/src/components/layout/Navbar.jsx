import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { connectSocket } from '../../services/socket';
import { notificationService } from '../../services';
import { toast } from 'react-toastify';

const timeAgo = (dateStr) => {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(dateStr).toLocaleDateString();
};

const Navbar = ({ onMenuToggle, menuOpen }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [bellOpen, setBellOpen] = useState(false);
  const [notifs, setNotifs] = useState([]);
  const [unread, setUnread] = useState(0);
  const bellRef = useRef(null);

  const loadNotifs = useCallback(async () => {
    if (!user) return;
    try {
      const res = await notificationService.mine();
      setNotifs(res.data.data || []);
      setUnread(res.data.unread || 0);
    } catch (err) {
      // ignore — notification poll failures should not disrupt the app
    }
  }, [user]);

  useEffect(() => {
    loadNotifs();
  }, [loadNotifs]);

  // Close bell dropdown when clicking outside
  useEffect(() => {
    const onDocClick = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) {
        setBellOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  // Real-time overdue / borrow notifications for members
  useEffect(() => {
    if (!user) return;
    const socket = connectSocket(user.role, user.id);

    socket.off('borrow_overdue');
    socket.off('borrow_approved');
    socket.off('borrow_rejected');
    socket.off('book_returned');
    socket.off('borrow_confirmed');
    socket.off('new_message');

    socket.on('borrow_overdue', (data) => {
      toast.error(`⏰ Book overdue! "${data.title}" was due — please return it to the library.`);
      loadNotifs();
    });

    socket.on('borrow_approved', (data) => {
      toast.success(`Your request was approved! "${data.title}" is ready to pick up at the library.`);
      loadNotifs();
    });

    socket.on('borrow_rejected', (data) => {
      toast.warning(`Your borrow request for "${data.title}" was declined by the librarian.`);
      loadNotifs();
    });

    socket.on('book_returned', (data) => {
      toast.success(` "${data.title}" was returned to the library successfully.`);
      loadNotifs();
    });

    socket.on('borrow_confirmed', (data) => {
      toast.success(` The librarian issued "${data.title}" to you.`);
      loadNotifs();
    });

    socket.on('new_message', (data) => {
      toast.info(` New message from ${data.from}: "${(data.body || data.subject || '').slice(0, 80)}"`);
      loadNotifs();
    });

    return () => {
      socket.off('borrow_overdue');
      socket.off('borrow_approved');
      socket.off('borrow_rejected');
      socket.off('book_returned');
      socket.off('borrow_confirmed');
      socket.off('new_message');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const markRead = async (id) => {
    try {
      await notificationService.markRead(id);
      setNotifs((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: 1 } : n)));
      setUnread((u) => Math.max(0, u - 1));
    } catch (err) {
      // ignore
    }
  };

  const markAllRead = async () => {
    try {
      await notificationService.markAllRead();
      setNotifs((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
      setUnread(0);
    } catch (err) {
      // ignore
    }
  };

  return (
    <nav className="relative bg-white text-gray-800 shadow-md border-b border-gray-100 lg:pl-1">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              onClick={onMenuToggle}
              aria-label="Toggle menu"
              className="lg:hidden w-10 h-10 rounded-lg bg-white/90 backdrop-blur shadow flex items-center justify-center text-gray-700 hover:bg-white transition"
            >
              <span className="text-xl">{menuOpen ? '✕' : '☰'}</span>
            </button>
            <span className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center overflow-hidden">
              <img src="/hope-logo.png" alt="Hope Haven" className="w-6 h-6 object-contain" />
            </span>
          </div>
          <div className="flex items-center gap-3">
            {user && (
              <>
                {/* Notification bell */}
                <div className="relative" ref={bellRef}>
                  <button
                    type="button"
                    onClick={() => setBellOpen((v) => !v)}
                    aria-label="Notifications"
                    className="relative w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-xl hover:bg-gray-200 transition"
                  >
                    🔔
                    {unread > 0 && (
                      <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-[10px] font-bold flex items-center justify-center">
                        {unread > 99 ? '99+' : unread}
                      </span>
                    )}
                  </button>
                  {bellOpen && (
                    <div className="absolute right-0 mt-2 w-96 max-w-[85vw] bg-white text-gray-800 rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50">
                      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                        <p className="font-semibold text-sm">Notifications</p>
                        {unread > 0 && (
                          <button onClick={markAllRead} className="text-xs text-primary-600 hover:underline">
                            Mark all as read
                          </button>
                        )}
                      </div>
                      <div className="max-h-96 overflow-y-auto">
                        {notifs.length === 0 ? (
                          <p className="text-center text-gray-400 text-sm py-8">No notifications yet</p>
                        ) : (
                          notifs.map((n) => (
                            <button
                              key={n.id}
                              onClick={() => markRead(n.id)}
                              className={`w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition ${n.is_read ? '' : 'bg-blue-50'}`}
                            >
                              <p className="text-sm font-medium flex items-center gap-2">
                                {!n.is_read && <span className="w-2 h-2 rounded-full bg-primary-600"></span>}
                                {n.title}
                              </p>
                              <p className="text-xs text-gray-600 mt-0.5 line-clamp-3">{n.message}</p>
                              <p className="text-[10px] text-gray-400 mt-1">{timeAgo(n.created_at)}</p>
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="hidden sm:flex items-center gap-3 rounded-full">
                  {/* Logout */}
                  <button
                    type="button"
                    onClick={() => { logout(); navigate('/'); }}
                    title="Logout"
                    aria-label="Logout"
                    className="inline-flex items-center justify-center gap-2 h-10 px-3 rounded-xl bg-red-500/90 text-white text-sm font-semibold hover:bg-red-600 transition shadow"
                  >
                    <span className="hidden md:inline">Logout</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;