import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import UserAvatar from '../common/UserAvatar';

const links = [
  { to: '/admin', icon: '📊', label: 'Dashboard' },
  { to: '/admin/users', icon: '👥', label: 'Users' },
  { to: '/admin/qr-cards', icon: '📱', label: 'QR Cards' },
  { to: '/admin/books', icon: '📚', label: 'Books' },
  { to: '/admin/borrow', icon: '↔️', label: 'Borrow / Return' },
  { to: '/admin/borrowings', icon: '📋', label: 'Borrowings' },
  { to: '/admin/fines', icon: '💰', label: 'Fines & Payments' },
  { to: '/admin/ebooks', icon: '📖', label: 'E-Books' },
  { to: '/admin/reports', icon: '📈', label: 'Reports' },
  { to: '/settings', icon: '⚙️', label: 'Settings' },
];

const AdminNavbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const roleLabel = user?.role?.charAt(0) + user?.role?.slice(1).toLowerCase();

  return (
    <nav className="sticky top-0 z-40 relative overflow-hidden bg-gradient-to-r from-slate-900 via-primary-900 to-primary-800 text-white shadow-lg">
      {/* Decorative layers */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-8 -left-8 w-40 h-40 rounded-full bg-cyan-300/20"></div>
        <div className="absolute -bottom-10 right-1/4 w-36 h-36 rounded-full bg-indigo-400/20"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center gap-3 h-14">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center overflow-hidden">
              <img src="/hope-logo.png" alt="Hope Haven" className="w-5 h-5 object-contain" />
            </span>
            <Link to="/admin" className="text-base font-bold hover:text-blue-100 transition truncate">
              Hope Haven School Library
            </Link>
          </div>
          <div className="flex items-center gap-3">
            {user && (
              <>
                <div className="hidden sm:flex items-center gap-3 glass-card-dark rounded-full pr-4 py-1.5 pl-1.5">
                  <UserAvatar user={user} size="sm" />
                  <div className="leading-tight">
                    <p className="text-sm font-semibold">{user.first_name} {user.last_name}</p>
                    <p className="text-[10px] text-blue-200/80">
                      {roleLabel} • {user.customer_id}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 transition font-medium"
                >
                  <span>🚪</span>
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Nav links */}
        <div className="flex items-center gap-1 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-none">
          {links.map((l) => {
            const active = location.pathname === l.to || location.pathname.startsWith(l.to + '/');
            return (
              <Link
                key={l.to}
                to={l.to}
                className={`whitespace-nowrap flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition ${
                  active ? 'bg-white/20 text-white' : 'text-slate-200 hover:bg-white/10'
                }`}
              >
                <span>{l.icon}</span>
                {l.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default AdminNavbar;