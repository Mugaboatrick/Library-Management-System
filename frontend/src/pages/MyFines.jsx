import React, { useEffect, useState } from 'react';
import UserLayout from '../components/layout/UserLayout';
import { fineService } from '../services';
import { toast } from 'react-toastify';

const MyFines = () => {
  const [fines, setFines] = useState(null);
  const [payAllModal, setPayAllModal] = useState(false);
  const [payForm, setPayForm] = useState({ method: 'CASH', reference: '' });
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const res = await fineService.mine();
      setFines(res.data);
    } catch (err) {
      toast.error('Failed to load fines');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handlePayAll = async (e) => {
    e.preventDefault();
    try {
      const res = await fineService.payAll(payForm);
      toast.success(res.data.message);
      setPayAllModal(false);
      setPayForm({ method: 'CASH', reference: '' });
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payment failed');
    }
  };

  const unpaid = fines?.data?.filter(f => f.status === 'UNPAID') || [];
  const unpaidTotal = fines?.totals?.unpaid || 0;

  return (
    <UserLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">My Fines</h1>
        <p className="text-gray-500 text-sm">Manage your library fines</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <p className="text-sm text-gray-500">Total Fines</p>
          <p className="text-2xl font-bold">{fines?.totals?.total || 0} RWF</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <p className="text-sm text-gray-500">Paid</p>
          <p className="text-2xl font-bold text-green-600">{fines?.totals?.paid || 0} RWF</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <p className="text-sm text-gray-500">Unpaid</p>
          <p className="text-2xl font-bold text-red-600">{unpaidTotal} RWF</p>
        </div>
      </div>

      {unpaid.length > 0 && (
        <div className="mb-6">
          <button onClick={() => setPayAllModal(true)} className="px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700">
            Pay All Unpaid Fines
          </button>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading...</div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="table-wrap">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Book</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Overdue Days</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Amount</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(fines?.data || []).map((f) => (
                <tr key={f.id}>
                  <td className="px-4 py-3">{f.title || '-'}</td>
                  <td className="px-4 py-3">{f.days_overdue}</td>
                  <td className="px-4 py-3 font-semibold">{f.amount} RWF</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                      f.status === 'PAID' ? 'bg-green-100 text-green-700' :
                      f.status === 'WAIVED' ? 'bg-gray-100 text-gray-600' : 'bg-red-100 text-red-700'
                    }`}>{f.status}</span>
                  </td>
                  <td className="px-4 py-3 text-xs">{new Date(f.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
              {(fines?.data || []).length === 0 && <tr><td colSpan="5" className="text-center py-8 text-gray-400">No fines - great job!</td></tr>}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {/* Pay all modal */}
      {payAllModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setPayAllModal(false)}></div>
            <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md p-6 z-10">
              <h3 className="text-lg font-semibold mb-4">Pay All Fines</h3>
              <form onSubmit={handlePayAll}>
                <p className="text-sm text-gray-600 mb-4">Total due: <span className="font-bold text-green-700">{unpaidTotal} RWF</span></p>
                <div className="mb-3">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Payment Method *</label>
                  <select value={payForm.method} onChange={(e) => setPayForm({ ...payForm, method: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm">
                    <option value="CASH">Cash</option>
                    <option value="MOBILE_MONEY">Mobile Money</option>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                  </select>
                </div>
                <div className="mb-4">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Reference</label>
                  <input value={payForm.reference} onChange={(e) => setPayForm({ ...payForm, reference: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => setPayAllModal(false)} className="px-4 py-2 border rounded-lg text-sm">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm">Confirm Payment</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </UserLayout>
  );
};

export default MyFines;
