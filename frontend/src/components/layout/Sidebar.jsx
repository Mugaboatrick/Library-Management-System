import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const NavLink = ({ to, icon, label, onClick, active = false }) => (
  <Link
    to={to}
    onClick={onClick}
    className={`group flex items-center gap-3 px-2.5 py-2 rounded-xl text-[15px] font-semibold transition-all duration-200 border ${
      active
        ? 'bg-white text-[#1c4d1d] border-white/70 shadow-[0_4px_14px_rgba(0,0,0,0.18)]'
        : 'border-transparent text-white/85 hover:bg-white/10 hover:text-white'
    }`}
  >
    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-base transition-all duration-200 group-hover:scale-105 ${
      active ? 'bg-[#2e7d32] text-white' : 'bg-white/10 text-white/90 group-hover:bg-white/15'
    }`}>
      {icon}
    </span>
    <span className="min-w-0 leading-none">
      <span className="block truncate">{label}</span>
    </span>
    {active && (
      <span className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-[#2e7d32]"></span>
    )}
  </Link>
);

const SectionLabel = ({ children }) => (
  <p className="px-2.5 pt-4 pb-1 text-[10px] font-bold uppercase tracking-widest text-white/45">{children}</p>
);

const Sidebar = ({ open = false, onClose = () => {} }) => {
  const location = useLocation();
  const { user } = useAuth();

  const isLibrarian = user?.role === 'LIBRARIAN';
  const isStudent = user?.role === 'STUDENT';

  const isActivePath = (path) => {
    if (path === '/admin') return location.pathname === '/admin';
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  const groups = isLibrarian ? [
    {
      title: 'Overview',
      links: [
        { to: '/admin', icon: '📊', label: 'Dashboard' }
      ]
    },
    {
      title: 'Members & Access',
      links: [
        { to: '/admin/users', icon: '👥', label: 'Users' },
        { to: '/admin/members', icon: '🧑‍🎓', label: 'Members & Login' },
        { to: '/admin/qr-cards', icon: '📱', label: 'QR Cards' }
      ]
    },
    {
      title: 'Library & Operations',
      links: [
        { to: '/admin/books', icon: '📚', label: 'Books' },
        { to: '/admin/categories', icon: '🗂️', label: 'Categories & Subjects' },
        { to: '/admin/borrow', icon: '↔️', label: 'Borrow / Return' },
        { to: '/admin/borrowings', icon: '📋', label: 'Borrowings' },
        { to: '/admin/fines', icon: '💰', label: 'Fines & Payments' },
        { to: '/admin/ebooks', icon: '📖', label: 'E-Books' },
        { to: '/admin/messages', icon: '✉️', label: 'Messages' },
        { to: '/admin/notifications', icon: '🔔', label: 'Notifications' },
        { to: '/admin/reports', icon: '📈', label: 'Reports' }
      ]
    },
    {
      title: 'Account',
      links: [
        { to: '/settings', icon: '⚙️', label: 'Settings' }
      ]
    }
  ] : [
    {
      title: 'Overview',
      links: [
        { to: '/dashboard', icon: '🏠', label: 'Dashboard' }
      ]
    },
    {
      title: 'My Library',
      links: [
        ...(isStudent ? [{ to: '/recent-activity', icon: '📋', label: 'Recent Activity' }] : []),
        { to: '/books', icon: '📚', label: 'Borrow Books' },
        { to: '/reader', icon: '🖥️', label: 'My E-Books' },
        { to: '/my-fines', icon: '💰', label: 'My Fines' }
      ]
    },
    {
      title: 'Account',
      links: [
        { to: '/messages', icon: '✉️', label: 'Messages' },
        { to: '/notifications', icon: '🔔', label: 'Notifications' },
        { to: '/my-qr', icon: '🪪', label: 'My QR Card' },
        { to: '/settings', icon: '⚙️', label: 'Settings' }
      ]
    }
  ];

  return (
    <aside
      // On desktop the green must fill the WHOLE sidebar column, not just the
      // first viewport. The parent is a flex row that grows with the page, so
      // capping the height at h-screen left white space underneath on any long
      // page. self-stretch lets it match the row, and min-h-screen on the parent
      // still guarantees a full viewport when the page is short.
      // On mobile it stays a fixed h-screen drawer, which is what it needs to be
      // to slide over the content.
      className={`fixed z-50 inset-y-0 left-0 w-56 h-screen overflow-hidden bg-[#3f9d3f] flex flex-col text-white transform transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 lg:h-auto lg:self-stretch ${
        open ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
      }`}
    >
      {/* Brand */}
      <div className="relative p-0 border-b border-white/10">
        <div className="flex items-center justify-center w-full min-h-[130px] rounded-none bg-[#3f9d3f] px-3 py-4 shadow-sm ring-0">
          <div className="relative flex h-[100px] w-full max-w-[200px] items-center justify-center overflow-hidden rounded-2xl bg-[#3f9d3f]">
            <img src="/hope-logo.png" alt="Hope Haven" className="h-full w-full object-contain p-2" />
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="lg:hidden absolute right-5 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-sm hover:bg-white/20 transition"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Links */}
      <nav className="sidebar-nav-scroll relative min-h-0 flex-1 bg-[#3f9d3f] px-3 py-3 overflow-y-auto" key={location.pathname.split('/')[1] || 'root'}>
        {groups.map((group, gi) => (
          <div key={group.title} className={gi > 0 ? 'mt-1 border-t border-white/10 pt-1' : ''}>
            <SectionLabel>{group.title}</SectionLabel>
            <div className="space-y-1">
              {group.links.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  icon={link.icon}
                  label={link.label}
                  active={isActivePath(link.to)}
                  onClick={onClose}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;