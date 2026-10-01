import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import BackButton from '../components/common/BackButton';

const features = [
  { icon: '', title: 'QR Card Login', desc: 'Every member gets a secure HMAC-signed QR card. Tap and scan to sign in instantly — no passwords needed.' },
  { icon: '', title: 'Smart Borrowing', desc: 'Borrow and return books in seconds with live copy tracking. Know exactly what is on the shelf or checked out.' },
  { icon: '⏰', title: 'Overdue Alerts', desc: 'Automatic fine calculation with fair flat rates, day-by-day overdue tracking, and account blocking when limits are passed.' },
  { icon: '', title: 'Digital E-Books', desc: 'Read full e-books in the browser reader with built-in search — no extra app needed.' },
  { icon: '', title: 'Real-time Notifications', desc: 'Live updates stream over WebSocket so librarians see every borrow and return the moment it happens.' },
  { icon: '', title: 'Reports & Analytics', desc: 'Most-borrowed books, user composition, monthly trends and audit logs all in one clean dashboard.' }
];

const steps = [
  { num: '1', icon: '', title: 'Get Your QR Card', desc: 'The librarian creates a personalised QR card for your membership in a few clicks.' },
  { num: '2', icon: '', title: 'Borrow & Return', desc: 'Scan in at the desk, take your books home, and return them when you are done.' },
  { num: '3', icon: '', title: 'Track & Pay', desc: 'Check your borrowings and fines online, and pay any balance right from your account.' }
];

const sections = [
  { id: 'home', label: 'Home' },
  { id: 'about', label: 'About' },
  { id: 'features', label: 'Features' },
  { id: 'how', label: 'How it works' }
];

