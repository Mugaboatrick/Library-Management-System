import React, { useEffect, useState } from 'react';
import AdminLayout from '../../components/layout/AdminLayout';
import { reportService } from '../../services';
import { toast } from 'react-toastify';

const AdminReports = () => {
  const [dashboard, setDashboard] = useState(null);
  const [mostBorrowed, setMostBorrowed] = useState([]);
  const [trends, setTrends] = useState([]);
  const [audits, setAudits] = useState([]);
  const [tab, setTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAll();
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

  const actionColor = (action) => {
    if (action.includes('BORROW')) return 'text-blue-600';
    if (action.includes('RETURN')) return 'text-green-600';
    if (action.includes('FINE') || action.includes('BLOCK')) return 'text-red-600';
    if (action.includes('USER')) return 'text-purple-600';
    return 'text-gray-600';
  };

  return (
    <AdminLayout>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Reports & Analytics</h1>
          <p className="text-gray-500 text-sm">Library performance metrics</p>
        </div>
        <div className="flex gap-2">
          {['overview', 'popular', 'activity'].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-2 rounded-lg text-sm capitalize ${tab === t ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600'}`}
            >
              {t === 'overview' ? 'Overview' : t === 'popular' ? 'Popular Books' : 'Audit Log'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading reports...</div>
      ) : tab === 'overview' ? (
        <div className="space-y-8">
          {/* User composition */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-700 mb-4">User Composition</h3>
            <div className="flex items-end gap-6 h-40">
              {[
                { label: 'Students', value: dashboard?.users?.students || 0, color: 'bg-blue-500' },
                { label: 'Teachers', value: dashboard?.users?.teachers || 0, color: 'bg-purple-500' },
                { label: 'Guests', value: dashboard?.users?.guests || 0, color: 'bg-teal-500' },
              ].map((item) => (
                <div key={item.label} className="flex flex-col items-center flex-1">
                  <span className="text-sm font-bold mb-1">{item.value}</span>
                  <div className={`w-16 ${item.color} rounded-t-lg`} style={{ height: `${Math.max(item.value / Math.max((dashboard?.users?.students || 1)), 0) * 100}%` }}></div>
                  <span className="text-xs text-gray-500 mt-2">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Book status */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-700 mb-4">Book Copy Status</h3>
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
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-700 mb-4">Fines Summary</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-800">{dashboard?.fines?.total || 0} RWF</div>
                <div className="text-xs text-gray-500">Total Fines</div>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-700">{dashboard?.fines?.settled || 0} RWF</div>
                <div className="text-xs text-gray-500">Settled</div>
              </div>
              <div className="p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-700">{dashboard?.fines?.unpaid || 0} RWF</div>
                <div className="text-xs text-gray-500">Unpaid</div>
              </div>
            </div>
          </div>
        </div>
      ) : tab === 'popular' ? (
        <div className="space-y-8">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-700 mb-4">Most Borrowed Books</h3>
            {mostBorrowed.map((b) => (
              <div key={b.id} className="mb-3">
                <div className="flex justify-between text-sm mb-1">
                  <span>{b.title} <span className="text-gray-400 text-xs">({b.author})</span></span>
                  <span className="font-semibold">{b.borrow_count} borrows</span>
                </div>
                <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(b.borrow_count / maxBorrow) * 100}%` }}></div>
                </div>
              </div>
            ))}
            {mostBorrowed.length === 0 && <p className="text-gray-400 text-center py-8">No borrowing data yet</p>}
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-700 mb-4">Monthly Borrowing Trend (Last 12 months)</h3>
            <div className="flex items-end gap-2 h-48">
              {trends.map((t) => (
                <div key={t.month} className="flex flex-col items-center flex-1">
                  <span className="text-xs font-semibold mb-1">{t.borrow_count}</span>
                  <div className="w-full bg-primary-500 rounded-t" style={{ height: `${(t.borrow_count / maxTrend) * 100}%` }}></div>
                  <span className="text-[10px] text-gray-500 mt-1">{t.month}</span>
                </div>
              ))}
              {trends.length === 0 && <p className="text-gray-400 text-center w-full py-8">No trend data yet</p>}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <h3 className="font-semibold text-gray-700 px-6 py-4 border-b">Audit Log</h3>
          <div className="table-wrap">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Time</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">User</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Action</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {audits.map((a) => (
                <tr key={a.id}>
                  <td className="px-4 py-2 text-xs whitespace-nowrap">{new Date(a.created_at).toLocaleString()}</td>
                  <td className="px-4 py-2 text-xs">{a.email || 'System'} <span className="text-gray-400 font-mono">{a.customer_id || ''}</span></td>
                  <td className={`px-4 py-2 text-xs font-medium ${actionColor(a.action)}`}>{a.action}</td>
                  <td className="px-4 py-2 text-xs text-gray-500">{a.details || '-'}</td>
                </tr>
              ))}
              {audits.length === 0 && <tr><td colSpan="4" className="text-center py-8 text-gray-400">No audit logs</td></tr>}
            </tbody>
          </table>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminReports;
