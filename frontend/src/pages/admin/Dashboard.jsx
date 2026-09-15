import React, { useEffect, useState } from 'react';
import AdminLayout from '../../components/layout/AdminLayout';
import StatCard from '../../components/common/StatCard';
import { reportService } from '../../services';
import { toast } from 'react-toastify';

const sections = [
  { id: 'home', label: 'Home' },
  { id: 'members', label: 'Members' },
  { id: 'books', label: 'Books' },
  { id: 'fines', label: 'Fines' }
];

const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const res = await reportService.dashboard();
      setData(res.data.data);
    } catch (err) {
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-12 h-12 rounded-full border-4 border-white border-t-cyan-400 animate-spin"></div>
        </div>
      </AdminLayout>
    );
  }

  const u = data?.users || {};
  const b = data?.books || {};
  const f = data?.fines || {};
  const c = data?.circulation || {};

  return (
    <AdminLayout>
      {/* ===== Hero (Landing style) ===== */}
      <section id="home" className="relative text-white overflow-hidden animate-gradient bg-gradient-to-br from-primary-900 via-primary-700 to-blue-600 rounded-b-[2.5rem]">
        <div className="absolute top-0 -left-24 w-96 h-96 rounded-full bg-cyan-300/20 animate-blob"></div>
        <div className="absolute bottom-0 -right-24 w-96 h-96 rounded-full bg-indigo-400/20 animate-blob-slow"></div>
        <div className="absolute top-1/4 left-1/2 w-64 h-64 rounded-full bg-white/10 animate-blob-slow" style={{ animationDelay: '-3s' }}></div>
        <div className="absolute top-24 right-[12%] text-7xl opacity-25 animate-float select-none">📚</div>
        <div className="absolute bottom-28 left-[10%] text-6xl opacity-25 animate-float select-none" style={{ animationDelay: '-2s' }}>🎓</div>
        <div className="absolute top-1/2 right-[30%] text-5xl opacity-20 animate-float select-none" style={{ animationDelay: '-1s' }}>📖</div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <div className="inline-flex items-center gap-2 glass-card-dark rounded-full px-4 py-1.5 text-xs font-medium text-blue-100 mb-6 animate-fade-down">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse-soft"></span>
            Hope Haven School Library · Admin
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold leading-tight mb-4 animate-fade-up">
            Library Dashboard
          </h1>
          <p className="text-lg sm:text-xl text-blue-100/90 max-w-2xl mx-auto mb-8 animate-fade-up" style={{ animationDelay: '150ms' }}>
            Every stat, fine and book — all in one place.
          </p>
          <nav className="hidden md:flex items-center justify-center gap-6 text-sm">
            {sections.map((s) => (
              <button key={s.id} onClick={() => scrollTo(s.id)} className="hover:text-white hover:underline underline-offset-4 transition">
                {s.label}
              </button>
            ))}
          </nav>
        </div>
      </section>

      {/* ===== Members ===== */}
      <section id="members" className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 mb-6">
            <span className="text-2xl">👥</span>
            <h2 className="text-2xl font-bold text-gray-800">Members</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
            <StatCard glass label="Total Students" value={u.students || 0} icon="🎓" color="bg-gradient-to-br from-blue-500 to-cyan-400" />
            <StatCard glass label="Total Teachers" value={u.teachers || 0} icon="👩‍🏫" color="bg-gradient-to-br from-purple-500 to-indigo-400" />
            <StatCard glass label="Total Guests" value={u.guests || 0} icon="🪪" color="bg-gradient-to-br from-teal-500 to-emerald-400" />
            <StatCard glass label="Total Users" value={Number(u.students || 0) + Number(u.teachers || 0) + Number(u.guests || 0)} icon="👥" color="bg-gradient-to-br from-gray-600 to-slate-500" />
          </div>
        </div>
      </section>

      {/* ===== Books ===== */}
      <section id="books" className="py-12 bg-gradient-to-b from-white to-blue-50/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 mb-6">
            <span className="text-2xl">📚</span>
            <h2 className="text-2xl font-bold text-gray-800">Books</h2>
            <span className="text-xs text-gray-400 ml-auto">Titles and copy availability</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
            <StatCard glass label="Total Books (titles)" value={b.total_books || 0} icon="📚" color="bg-gradient-to-br from-primary-600 to-blue-400" />
            <StatCard glass label="Available Copies" value={b.available || 0} icon="✅" color="bg-gradient-to-br from-green-500 to-emerald-400" />
            <StatCard glass label="Borrowed Copies" value={b.borrowed || 0} icon="📤" color="bg-gradient-to-br from-amber-500 to-yellow-400" />
            <StatCard glass label="Retired Copies" value={b.retired || 0} icon="🗑️" color="bg-gradient-to-br from-red-500 to-rose-400" />
          </div>
        </div>
      </section>

      {/* ===== Fines ===== */}
      <section id="fines" className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 mb-6">
            <span className="text-2xl">💰</span>
            <h2 className="text-2xl font-bold text-gray-800">Fines</h2>
            <span className="text-xs text-gray-400 ml-auto">Amounts in RWF</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
            <StatCard glass label="Total Fines" value={`${f.total || 0} RWF`} icon="💰" color="bg-gradient-to-br from-indigo-500 to-blue-400" />
            <StatCard glass label="Settled Fines" value={`${f.settled || 0} RWF`} icon="✅" color="bg-gradient-to-br from-green-500 to-emerald-400" />
            <StatCard glass label="Unpaid Fines" value={`${f.unpaid || 0} RWF`} icon="⚠️" color="bg-gradient-to-br from-red-500 to-orange-400" />
            <StatCard glass label="Active Loans" value={`${c.active_loans || 0} (${c.overdue || 0} overdue)`} icon="📋" color="bg-gradient-to-br from-cyan-500 to-sky-400" />
          </div>
        </div>
      </section>

      {/* ===== E-Books ===== */}
      <section id="ebooks" className="py-12 bg-gradient-to-b from-white to-blue-50/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 mb-6">
            <span className="text-2xl">📖</span>
            <h2 className="text-2xl font-bold text-gray-800">E-Books</h2>
            <span className="text-xs text-gray-400 ml-auto">Digital collection</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
            <StatCard glass label="Active E-Books" value={data?.ebooks || 0} icon="📖" color="bg-gradient-to-br from-fuchsia-500 to-pink-400" />
          </div>
        </div>
      </section>

      {/* ===== Footer (Landing style) ===== */}
      <footer className="bg-slate-900 text-slate-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <img src="/hope-logo.png" alt="Hope Haven School Library" className="w-8 h-8 object-contain" />
              <div>
                <div className="font-bold text-white text-sm">Hope Haven School Library</div>
                <div className="text-xs text-slate-500">Smart Library Management System</div>
              </div>
            </div>
            <nav className="flex items-center gap-6 text-sm">
              {sections.map((s) => (
                <button key={s.id} onClick={() => scrollTo(s.id)} className="hover:text-white transition">
                  {s.label}
                </button>
              ))}
            </nav>
            <div className="text-xs text-slate-500">© {new Date().getFullYear()} Hope Haven School Library.</div>
          </div>
        </div>
      </footer>
    </AdminLayout>
  );
};

export default AdminDashboard;
