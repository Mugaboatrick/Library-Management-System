import React, { useEffect, useState } from 'react';
import AdminLayout from '../../components/layout/AdminLayout';
import Modal from '../../components/common/Modal';
import { fineService } from '../../services';
import { toast } from 'react-toastify';

const statusColors = {
  UNPAID: 'bg-red-100 text-red-700',
  PAID: 'bg-green-100 text-green-700',
  WAIVED: 'bg-gray-100 text-gray-600'
};

const AdminFines = () => {
  const [fines, setFines] = useState([]);
  const [payments, setPayments] = useState([]);
  const [tab, setTab] = useState('fines');
  const [statusFilter, setStatusFilter] = useState('');
  const [payModal, setPayModal] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      const res = await fineService.list(params);
      setFines(res.data.data);
      const payRes = await fineService.payments();
      setPayments(payRes.data.data);
    } catch (err) {
      toast.error('Failed to load fines');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const loadFines = async () => {
    try {
      const res = await fineService.list({ status: statusFilter || undefined });
      setFines(res.data.data);
    } catch (err) { toast.error('Failed to reload'); }
  };

  const handlePay = async (e) => {
    e.preventDefault();
    try {
      const res = await fineService.pay(payModal.fineId, {
        amount: payModal.amount,
        method: payModal.method,
        reference: payModal.reference
      });
      toast.success(res.data.message);
      setPayModal(null);
      loadFines();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payment failed');
    }
  };

  const handleWaive = async (fineId) => {
    if (!window.confirm('Waive this fine?')) return;
    try {
      const res = await fineService.waive(fineId, { reason: 'Librarian discretion' });
      toast.success(res.data.message);
      loadFines();
    } catch (err) {
      toast.error('Failed to waive fine');
    }
  };

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Fines & Payments</h1>
          <p className="text-gray-500 text-sm">Automatic fine management</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setTab('fines')} className={`px-3 py-2 rounded-lg text-sm ${tab === 'fines' ? 'bg-primary-600 text-white' : 'bg-gray-100'}`}>Fines</button>
          <button onClick={() => setTab('payments')} className={`px-3 py-2 rounded-lg text-sm ${tab === 'payments' ? 'bg-primary-600 text-white' : 'bg-gray-100'}`}>Payments</button>
        </div>
      </div>

      {tab === 'fines' ? (
        <>
          <div className="mb-4">
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 border rounded-lg">
              <option value="">All Status</option>
              <option value="UNPAID">Unpaid</option>
              <option value="PAID">Paid</option>
              <option value="WAIVED">Waived</option>
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
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Amount</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Overdue Days</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Date</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {fines.map((f) => (
                    <tr key={f.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="font-medium">{f.first_name} {f.last_name}</div>
                        <div className="text-xs text-gray-400 font-mono">{f.customer_id}</div>
                      </td>
                      <td className="px-4 py-3">{f.title || '-'} {f.copy_code ? `(${f.copy_code})` : ''}</td>
                      <td className="px-4 py-3 font-semibold">{f.amount} RWF</td>
                      <td className="px-4 py-3">{f.days_overdue}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs ${statusColors[f.status]}`}>{f.status}</span>
                      </td>
                      <td className="px-4 py-3 text-xs">{new Date(f.created_at).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        {f.status === 'UNPAID' && (
                          <div className="flex gap-2">
                            <button onClick={() => setPayModal({ fineId: f.id, amount: f.amount, method: 'CASH', reference: '' })} className="text-green-600 hover:underline text-xs">Pay</button>
                            <button onClick={() => handleWaive(f.id)} className="text-gray-500 hover:underline text-xs">Waive</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                  {fines.length === 0 && <tr><td colSpan="7" className="text-center py-8 text-gray-400">No fines found</td></tr>}
                </tbody>
              </table>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="table-wrap">
                <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Customer</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Amount</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Method</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Reference</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {payments.map((p) => (
                <tr key={p.id}>
                  <td className="px-4 py-3">{p.first_name} {p.last_name} <span className="text-xs text-gray-400 font-mono">({p.customer_id})</span></td>
                  <td className="px-4 py-3 font-semibold">{p.amount} RWF</td>
                  <td className="px-4 py-3">{p.method}</td>
                  <td className="px-4 py-3 text-xs">{p.reference || '-'}</td>
                  <td className="px-4 py-3 text-xs">{new Date(p.paid_at).toLocaleString()}</td>
                </tr>
              ))}
              {payments.length === 0 && <tr><td colSpan="5" className="text-center py-8 text-gray-400">No payments yet</td></tr>}
            </tbody>
          </table>
              </div>
        </div>
      )}

      <Modal open={!!payModal} onClose={() => setPayModal(null)} title="Record Fine Payment">
        {payModal && (
          <form onSubmit={handlePay}>
            <p className="text-sm text-gray-600 mb-4">Amount due: <span className="font-bold text-primary-700">{payModal.amount} RWF</span></p>
            <div className="mb-3">
              <label className="block text-xs font-medium text-gray-600 mb-1">Amount*</label>
              <input type="number" value={payModal.amount} onChange={(e) => setPayModal({ ...payModal, amount: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" required />
            </div>
            <div className="mb-3">
              <label className="block text-xs font-medium text-gray-600 mb-1">Payment Method *</label>
              <select value={payModal.method} onChange={(e) => setPayModal({ ...payModal, method: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm">
                <option value="CASH">Cash</option>
                <option value="MOBILE_MONEY">Mobile Money</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
              </select>
            </div>
            <div className="mb-3">
              <label className="block text-xs font-medium text-gray-600 mb-1">Reference</label>
              <input value={payModal.reference} onChange={(e) => setPayModal({ ...payModal, reference: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button type="button" onClick={() => setPayModal(null)} className="px-4 py-2 border rounded-lg text-sm">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm">Record Payment</button>
            </div>
          </form>
        )}
      </Modal>
    </AdminLayout>
  );
};

export default AdminFines;
