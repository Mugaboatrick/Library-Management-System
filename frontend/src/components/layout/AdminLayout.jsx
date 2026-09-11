import React, { useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import { connectSocket } from '../../services/socket';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

const AdminLayout = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!user) return;

    // connectSocket is idempotent: reuses the existing socket if present
    const socket = connectSocket(user.role);

    socket.off('book_borrowed');
    socket.off('book_returned');

    socket.on('book_borrowed', (data) => {
      const msg = `📤 ${data.customer} borrowed ${data.copy}`;
      setNotifications(prev => [{ id: Date.now(), text: msg, type: 'borrowed' }, ...prev].slice(0, 10));
      toast.info(`Borrow: ${data.customer} → ${data.copy}`);
    });

    socket.on('book_returned', (data) => {
      const fineText = data.fine > 0 ? ` +${data.fine} RWF fine` : '';
      const condText = data.condition && data.condition !== 'GOOD' ? ` (${data.condition})` : '';
      const msg = `📥 ${data.copy} returned${condText}${fineText}`;
      setNotifications(prev => [{ id: Date.now(), text: msg, type: 'returned' }, ...prev].slice(0, 10));
      toast.info(`Return: ${data.copy}${fineText}`);
    });

    return () => {
      socket.off('book_borrowed');
      socket.off('book_returned');
      // Do NOT disconnect — the socket is shared and reused on remount.
      // Only logout() disconnects it.
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const clearNotifications = () => setNotifications([]);

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <div className="lg:hidden sticky top-0 z-30 relative overflow-hidden animate-gradient bg-gradient-to-r from-slate-900 via-primary-900 to-primary-800 text-white shadow-md">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-cyan-400/20 brand-blob"></div>
          </div>
          <div className="relative flex items-center gap-3 px-4 h-14">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
              className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center text-lg hover:bg-white/20 transition"
            >
              ☰
            </button>
            <span className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center overflow-hidden">
              <img src="/hope-logo.png" alt="Hope Haven" className="w-5 h-5 object-contain" />
            </span>
            <span className="font-bold text-sm truncate">Hope Haven School Library</span>
          </div>
        </div>

        {/* Real-time notification bar */}
        {notifications.length > 0 && (
          <div className="bg-blue-50 border-b border-blue-200 px-6 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2 overflow-x-auto flex-1">
              {notifications.map((n) => (
                <span key={n.id} className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${n.type === 'borrowed' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                  {n.text}
                </span>
              ))}
            </div>
            <button onClick={clearNotifications} className="text-xs text-gray-500 hover:text-gray-700 ml-3">Clear</button>
          </div>
        )}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 animate-fade-up min-w-0">{children}</main>
      </div>
    </div>
  );
};

export default AdminLayout;