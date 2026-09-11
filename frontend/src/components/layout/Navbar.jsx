import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import UserAvatar from '../common/UserAvatar';

const links = [
  { to: '/dashboard', icon: '🏠', label: 'Dashboard' },
  { to: '/books', icon: '📚', label: 'Browse Books' },
  { to: '/cart', icon: '📖', label: 'My Borrowings' },
  { to: '/reader', icon: '🖥️', label: 'My E-Books' },
  { to: '/my-qr', icon: '🪪', label: 'My QR Card' },
  { to: '/my-fines', icon: '💰', label: 'My Fines' },
  { to: '/settings', icon: '⚙️', label: 'Settings' },
];

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleNav = () => setMenuOpen(false);

  const roleLabel = user?.role?.charAt(0) + user?.role?.slice(1).toLowerCase();

  return (
    <nav className="relative overflow-hidden animate-gradient bg-gradient-to-r from-primary-900 via-primary-700 to-blue-600 text-white shadow-lg">
      {/* Decorative layers */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-8 -left-8 w-40 h-40 rounded-full bg-cyan-300/20 brand-blob"></div>
        <div className="absolute -bottom-10 right-1/4 w-36 h-36 rounded-full bg-indigo-400/20 brand-blob" style={{ animationDelay: '-5s' }}></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-2 animate-fade-right min-w-0">
            <span className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center overflow-hidden animate-bounce-soft">
            <img src="/hope-logo.png" alt="Hope Haven" className="w-6 h-6 object-contain" />
          </span>
            <Link to={user?.role === 'LIBRARIAN' ? '/admin' : '/dashboard'} className="text-lg font-bold hover:text-blue-100 transition truncate">
Hope Haven School Library
            </Link>
          </div>
          <div className="flex items-center gap-3 animate-fade-left">
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
                  onClick={() => setMenuOpen((v) => !v)}
                  aria-label="Toggle menu"
                  className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-xl hover:bg-white/20 transition"
                >
                  {menuOpen ? '✕' : '☰'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Dropdown menu */}
      {menuOpen && user && (
        <div className="relative border-t border-white/10 animate-fade-down">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 space-y-1">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={handleNav}
                className="nav-link flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm hover:bg-white/10 transition"
              >
                <span className="nav-icon">{l.icon}</span>
                {l.label}
              </Link>
            ))}
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 transition font-medium"
            >
              <span>🚪</span> Logout
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;