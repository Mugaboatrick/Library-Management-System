import React, { useEffect, useState } from 'react';
import AdminNavbar from './AdminNavbar';
import { connectSocket } from '../../services/socket';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

const AdminLayout = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);

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
    <div
      className="flex min-h-screen bg-gray-50"
      style={{
        backgroundImage: "linear-gradient(rgba(15,23,42,0.5), rgba(15,23,42,0.5)), url('/dashboard-bg.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* Mobile overlay */}
      <div className="flex-1 flex flex-col min-w-0">
        <AdminNavbar />

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
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0">{children}</main>
      </div>
    </div>
  );
};

export default AdminLayout;