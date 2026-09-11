import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const NavLink = ({ to, icon, label, active, onClick }) => (
  <Link
    to={to}
    onClick={onClick}
    className={`nav-link flex items-center px-4 py-2.5 text-sm rounded-lg mb-1 transition-colors ${
      active
        ? 'nav-link-active bg-gradient-to-r from-primary-600 to-blue-500 text-white'
        : 'text-slate-300 hover:bg-white/10 hover:text-white'
    }`}
  >
    <span className="nav-icon mr-3 text-lg">{icon}</span>
    {label}
  </Link>
);

const Sidebar = ({ open = false, onClose = () => {} }) => {
  const location = useLocation();
  const { user } = useAuth();

  const isLibrarian = user?.role === 'LIBRARIAN';

  const links = isLibrarian ? [
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
  ] : [
    { to: '/dashboard', icon: '🏠', label: 'Dashboard' },
    { to: '/books', icon: '📚', label: 'Browse Books' },
    { to: '/cart', icon: '📖', label: 'My Borrowings' },
    { to: '/reader', icon: '🖥️', label: 'My E-Books' },
    { to: '/my-fines', icon: '💰', label: 'My Fines' },
    { to: '/settings', icon: '⚙️', label: 'Settings' },
  ];

  return (
    <aside
      className={`fixed z-50 inset-y-0 left-0 w-64 relative overflow-hidden animate-gradient bg-gradient-to-b from-slate-900 via-primary-900 to-primary-800 min-h-screen flex flex-col text-white transform transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
        open ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
      }`}
    >
      {/* Decorative blobs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-cyan-400/15 brand-blob"></div>
        <div className="absolute bottom-1/4 -left-12 w-48 h-48 rounded-full bg-indigo-500/15 brand-blob" style={{ animationDelay: '-4s' }}></div>
      </div>

      {/* Brand */}
      <div className="relative p-5 border-b border-white/10 animate-fade-down">
        <div className="flex items-center gap-3">
          <span className="w-11 h-11 rounded-2xl bg-white/10 flex items-center justify-center overflow-hidden animate-bounce-soft">
            <img src="/hope-logo.png" alt="Hope Haven" className="w-8 h-8 object-contain" />
          </span>
          <div className="flex-1 min-w-0">
            <p className="font-extrabold leading-tight">Hope Haven School Library</p>
            <p className="text-[11px] text-blue-200/80">Library Management System</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="lg:hidden w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-sm hover:bg-white/20 transition"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Links */}
      <nav className="relative flex-1 p-3 mt-2 nav-stagger" key={location.pathname.split('/')[1] || 'root'}>
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            icon={link.icon}
            label={link.label}
            active={location.pathname === link.to || location.pathname.startsWith(link.to + '/')}
            onClick={onClose}
          />
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;