const Landing = () => {
  const { user } = useAuth();

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-blue-50/40 to-white text-slate-800 overflow-x-hidden">
      {/* ===== Navbar ===== */}
      <header className="fixed top-0 inset-x-0 z-50 glass-card border-b border-white/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3 animate-fade-right">
              <BackButton />
              <img src="/hope-logo.png" alt="Hope Haven School Library" className="w-9 h-9 object-contain" />
              <span className="font-bold text-[#1f4d34] text-lg">Hope Haven School Library</span>
            </div>
            <nav className="hidden md:flex items-center gap-6 text-sm text-gray-600">
              {sections.map((s) => (
                <button key={s.id} onClick={() => scrollTo(s.id)} className="hover:text-primary-700 hover:underline underline-offset-4 transition">
                  {s.label}
                </button>
              ))}
            </nav>
            <div className="flex items-center gap-3">
              {user ? (
                <Link to={user.role === 'LIBRARIAN' ? '/admin' : '/dashboard'} className="btn-hero px-5 py-2 rounded-full text-sm font-semibold text-white bg-gradient-to-r from-primary-600 to-blue-500">
                  Go to Dashboard 
                </Link>
              ) : (
                <>
                  <Link to="/login" className="btn-hero px-5 py-2 rounded-full text-sm font-semibold text-white bg-gradient-to-r from-primary-600 to-blue-500">Scan QR Card</Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ===== Hero ===== */}
      <section id="home" className="relative min-h-screen flex items-center justify-center animate-gradient bg-gradient-to-br from-[#1f4d34] via-[#7CB342] to-[#facc15] text-white overflow-hidden">
        {/* Transparent decorative layers */}
        <div className="absolute inset-0">
          <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-blue-400/20 animate-blob"></div>
          <div className="absolute top-1/3 -right-32 w-[28rem] h-[28rem] rounded-full bg-cyan-300/20 animate-blob-slow"></div>
          <div className="absolute bottom-0 left-1/4 w-80 h-80 rounded-full bg-indigo-400/20 animate-blob" style={{ animationDelay: '-3s' }}></div>
          <div className="absolute top-1/4 left-1/2 w-64 h-64 rounded-full bg-white/10 animate-blob-slow"></div>
        </div>
        {/* Floating "image" emojis */}

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center py-32">
          <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#9CCB3C] via-[#d7eb7c] to-[#facc15] px-4 py-1.5 text-xs font-bold text-[#173d2b] shadow-md mb-6 animate-fade-down">
            <span className="w-2 h-2 rounded-full bg-[#1f4d34] animate-pulse-soft"></span>
            Smart Library Management System
          </div>
          <h1 className="text-4xl sm:text-6xl font-extrabold leading-tight mb-6 animate-fade-up">
            Welcome to <span className="text-shine">Hope Haven School Library</span>
            <span className="block mt-2 text-yellow-50">Library, Reimagined.</span>
          </h1>
          <p className="text-lg sm:text-xl text-yellow-50/90 max-w-2xl mx-auto mb-10 animate-fade-up" style={{ animationDelay: '150ms' }}>
            One platform for everything your school library does — QR access cards, instant borrowing,
            automatic fines, digital e-books and live reports. Simple for students, powerful for librarians.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 animate-fade-up" style={{ animationDelay: '300ms' }}>
            {user ? (
              <Link to={user.role === 'LIBRARIAN' ? '/admin' : '/dashboard'} className="btn-hero px-8 py-3.5 rounded-full font-semibold bg-white text-primary-800">
                Open My Dashboard 
              </Link>
            ) : (
              <>
                <Link to="/login" className="btn-hero px-8 py-3.5 rounded-full font-semibold bg-white text-primary-800">Sign In Now</Link>
                <Link to="/login" className="btn-hero px-8 py-3.5 rounded-full font-semibold bg-gradient-to-r from-cyan-400 to-blue-500 text-white">Scan QR Card</Link>
              </>
            )}
            <button
              onClick={() => scrollTo('about')}
              className="px-6 py-3.5 rounded-full font-semibold text-white border-2 border-white/40 hover:bg-white/10 transition"
            >
              Learn more
            </button>
          </div>
          <div className="mt-12 flex items-center justify-center gap-6 text-blue-100/80 animate-fade-up" style={{ animationDelay: '450ms' }}>
            <span className="flex items-center gap-2"><span className="text-emerald-300"></span> QR Card Login</span>
            <span className="flex items-center gap-2"><span className="text-emerald-300"></span> Auto Fines</span>
            <span className="flex items-center gap-2"><span className="text-emerald-300"></span> E-Book Reader</span>
          </div>
        </div>
      </section>

      {/* ===== About ===== */}
      <section id="about" className="relative py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center stagger-children">
            <div>
              <h2 className="text-3xl sm:text-4xl font-extrabold mb-6">What is <span className="text-shine">Hope Haven School Library</span>?</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                Hope Haven School Library Management System is a complete digital solution built for modern school
                libraries. We replace paper cards, stamp books and manual fine ledgers with a fast, secure and
                friendly system that everyone can use in seconds.
              </p>
              <ul className="space-y-3 text-gray-700 mb-8">
                <li className="flex items-start gap-3">
                  <span><strong>Members</strong> scan their personal QR card at the desk to sign in and borrow books — no typing, no waiting.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span><strong>Librarians</strong> manage books, members, fines and reports from one clean dashboard — plus receive live alerts as books move.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span><strong>Everything online</strong> for students and teachers: browse books, read e-books, see borrowings and pay fines from any device.</span>
                </li>
              </ul>
              <button onClick={() => scrollTo('features')} className="btn-hero px-6 py-3 rounded-full font-semibold text-white bg-gradient-to-r from-primary-600 to-blue-500">
                Explore Features 
              </button>
            </div>
            <div className="relative">
              <div className="absolute -inset-6 bg-gradient-to-br from-primary-200/60 to-cyan-200/60 rounded-3xl animate-blob-slow"></div>
              <div className="relative glass-card rounded-3xl p-8 shadow-2xl">
                <div className="grid grid-cols-2 gap-4 stagger-children">
                  {[
                    { icon: '', value: 'Students & Staff', sub: 'QR access for every member' },
                    { icon: '', value: 'Physical + Digital', sub: 'Print books and e-books in one place' },
                    { icon: '⏰', value: 'Auto Fines', sub: 'No more handwritten penalties' },
                    { icon: '', value: 'Live Updates', sub: 'Real-time desk notifications' }
                  ].map((i) => (
                    <div key={i.value} className="card-hover bg-white/70 rounded-2xl p-5 text-center">
                      <div className="font-semibold text-gray-800 text-sm">{i.value}</div>
                      <div className="text-xs text-gray-500 mt-1">{i.sub}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== Features ===== */}
      <section id="features" className="py-20 bg-gradient-to-b from-white to-blue-50/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 animate-fade-up">
            <span className="inline-block px-4 py-1 rounded-full bg-primary-100 text-primary-700 text-xs font-semibold mb-4">Features</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold">Everything the library needs</h2>
            <p className="text-gray-500 mt-3 max-w-xl mx-auto">Purpose-built tools that make running and using the library effortless.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children">
            {features.map((f) => (
              <div key={f.title} className="card-hover glass-card rounded-2xl p-6 border border-white/60 shadow-sm">
                <h3 className="font-bold text-gray-800 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== How it works ===== */}
      <section id="how" className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 animate-gradient bg-gradient-to-br from-primary-900 via-primary-700 to-blue-600 opacity-95"></div>
        <div className="absolute top-10 left-10 w-72 h-72 rounded-full bg-cyan-300/20 animate-blob"></div>
        <div className="absolute bottom-10 right-10 w-72 h-72 rounded-full bg-indigo-400/20 animate-blob-slow"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 animate-fade-up text-white">
            <span className="inline-block px-4 py-1 rounded-full bg-white/15 text-blue-100 text-xs font-semibold mb-4">Get started</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold">How it works</h2>
            <p className="text-blue-100/80 mt-3">Three simple steps from day one.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 stagger-children">
            {steps.map((s) => (
              <div key={s.num} className="glass-card-dark rounded-2xl p-8 text-center text-white card-hover">
                <div className="mb-4">
                  <span className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-2xl font-bold">{s.num}</span>
                </div>
                <h3 className="font-bold text-lg mb-2">{s.title}</h3>
                <p className="text-sm text-blue-100/80">{s.desc}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-12 animate-fade-up">
            {!user && (
              <Link to="/login" className="btn-hero px-8 py-3.5 rounded-full font-semibold bg-white text-primary-800">
                Scan QR Card to Sign In 
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section id="cta" className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="glass-card rounded-3xl p-10 sm:p-14 text-center border border-white/60 shadow-lg animate-zoom-in">
            <h2 className="text-3xl font-extrabold mb-3">Ready to open a book?</h2>
            <p className="text-gray-500 max-w-lg mx-auto mb-8">Sign in to check your borrowings, scan your QR card at the desk, or dive straight into the digital shelf.</p>
            <div className="flex flex-wrap justify-center gap-4">
              {user ? (
                <Link to={user.role === 'LIBRARIAN' ? '/admin' : '/dashboard'} className="btn-hero px-8 py-3 rounded-full font-semibold text-white bg-gradient-to-r from-primary-600 to-blue-500">
                  Open My Dashboard 
                </Link>
              ) : (
                <>
                  <Link to="/login" className="btn-hero px-8 py-3 rounded-full font-semibold text-white bg-gradient-to-r from-primary-600 to-blue-500">Sign In</Link>
                  <Link to="/login" className="btn-hero px-8 py-3 rounded-full font-semibold text-primary-800 bg-white border-2 border-primary-200">Scan QR Card</Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ===== Footer ===== */}
      <footer className="bg-slate-900 text-slate-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <img src="/hope-logo.png" alt="Hope Haven School Library" className="w-9 h-9 object-contain" />
                <div>
                  <div className="font-bold text-white">Hope Haven School Library</div>
                  <div className="text-xs text-slate-500">Smart Library Management System</div>
                </div>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed">
                Bringing reading and learning together for students, teachers, and guests —
                simple, fast, and secure.
              </p>
            </div>

            {/* About Us */}
            <div>
              <h4 className="text-white font-bold mb-3">About Us</h4>
              <p className="text-sm text-slate-400 leading-relaxed mb-3">
                Hope Haven School Library Management System is a complete digital solution for modern school
                libraries. We replace paper cards, stamp books, and manual fine ledgers with a fast, secure,
                and friendly system everyone can use in seconds.
              </p>
              <ul className="space-y-2 text-sm text-slate-400">
                <li className="flex items-start gap-2">
                  <span><strong className="text-slate-200">QR access</strong> — members scan their card at the desk to sign in and borrow.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span><strong className="text-slate-200">Borrow &amp; return</strong> — live tracking for every book copy.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span><strong className="text-slate-200">E-books &amp; fines</strong> — read online and manage payments in one place.</span>
                </li>
              </ul>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-white font-bold mb-3">Quick Links</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <button onClick={() => scrollTo('home')} className="hover:text-white transition"> Home</button>
                </li>
                <li>
                  <button onClick={() => scrollTo('about')} className="hover:text-white transition"> About Us</button>
                </li>
                <li>
                  <button onClick={() => scrollTo('features')} className="hover:text-white transition"> Features</button>
                </li>
                <li>
                  <button onClick={() => scrollTo('cta')} className="hover:text-white transition"> Get Started</button>
                </li>
                <li>
                  <Link to="/login" className="hover:text-white transition"> Sign In</Link>
                </li>
              </ul>
            </div>

            {/* Library Info */}
            <div>
              <h4 className="text-white font-bold mb-3">Library Info</h4>
              <ul className="space-y-3 text-sm text-slate-400">
                <li className="flex items-start gap-2">
                  <span><strong className="text-slate-200">Who we serve</strong><br />Students, teachers, and guests of Hope Haven School.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span><strong className="text-slate-200">Open</strong><br />On all school days — scan your QR card at the desk to borrow.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span><strong className="text-slate-200">Need help?</strong><br />Visit the library desk or use “Account Requests” to sign up.</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 mt-10 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <img src="/hope-logo.png" alt="Hope Haven School Library" className="w-8 h-8 object-contain" />
              <div>
                <div className="font-bold text-white text-sm">Hope Haven School Library</div>
                <div className="text-xs text-slate-500">Smart Library Management System</div>
              </div>
            </div>
            <div className="text-xs text-slate-500 text-center md:text-right">
              © {new Date().getFullYear()} Hope Haven School Library. Built with  for students, teachers & librarians.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;