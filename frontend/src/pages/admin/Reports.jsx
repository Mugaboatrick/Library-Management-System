import React, { useEffect, useState, useMemo } from 'react';
import AdminLayout from '../../components/layout/AdminLayout';
import { reportService } from '../../services';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

const AdminReports = () => {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [mostBorrowed, setMostBorrowed] = useState([]);
  const [trends, setTrends] = useState([]);
  const [audits, setAudits] = useState([]);
  const [tab, setTab] = useState('overview');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [dash, borrowRes, trendRes, auditRes] = await Promise.all([
        reportService.dashboard(),
        reportService.mostBorrowed({ limit: 8 }),
        reportService.monthlyTrends(),
        reportService.auditLogs()
      ]);
      setDashboard(dash.data.data);
      setMostBorrowed(borrowRes.data.data);
      setTrends(trendRes.data.data);
      setAudits(auditRes.data.data);
    } catch (err) {
      toast.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const maxBorrow = mostBorrowed.length ? Math.max(...mostBorrowed.map(b => b.borrow_count), 1) : 1;
  const maxTrend = trends.length ? Math.max(...trends.map(t => t.borrow_count), 1) : 1;
  const totalBorrows = mostBorrowed.reduce((sum, b) => sum + b.borrow_count, 0);

  const filteredBooks = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return mostBorrowed;
    return mostBorrowed.filter((b) => `${b.title || ''} ${b.author || ''} ${b.category || ''}`.toLowerCase().includes(q));
  }, [mostBorrowed, search]);

  const filteredAudits = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return audits;
    return audits.filter((a) => `${a.email || ''} ${a.customer_id || ''} ${a.action || ''} ${a.details || ''}`.toLowerCase().includes(q));
  }, [audits, search]);

  const actionBadge = (action) => {
    const styles = {
      BORROW: 'bg-blue-50 text-blue-700 border-blue-200',
      RETURN: 'bg-green-50 text-green-700 border-green-200',
      FINE: 'bg-red-50 text-red-700 border-red-200',
      BLOCK: 'bg-red-50 text-red-700 border-red-200',
      USER: 'bg-purple-50 text-purple-700 border-purple-200',
      CARD: 'bg-amber-50 text-amber-700 border-amber-200',
      LOGIN: 'bg-indigo-50 text-indigo-700 border-indigo-200'
    };
    const cls = Object.keys(styles).find(k => action.includes(k));
    return `inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${styles[cls] || 'bg-gray-50 text-gray-600 border-gray-200'}`;
  };

  const generatedAt = new Date().toLocaleString(undefined, {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
  const reportDate = new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  const preparedBy = user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() : 'Librarian';

  const handlePrint = () => {
    window.print();
  };

  const sectionTitle = (label) => (
    <h3 className="report-section-title">{label}</h3>
  );

  const tabs = [
    { key: 'overview', label: ' Overview' },
    { key: 'popular', label: ' Popular Books' },
    { key: 'activity', label: ' Audit Log' }
  ];

  return (
    <AdminLayout>
      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 16mm 14mm; }
          html, body { background: #ffffff !important; }
          body * { visibility: hidden; }
          #print-report, #print-report * { visibility: visible; }
          #print-report {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 0;
            border: none;
            box-shadow: none;
            border-radius: 0;
            background: #ffffff;
          }
          #print-report .report-header {
            background: #ffffff !important;
            border-bottom: 3px solid #355c2d;
            padding: 0 0 14px;
            margin-bottom: 18px;
          }
          #print-report .report-logo {
            box-shadow: none;
          }
          #print-report .report-section-title {
            font-size: 13px;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: #355c2d;
            border-left: 4px solid #355c2d;
            padding-left: 8px;
            margin: 22px 0 10px;
          }
          #print-report .report-metrics {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 10px;
            margin-top: 14px;
          }
          #print-report .report-metric-card {
            border: 1px solid #e0e4e8;
            border-radius: 8px;
            padding: 8px 10px;
            background: #ffffff !important;
          }
          #print-report .report-metric-value { font-size: 16px; }
          #print-report .report-metric-label { font-size: 10px; text-transform: uppercase; color: #6b7280; }
          #print-report .report-bar { background: #9CCB3C !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          #print-report table { border-collapse: collapse; width: 100%; }
          #print-report table th {
            background: #355c2d !important;
            color: #ffffff !important;
            -webkit-print-color-adjust: exact; print-color-adjust: exact;
            border: 1px solid #2d4d25;
            padding: 6px 8px;
            text-align: left;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.04em;
          }
          #print-report table td {
            border: 1px solid #dfe3e8;
            padding: 5px 8px;
            font-size: 11px;
          }
          #print-report table tr { page-break-inside: avoid; }
          #print-report .report-footer {
            display: block !important;
            margin-top: 20px;
            padding-top: 8px;
            border-top: 1px solid #dfe3e8;
            font-size: 10px;
            color: #6b7280;
            text-align: center;
          }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="no-print mb-6 flex justify-between items-center flex-wrap gap-3">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-[#2d6f2d]">Reports & Analytics</h1>
          <p className="text-gray-500 text-base mt-1">Library performance metrics</p>
        </div>
        <button
          onClick={handlePrint}
          className="ml-2 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-semibold shadow hover:bg-green-700 transition"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Print Report
        </button>
      </div>

      <div className="no-print mb-6">
        {/* Stats cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3 shadow-sm">
            <div>
              <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Students</p>
              <p className="text-2xl font-bold text-blue-600">{dashboard?.users?.students || 0}</p>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3 shadow-sm">
            <div>
              <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Teachers & Guests</p>
              <p className="text-2xl font-bold text-purple-600">{(dashboard?.users?.teachers || 0) + (dashboard?.users?.guests || 0)}</p>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3 shadow-sm">
            <div>
              <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Available Copies</p>
              <p className="text-2xl font-bold text-emerald-600">{dashboard?.books?.available || 0}</p>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3 shadow-sm">
            <div>
              <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Unpaid Fines</p>
              <p className="text-2xl font-bold text-red-600">{dashboard?.fines?.unpaid || 0} RWF</p>
            </div>
          </div>
        </div>

        {/* Control bar: tabs + search */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-b bg-gradient-to-r from-green-50 to-emerald-50">
            <div className="flex flex-wrap gap-2">
              {tabs.map((t) => (
                <button
                  key={t.key}
                  onClick={() => { setTab(t.key); setSearch(''); }}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium ${tab === t.key ? 'bg-green-600 text-white shadow-sm' : 'text-gray-600 hover:bg-white bg-white/60'}`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            {tab !== 'overview' && (
              <div className="relative flex-1 min-w-[200px] max-w-sm ml-auto">
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={tab === 'popular' ? 'Research a popular book (title, author)…' : 'Research audit log (user, action, details)…'}
                  className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="no-print text-center py-12 text-gray-500">Loading reports...</div>
      ) : (
        <div id="print-report" className="bg-white rounded-xl border border-gray-200 overflow-hidden p-6 shadow-sm">
          {/* ===== Professional report header ===== */}
          <div className="report-header mb-6 pb-6 border-b-4 border-[#355c2d]">
            <div className="flex items-start justify-between gap-4 print:block">
              <div className="flex items-center gap-4">
                <div className="report-logo w-14 h-14 rounded-xl bg-[#2d6f2d] text-white flex items-center justify-center text-2xl font-black shadow">HH</div>
                <div>
                  <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">Hope Haven School Library</h2>
                  <p className="text-sm text-[#5f9b3f] font-semibold uppercase tracking-widest mt-0.5">Library Activity Report</p>
                </div>
              </div>
              <div className="text-right text-sm text-gray-600 leading-relaxed">
                <div>
                  <span className="text-gray-400 uppercase text-xs tracking-wider">Report date</span>
                  <div className="font-semibold text-gray-800">{reportDate}</div>
                </div>
                <div className="mt-1">
                  <span className="text-gray-400 uppercase text-xs tracking-wider">Prepared by</span>
                  <div className="font-semibold text-gray-800">{preparedBy}</div>
                </div>
              </div>
            </div>

            {/* Summary metrics strip */}
            <div className="report-metrics grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
              <div className="report-metric-card border border-gray-200 rounded-lg p-3 bg-gray-50">
                <div className="report-metric-value text-2xl font-bold text-gray-800">
                  {dashboard?.users?.students || 0}
                </div>
                <div className="report-metric-label text-xs text-gray-500 mt-0.5">Students</div>
              </div>
              <div className="report-metric-card border border-gray-200 rounded-lg p-3 bg-gray-50">
                <div className="report-metric-value text-2xl font-bold text-gray-800">
                  {(dashboard?.users?.teachers || 0) + (dashboard?.users?.guests || 0)}
                </div>
                <div className="report-metric-label text-xs text-gray-500 mt-0.5">Teachers &amp; Guests</div>
              </div>
              <div className="report-metric-card border border-gray-200 rounded-lg p-3 bg-gray-50">
                <div className="report-metric-value text-2xl font-bold text-gray-800">
                  {dashboard?.books?.available || 0}
                </div>
                <div className="report-metric-label text-xs text-gray-500 mt-0.5">Available Copies</div>
              </div>
              <div className="report-metric-card border border-gray-200 rounded-lg p-3 bg-gray-50">
                <div className="report-metric-value text-2xl font-bold text-gray-800">
                  {dashboard?.fines?.unpaid || 0} RWF
                </div>
                <div className="report-metric-label text-xs text-gray-500 mt-0.5">Unpaid Fines</div>
              </div>
            </div>
          </div>

          {tab === 'overview' && (
            <>
              {/* User composition */}
              <div className="mb-6">
                {sectionTitle('1. User Composition')}
                <div className="grid grid-cols-3 gap-6">
                  {[
                    { label: 'Students', value: dashboard?.users?.students || 0, color: 'bg-blue-500' },
                    { label: 'Teachers', value: dashboard?.users?.teachers || 0, color: 'bg-purple-500' },
                    { label: 'Guests', value: dashboard?.users?.guests || 0, color: 'bg-teal-500' },
                  ].map((item) => (
                    <div key={item.label} className="flex flex-col items-center">
                      <span className="text-lg font-bold mb-1">{item.value}</span>
                      <div className={`w-16 ${item.color} rounded-t-lg h-24 min-h-[8px]`} style={{ height: `${Math.max(item.value / Math.max((dashboard?.users?.students || 1)), 0) * 96}px` }}></div>
                      <span className="text-xs text-gray-500 mt-2">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Book status */}
              <div className="mb-6">
                {sectionTitle('2. Book Copy Status')}
                <div className="flex h-6 rounded-full overflow-hidden mb-4">
                  <div className="bg-green-500" style={{ width: `${(dashboard?.books?.available || 0) / Math.max((dashboard?.books?.available || 0) + (dashboard?.books?.borrowed || 0) + (dashboard?.books?.retired || 0), 1) * 100}%` }}></div>
                  <div className="bg-amber-500" style={{ width: `${(dashboard?.books?.borrowed || 0) / Math.max((dashboard?.books?.available || 0) + (dashboard?.books?.borrowed || 0) + (dashboard?.books?.retired || 0), 1) * 100}%` }}></div>
                  <div className="bg-red-500" style={{ width: `${(dashboard?.books?.retired || 0) / Math.max((dashboard?.books?.available || 0) + (dashboard?.books?.borrowed || 0) + (dashboard?.books?.retired || 0), 1) * 100}%` }}></div>
                </div>
                <div className="grid grid-cols-3 text-center text-sm">
                  <div><span className="inline-block w-3 h-3 rounded bg-green-500 mr-1"></span>Available: {dashboard?.books?.available || 0}</div>
                  <div><span className="inline-block w-3 h-3 rounded bg-amber-500 mr-1"></span>Borrowed: {dashboard?.books?.borrowed || 0}</div>
                  <div><span className="inline-block w-3 h-3 rounded bg-red-500 mr-1"></span>Retired: {dashboard?.books?.retired || 0}</div>
                </div>
              </div>

              {/* Fines summary */}
              <div>
                {sectionTitle('3. Fines Summary')}
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="text-2xl font-bold text-gray-800">{dashboard?.fines?.total || 0} RWF</div>
                    <div className="text-xs text-gray-500 mt-1">Total Fines</div>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="text-2xl font-bold text-green-700">{dashboard?.fines?.settled || 0} RWF</div>
                    <div className="text-xs text-gray-500 mt-1">Settled</div>
                  </div>
                  <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                    <div className="text-2xl font-bold text-red-700">{dashboard?.fines?.unpaid || 0} RWF</div>
                    <div className="text-xs text-gray-500 mt-1">Unpaid</div>
                  </div>
                </div>
              </div>
            </>
          )}

          {tab === 'popular' && (
            <>
              <div className="mb-6">
                {sectionTitle('Most Borrowed Books')}
                {filteredBooks.length === 0 ? (
                  <p className="text-gray-400 text-center py-8">{search ? 'No popular books match your search' : 'No borrowing data yet'}</p>
                ) : (
                  filteredBooks.map((b, i) => {
                    const pct = Math.round((b.borrow_count / totalBorrows) * 100);
                    return (
                      <div key={b.id} className="mb-3">
                        <div className="flex justify-between items-center text-sm mb-1">
                          <span className="flex items-center gap-2 font-semibold text-gray-800">
                            <span className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold flex-none ${i === 0 ? 'bg-amber-100 text-amber-700 border border-amber-200' : 'bg-gray-100 text-gray-600 border border-gray-200'}`}>#{i + 1}</span>
                            {b.title}
                            <span className="text-gray-400 text-xs font-normal">({b.author})</span>
                          </span>
                          <span className="flex items-center gap-2 flex-none">
                            <span className="font-bold text-gray-800">{b.borrow_count} borrows</span>
                            <span className="text-[11px] font-semibold text-green-700 bg-green-50 border border-green-200 rounded-full px-2 py-0.5">{pct}%</span>
                          </span>
                        </div>
                        <div className="h-4 bg-gray-100 rounded-full overflow-hidden ml-8">
                          <div className={`report-bar h-full rounded-full ${i === 0 ? 'bg-amber-400' : 'bg-blue-500'}`} style={{ width: `${(b.borrow_count / maxBorrow) * 100}%` }}></div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div>
                {sectionTitle('Monthly Borrowing Trend (Last 12 months)')}
                <div className="flex items-end gap-2 h-48">
                  {trends.map((t) => (
                    <div key={t.month} className="flex flex-col items-center flex-1">
                      <span className="text-xs font-semibold mb-1">{t.borrow_count}</span>
                      <div className="report-bar w-full bg-primary-500 rounded-t" style={{ height: `${(t.borrow_count / maxTrend) * 100}%` }}></div>
                      <span className="text-[10px] text-gray-500 mt-1">{t.month}</span>
                    </div>
                  ))}
                  {trends.length === 0 && <p className="text-gray-400 text-center w-full py-8">No trend data yet</p>}
                </div>
              </div>
            </>
          )}

          {tab === 'activity' && (
            <>
              {sectionTitle('Audit Log')}
              <div className="table-wrap">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold">Time</th>
                    <th className="text-left px-4 py-3 font-semibold">User</th>
                    <th className="text-left px-4 py-3 font-semibold">Action</th>
                    <th className="text-left px-4 py-3 font-semibold">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredAudits.map((a) => (
                    <tr key={a.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-xs whitespace-nowrap">{new Date(a.created_at).toLocaleString()}</td>
                      <td className="px-4 py-2 text-xs">{a.email || 'System'} <span className="text-gray-400 font-mono">{a.customer_id || ''}</span></td>
                      <td className="px-4 py-2 text-xs"><span className={actionBadge(a.action)}>{a.action}</span></td>
                      <td className="px-4 py-2 text-xs text-gray-500">{a.details || '-'}</td>
                    </tr>
                  ))}
                  {filteredAudits.length === 0 && <tr><td colSpan="4" className="text-center py-8 text-gray-400">{search ? 'No audit logs match your search' : 'No audit logs'}</td></tr>}
                </tbody>
              </table>
              </div>
            </>
          )}

          {/* Print-only footer */}
          <div className="report-footer" style={{ display: 'none' }}>
            <div>Hope Haven School Library — Library Activity Report</div>
            <div>Generated on {generatedAt} by {preparedBy}. For library administration only.</div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminReports;