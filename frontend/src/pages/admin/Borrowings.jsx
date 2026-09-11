import React, { useEffect, useState } from 'react';
import AdminLayout from '../../components/layout/AdminLayout';
import { borrowService } from '../../services';
import { toast } from 'react-toastify';

const statusColors = {
  BORROWED: 'bg-blue-100 text-blue-700',
  OVERDUE: 'bg-red-100 text-red-700',
  RETURNED: 'bg-green-100 text-green-700'
};

const AdminBorrowings = () => {
  const [data, setData] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const params = { limit: 100 };
      if (statusFilter) params.status = statusFilter;
      const res = await borrowService.list(params);
      setData(res.data.data);
    } catch (err) {
      toast.error('Failed to load borrowings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Borrowings</h1>
          <p className="text-gray-500 text-sm">All loan records</p>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border rounded-lg"
        >
          <option value="">All Status</option>
          <option value="BORROWED">Borrowed</option>
          <option value="OVERDUE">Overdue</option>
          <option value="RETURNED">Returned</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading...</div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
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
              {data.map((b) => (
                <tr key={b.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium">{b.first_name} {b.last_name}</div>
                    <div className="text-xs text-gray-400 font-mono">{b.customer_id} ({b.role})</div>
                  </td>
                  <td className="px-4 py-3">{b.title}</td>
                  <td className="px-4 py-3 font-mono text-xs">{b.copy_code}</td>
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
              {data.length === 0 && <tr><td colSpan="8" className="text-center py-8 text-gray-400">No borrowings found</td></tr>}
            </tbody>
          </table>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminBorrowings;
