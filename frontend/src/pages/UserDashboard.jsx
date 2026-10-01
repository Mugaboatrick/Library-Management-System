import React from 'react';
import { Link } from 'react-router-dom';
import UserLayout from '../components/layout/UserLayout';
import { useAuth } from '../context/AuthContext';

const Icon = ({ name, className = 'h-5 w-5' }) => {
  const paths = {
    books: <><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5z" /><path d="M4 5.5v16M8 7h8M8 11h8" /></>,
    card: <><rect x="2.5" y="5" width="19" height="14" rx="2.5" /><circle cx="8.5" cy="11" r="2" /><path d="M5 16.5c.6-1.7 2-2.5 3.5-2.5s2.9.8 3.5 2.5M14.5 10h4M14.5 13.5h2.5" /></>,
    reader: <><path d="M12 6.5C10.5 5 8 4.5 4 5v13c4-.5 6.5 0 8 1.5 1.5-1.5 4-2 8-1.5V5c-4-.5-6.5 0-8 1.5z" /><path d="M12 6.5v13" /></>
  };
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[name]}
    </svg>
  );
};

const UserDashboard = () => {
  const { user } = useAuth();

  // "STUDENT" -> "Student". Derived from the session, so it stays correct
  // without a request.
  const roleLabel = user?.role ? user.role.charAt(0) + user.role.slice(1).toLowerCase() : '';
  const memberId = user?.customer_id || '';

  return (
    <UserLayout>
      <div className="w-full pb-4">
        {/* Mirrors the administrator dashboard: one full-bleed hero with the
            library photo and the same scale of type, so the two dashboards feel
            like the same product. Only the actions differ, since a member
            browses, shows a card to borrow, and reads e-books. */}
        <section className="relative isolate flex min-h-[calc(100dvh-120px)] w-full overflow-hidden rounded-lg bg-[#e8f4e7]">
          <img
            src="/library-bg.jpg"
            alt="Bookshelves in the Hope Haven library"
            className="absolute inset-0 -z-20 h-full w-full object-cover object-center"
          />
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#edf7e9]/95 via-[#edf7e9]/88 to-[#edf7e9]/45 sm:via-[#edf7e9]/80 sm:to-transparent" />

          <div className="flex w-full max-w-3xl flex-col items-start justify-center px-6 py-8 sm:px-10">
            <span className="inline-flex items-center gap-2 rounded-full bg-[#d9f0dd] px-4 py-1.5 text-sm font-extrabold uppercase tracking-wide text-[#158044] sm:text-base">
              <Icon name="books" className="h-4 w-4 sm:h-5 sm:w-5" /> Hope Haven School Library
            </span>

            <h1 className="mt-4 text-4xl font-extrabold leading-[1.05] tracking-tight text-[#075f31] sm:text-5xl lg:text-6xl">
              Welcome to<br />Hope Haven Library
            </h1>

            <p className="mt-4 text-lg font-semibold text-[#286741] sm:text-xl lg:text-2xl">
              Learn. Read. Grow.
            </p>

            {/* Shown only when the session has both, so a half-loaded profile
                never renders a dangling separator. */}
            {(roleLabel || memberId) && (
              <p className="mt-3 text-sm font-medium text-[#286741]/85 sm:text-base">
                {[roleLabel, memberId].filter(Boolean).join(' \u00b7 ')}
              </p>
            )}

            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/books" className="inline-flex items-center gap-2.5 rounded-full bg-[#138344] px-6 py-3 text-base font-bold text-white transition hover:bg-[#096d36]">
                <Icon name="books" className="h-5 w-5" /> Explore Books
              </Link>
              <Link to="/my-qr" className="inline-flex items-center gap-2.5 rounded-full border border-[#178646] bg-white/80 px-6 py-3 text-base font-bold text-[#167640] transition hover:bg-white">
                <Icon name="card" className="h-5 w-5" /> My QR Card
              </Link>
              <Link to="/reader" className="inline-flex items-center gap-2.5 rounded-full border border-[#178646] bg-white/80 px-6 py-3 text-base font-bold text-[#167640] transition hover:bg-white">
                <Icon name="reader" className="h-5 w-5" /> Read E-Books
              </Link>
            </div>
          </div>
        </section>
      </div>
    </UserLayout>
  );
};

export default UserDashboard;
