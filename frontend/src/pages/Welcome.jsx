import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { reportService } from '../services';
import UserAvatar from '../components/common/UserAvatar';

const Welcome = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);

  const isLibrarian = user?.role === 'LIBRARIAN';
  const home = isLibrarian ? '/admin' : '/dashboard';

  useEffect(() => {
    reportService
      .publicSummary()
      .then((res) => setStats(res?.data?.data))
      .catch(() => {});
  }, []);

  const members = stats?.users
    ? (stats.users.students || 0) + (stats.users.teachers || 0) + (stats.users.guests || 0) + 1
    : 0;
  const statsItems = [
    { value: members.toLocaleString(), label: 'Members with QR access cards' },
    { value: (stats?.books?.total_books || 0).toLocaleString(), label: 'Books in the library' },
    { value: (stats?.ebooks || 0).toLocaleString(), label: 'Digital e-books available' },
    { value: (stats?.circulation?.active_loans || 0).toLocaleString(), label: 'Books borrowed right now' }
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const programs = [
    {
      icon: '🪪',
      title: 'QR ACCESS',
      desc: 'Sign in with your personal QR card — just present it and you are inside. No passwords needed each time, and every entry is recorded safely.'
    },
    {
      icon: '📚',
      title: 'BORROW & RETURN',
      desc: 'Search the catalog, borrow books and follow your due dates. The system tracks everything so returns stay on time for everyone.'
    },
    {
      icon: '📖',
      title: 'E-BOOKS & FINES',
      desc: 'Read digital books on your own device wherever you are, and keep an eye on fines — all automatically calculated for late returns.'
    }
  ];

  const tour = [
    'Sign in with your QR card at the library entrance.',
    'Browse the catalog and borrow books you want to read.',
    'Read e-books anywhere, on your phone or computer.',
    'Return on time to keep fines away, and enjoy the library.'
  ];

  return (
    <div className="bg-white text-slate-900 animate-fade-up">
      {/* ===== Header ===== */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-slate-100 animate-fade-down">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
          <Link to={home} className="flex items-center gap-3">
            <img src="/hope-logo.png" alt="Hope Haven School Library" className="w-10 h-10 object-contain animate-bounce-soft" />
            <span className="font-bold text-xl tracking-tight">Hope Haven School Library</span>
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#about" className="hover:text-primary-600 transition">About</a>
            <a href="#stats" className="hover:text-primary-600 transition">Our Numbers</a>
            <a href="#tour" className="hover:text-primary-600 transition">How it Works</a>
            <a href="#mission" className="hover:text-primary-600 transition">Mission</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link to={home} className="hidden sm:block text-sm font-semibold text-slate-500 hover:text-slate-800 transition">
              Dashboard
            </Link>
            <button
              onClick={() => navigate(home)}
              className="px-5 py-2.5 rounded-full font-semibold text-sm text-white bg-gradient-to-r from-primary-600 to-blue-500 hover:opacity-90 transition shadow-md card-hover animate-pop-in"
            >
              Continue →
            </button>
          </div>
        </div>
      </header>

      {/* ===== Hero ===== */}
      <section className="relative overflow-hidden animate-gradient bg-gradient-to-br from-primary-900 via-primary-700 to-blue-600 text-white">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-20 -right-20 w-96 h-96 rounded-full bg-cyan-300/20 animate-blob"></div>
          <div className="absolute -bottom-24 -left-16 w-80 h-80 rounded-full bg-indigo-400/25 animate-blob-slow"></div>
        </div>
        <div className="relative max-w-5xl mx-auto px-6 py-20 sm:py-28 text-center animate-pop-in">
          <span className="inline-block glass-card-dark rounded-full px-4 py-1.5 text-xs font-medium text-blue-100 mb-6 animate-bounce-soft">
            ✦ Welcome, {user?.first_name} {user?.last_name} ✦
          </span>
          <h1 className="text-4xl sm:text-6xl font-serif font-bold leading-tight">
            Every book begins your
            <span className="block text-shine">next adventure.</span>
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-lg text-blue-100/90">
            Welcome to Hope Haven School Library. Explore thousands of books, read
            e-books anywhere and borrow with your personal QR card — all in one place.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
            <button
              onClick={() => navigate(home)}
              className="btn-hero px-8 py-3.5 rounded-full font-bold text-primary-900 bg-white hover:bg-blue-50 transition shadow-2xl animate-fade-up"
              style={{ animationDelay: '150ms' }}
            >
              Continue to our Dashboard →
            </button>
            <a
              href="#about"
              className="px-8 py-3.5 rounded-full font-semibold text-white border-2 border-white/40 hover:bg-white/10 transition animate-fade-up"
              style={{ animationDelay: '250ms' }}
            >
              Explore the library
            </a>
          </div>
        </div>
      </section>

      {/* ===== Stats ===== */}
      <section id="stats" className="max-w-6xl mx-auto px-6 -mt-10 relative z-10 animate-fade-up" style={{ animationDelay: '300ms' }}>
        <div className="glass-card rounded-3xl border border-slate-100 shadow-xl p-8 grid grid-cols-2 lg:grid-cols-4 gap-8">
          {statsItems.map((s, i) => (
            <div key={s.label} className={`text-center stagger-children`} style={{ animationDelay: `${i * 80}ms` }}>
              <div className="text-4xl font-extrabold text-primary-700 font-serif">{s.value}</div>
              <div className="mt-1 text-xs text-slate-500 uppercase tracking-wide">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ===== About (program-style cards) ===== */}
      <section id="about" className="max-w-6xl mx-auto px-6 py-20">
        <h2 className="text-3xl sm:text-4xl font-serif font-bold text-center">
          Everything your library needs<span className="text-primary-600">.</span>
        </h2>
        <p className="text-slate-500 text-center mt-3 max-w-2xl mx-auto">
          A complete reading experience for students, teachers and guests — made simple.
        </p>
        <div className="grid md:grid-cols-3 gap-6 mt-12 stagger-children">
          {programs.map((p) => (
            <div key={p.title} className="rounded-3xl bg-slate-50 p-8 card-hover">
              <div className="w-16 h-16 rounded-2xl bg-white shadow flex items-center justify-center text-3xl animate-float inline-block">
                {p.icon}
              </div>
              <h3 className="mt-5 font-extrabold text-sm tracking-widest text-primary-700">{p.title}</h3>
              <p className="mt-3 text-sm text-slate-600 leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== Quick tour ===== */}
      <section id="tour" className="bg-slate-50 py-20">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-center">How it works</h2>
          <p className="text-slate-500 text-center mt-3">A simple tour for your first visit.</p>
          <div className="mt-12 space-y-6 stagger-children">
            {tour.map((t, i) => (
              <div key={t} className="flex items-start gap-6">
                <div className="w-12 h-12 shrink-0 rounded-full bg-gradient-to-br from-primary-600 to-blue-500 text-white font-bold flex items-center justify-center animate-pop-in">
                  {i + 1}
                </div>
                <div className="flex-1 border-b border-slate-200 pb-6">
                  <p className="text-lg text-slate-700">{t}</p>
                  <div className="mt-2 h-1.5 rounded-full bg-gradient-to-r from-primary-600 to-blue-500" style={{ width: `${(i + 1) * 25}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Mission ===== */}
      <section id="mission" className="max-w-4xl mx-auto px-6 py-20 text-center">
        <div className="w-20 h-20 mx-auto mb-6 overflow-hidden animate-bounce-soft">
          <img src="/hope-logo.png" alt="Hope Haven School Library" className="w-full h-full object-contain" />
        </div>
        <h2 className="text-3xl font-serif font-bold">Our Mission</h2>
        <p className="mt-6 text-xl leading-relaxed text-slate-600 animate-fade-up">
          “To grow a love of reading and learning in every student of Hope Haven
          Christian School — one book, one e-book and one borrow at a time —
          with uncompromising excellence and care for everyone in our community.”
        </p>
        <button
          onClick={() => navigate(home)}
          className="mt-10 px-8 py-3.5 rounded-full font-bold text-white bg-gradient-to-r from-primary-600 to-blue-500 hover:opacity-90 transition shadow-md"
        >
          Continue to our Dashboard →
        </button>
      </section>

      {/* ===== Signed in ===== */}
      <div className="max-w-4xl mx-auto px-6 pb-16 flex justify-center">
        <div className="inline-flex items-center gap-3 bg-slate-100 rounded-full pl-2 pr-6 py-2 animate-fade-up">
          <UserAvatar user={user} size="sm" />
          <div className="text-left leading-tight">
            <p className="text-sm font-bold text-slate-800">{user?.first_name} {user?.last_name}</p>
            <p className="text-[11px] text-slate-500">{user?.role ? user.role.charAt(0) + user.role.slice(1).toLowerCase() : ''} • {user?.customer_id}</p>
          </div>
          <button onClick={handleLogout} className="ml-2 px-4 py-1.5 rounded-full text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition">
            Log Out
          </button>
        </div>
      </div>

      {/* ===== Footer ===== */}
      <footer className="bg-slate-900 text-slate-300 py-10">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <img src="/hope-logo.png" alt="Hope Haven School Library" className="w-8 h-8 object-contain rounded-full bg-white/10" />
            <span className="font-bold text-white">Hope Haven School Library</span>
          </div>
          <p className="text-xs text-slate-400 text-center">
            Hope Haven School Library Management System • {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Welcome;