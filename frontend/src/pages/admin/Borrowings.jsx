import React, { useEffect, useMemo, useState } from 'react';
import AdminLayout from '../../components/layout/AdminLayout';
import { borrowService } from '../../services';
import { toast } from 'react-toastify';

const statusColors = {
  BORROWED: 'bg-blue-50 text-blue-700 ring-1 ring-blue-100',
  OVERDUE: 'bg-red-50 text-red-700 ring-1 ring-red-100',
  RETURNED: 'bg-green-50 text-green-700 ring-1 ring-green-100',
  REQUESTED: 'bg-amber-50 text-amber-700 ring-1 ring-amber-100',
  REJECTED: 'bg-gray-100 text-gray-500 ring-1 ring-gray-100'
};

const AdminBorrowings = () => {
  const [data, setData] = useState([]);
  const [pending, setPending] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const params = { limit: 300 };
      if (statusFilter) params.status = statusFilter;
      const [allRes, pendRes] = await Promise.all([
        borrowService.list(params),
        borrowService.list({ status: 'REQUESTED', limit: 100 })
      ]);
      setData(allRes.data.data);
      setPending(pendRes.data.data);
    } catch (err) {
      toast.error('Failed to load borrowings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return data;
    return data.filter((b) =>
      `${b.title} ${b.first_name} ${b.last_name} ${b.copy_code} ${b.customer_id} ${b.role} ${b.status}`
        .toLowerCase()
        .includes(q)
    );
  }, [data, search]);

  const stats = useMemo(() => {
    const active = data.filter((b) => b.status === 'BORROWED').length;
    const overdue = data.filter((b) => b.status === 'OVERDUE').length;
    const returned = data.filter((b) => b.status === 'RETURNED').length;
    const requested = pending.length;
    return { active, overdue, returned, requested };
  }, [data, pending]);

  const handleApprove = async (id) => {
    setProcessingId(id);
    try {
      const res = await borrowService.approve(id);
      toast.success(res.data.message);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to approve request');
      load();
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id) => {
    setProcessingId(id);
    try {
      const res = await borrowService.reject(id);
      toast.success(res.data.message);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reject request');
      load();
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-[#2d6f2d]">Borrowings</h1>
          <p className="text-[#2d6f2d]/80 text-base mt-1">All loan records &amp; requests</p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-4 py-3 relative overflow-hidden">
          <div className="absolute inset-y-0 left-0 w-1 bg-amber-400"></div>
          <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Pending requests</p>
          <p className="text-2xl font-bold text-amber-600">{stats.requested}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-4 py-3 relative overflow-hidden">
          <div className="absolute inset-y-0 left-0 w-1 bg-blue-400"></div>
          <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Borrowed now</p>
          <p className="text-2xl font-bold text-blue-600">{stats.active}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-4 py-3 relative overflow-hidden">
          <div className="absolute inset-y-0 left-0 w-1 bg-red-400"></div>
          <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Overdue</p>
          <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-4 py-3 relative overflow-hidden">
          <div className="absolute inset-y-0 left-0 w-1 bg-green-400"></div>
          <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Returned</p>
          <p className="text-2xl font-bold text-green-600">{stats.returned}</p>
        </div>
      </div>

      {/* Research / search bar */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-3 mb-6 flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search any book, copy code, customer..."
            className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="">All Status</option>
          <option value="REQUESTED">Pending Requests</option>
          <option value="BORROWED">Borrowed</option>
          <option value="OVERDUE">Overdue</option>
          <option value="REJECTED">Rejected</option>
          <option value="RETURNED">Returned</option>
        </select>
      </div>

      {/* Pending requests panel */}
      {pending.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-6">
          <div className="relative px-5 py-4 bg-gradient-to-r from-amber-50 to-orange-50/60 border-b border-amber-100">
            <div className="flex items-center gap-3">
              <span className="flex items-center justify-center w-11 h-11 rounded-xl bg-amber-100 ring-1 ring-amber-200 text-2xl">⏳</span>
              <div className="flex-1">
                <h2 className="font-bold text-gray-800">Pending Borrow Requests</h2>
                <p className="text-xs text-gray-500">Approve or reject requests from members</p>
              </div>
              <span className="px-2.5 py-1 bg-white ring-1 ring-amber-200 text-amber-700 rounded-full text-xs font-semibold">{pending.length} awaiting</span>
            </div>
          </div>
          <div className="table-wrap">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Student / Teacher</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Book</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Copy</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Requested</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Due (if approved)</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pending.map((b) => (
                  <tr key={b.id} className="hover:bg-amber-50/40 transition">
                    <td className="px-4 py-3">
                      <div className="font-medium">{b.first_name} {b.last_name}</div>
                      <div className="text-xs text-gray-400 font-mono">{b.customer_id} ({b.role})</div>
                    </td>
                    <td className="px-4 py-3">{b.title}</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{b.copy_code}</td>
                    <td className="px-4 py-3 text-xs">{new Date(b.borrow_date).toLocaleString()}</td>
                    <td className="px-4 py-3 text-xs">{new Date(b.due_date).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApprove(b.id)}
                          disabled={processingId === b.id}
                          className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 transition disabled:opacity-60"
                        >
                           Approve
                        </button>
                        <button
                          onClick={() => handleReject(b.id)}
                          disabled={processingId === b.id}
                          className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-medium hover:bg-red-700 transition disabled:opacity-60"
                        >
                           Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading...</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="relative px-5 py-4 bg-gradient-to-r from-green-50 to-emerald-50/60 border-b border-green-100">
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <h2 className="font-bold text-gray-800">Loan Records</h2>
                <p className="text-xs text-gray-500">{search ? `Results for "${search}"` : 'All borrowing activity'}</p>
              </div>
              <span className="px-2.5 py-1 bg-white ring-1 ring-green-200 text-green-700 rounded-full text-xs font-semibold">{filtered.length} records</span>
            </div>
          </div>
          <div className="table-wrap">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Customer</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Book</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Copy</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Borrowed</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Due</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Returned</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Overdue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((b) => (
                  <tr key={b.id} className="hover:bg-green-50/40 transition">
                    <td className="px-4 py-3">
                      <div className="font-medium">{b.first_name} {b.last_name}</div>
                      <div className="text-xs text-gray-400 font-mono">{b.customer_id} ({b.role})</div>
                    </td>
                    <td className="px-4 py-3">{b.title}</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{b.copy_code}</td>
                    <td className="px-4 py-3 text-xs">{new Date(b.borrow_date).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-xs">{new Date(b.due_date).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-xs">{b.returned_date ? new Date(b.returned_date).toLocaleDateString() : '-'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${statusColors[b.status]}`}>{b.status}</span>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {b.current_overdue_days > 0 ? (
                        <span className="text-red-600 font-semibold">{b.current_overdue_days} days</span>
                      ) : <span className="text-gray-300">-</span>}
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && <tr><td colSpan="8" className="text-center py-10 text-gray-400">{search ? 'No records match your search' : 'No borrowings found'}</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminBorrowings;
