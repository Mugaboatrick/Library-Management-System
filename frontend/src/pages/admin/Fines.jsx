import React, { useEffect, useMemo, useState } from 'react';
import AdminLayout from '../../components/layout/AdminLayout';
import Modal from '../../components/common/Modal';
import { fineService } from '../../services';
import { toast } from 'react-toastify';

const statusColors = {
  UNPAID: 'bg-red-50 text-red-700 ring-1 ring-red-100',
  PAID: 'bg-green-50 text-green-700 ring-1 ring-green-100',
  WAIVED: 'bg-gray-100 text-gray-600 ring-1 ring-gray-100'
};

// A fine is only ever raised for a late return or a book returned
// damaged/lost — never simply for borrowing a book.
const reasonLabels = {
  OVERDUE: 'Late return',
  DAMAGE: 'Damaged book',
  LOSS: 'Lost book'
};

const reasonStyles = {
  OVERDUE: 'bg-amber-50 text-amber-700 ring-1 ring-amber-100',
  DAMAGE: 'bg-orange-50 text-orange-700 ring-1 ring-orange-100',
  LOSS: 'bg-red-50 text-red-700 ring-1 ring-red-100'
};

const AdminFines = () => {
  const [fines, setFines] = useState([]);
  const [payments, setPayments] = useState([]);
  const [tab, setTab] = useState('fines');
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [payModal, setPayModal] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const params = { limit: 300 };
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
      const res = await fineService.list({ status: statusFilter || undefined, limit: 300 });
      setFines(res.data.data);
    } catch (err) { toast.error('Failed to reload'); }
  };

  const filteredFines = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return fines;
    return fines.filter((f) =>
      `${f.first_name} ${f.last_name} ${f.customer_id} ${f.email} ${f.title} ${f.copy_code} ${f.status} ${f.fine_type || ''} ${reasonLabels[f.fine_type] || ''} ${f.amount} ${f.method || ''}`
        .toLowerCase()
        .includes(q)
    );
  }, [fines, search]);

  const filteredPayments = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return payments;
    return payments.filter((p) =>
      `${p.first_name} ${p.last_name} ${p.customer_id} ${p.amount} ${p.method} ${p.reference || ''}`
        .toLowerCase()
        .includes(q)
    );
  }, [payments, search]);

  const stats = useMemo(() => {
    const unpaidTotal = fines.filter((f) => f.status === 'UNPAID').reduce((s, f) => s + (parseFloat(f.amount) || 0), 0);
    const unpaidCount = fines.filter((f) => f.status === 'UNPAID').length;
    const paidCount = fines.filter((f) => f.status === 'PAID').length;
    const waivedCount = fines.filter((f) => f.status === 'WAIVED').length;
    const collected = payments.reduce((s, p) => s + (parseFloat(p.amount) || 0), 0);
    return { unpaidTotal, unpaidCount, paidCount, waivedCount, collected };
  }, [fines, payments]);

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
          <h1 className="text-3xl sm:text-4xl font-bold text-[#2d6f2d]">Fines &amp; Payments</h1>
          <p className="text-[#2d6f2d]/80 text-base mt-1">Automatic fine management</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setTab('fines')} className={`px-3 py-2 rounded-lg text-sm ${tab === 'fines' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600'}`}>Fines</button>
          <button onClick={() => setTab('payments')} className={`px-3 py-2 rounded-lg text-sm ${tab === 'payments' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600'}`}>Payments</button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-4 py-3 relative overflow-hidden">
          <div className="absolute inset-y-0 left-0 w-1 bg-red-400"></div>
          <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Unpaid</p>
          <p className="text-2xl font-bold text-red-600">{stats.unpaidCount}</p>
          <p className="text-xs text-gray-500">{stats.unpaidTotal.toLocaleString()} RWF outstanding</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-4 py-3 relative overflow-hidden">
          <div className="absolute inset-y-0 left-0 w-1 bg-green-400"></div>
          <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Paid</p>
          <p className="text-2xl font-bold text-green-600">{stats.paidCount}</p>
          <p className="text-xs text-gray-500">settled fines</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-4 py-3 relative overflow-hidden">
          <div className="absolute inset-y-0 left-0 w-1 bg-gray-400"></div>
          <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Waived</p>
          <p className="text-2xl font-bold text-gray-600">{stats.waivedCount}</p>
          <p className="text-xs text-gray-500">fines forgiven</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-4 py-3 relative overflow-hidden">
          <div className="absolute inset-y-0 left-0 w-1 bg-primary-500"></div>
          <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Collected</p>
          <p className="text-2xl font-bold text-primary-700">{stats.collected.toLocaleString()} RWF</p>
          <p className="text-xs text-gray-500">from payments</p>
        </div>
      </div>

      {/* Research / search bar */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-3 mb-6 flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={tab === 'fines' ? 'Search any fine, customer, book, copy code...' : 'Search any payment, customer, reference...'}
            className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        {tab === 'fines' && (
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500">
            <option value="">All Status</option>
            <option value="UNPAID">Unpaid</option>
            <option value="PAID">Paid</option>
            <option value="WAIVED">Waived</option>
          </select>
        )}
      </div>

      {tab === 'fines' ? (
        <>
          {loading ? (
            <div className="text-center py-12 text-gray-500">Loading...</div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="relative px-5 py-4 bg-gradient-to-r from-red-50 to-rose-50/60 border-b border-red-100">
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <h2 className="font-bold text-gray-800">Fine Records</h2>
                    <p className="text-xs text-gray-500">{search ? `Results for "${search}"` : 'All fines applied to members'}</p>
                  </div>
                  <span className="px-2.5 py-1 bg-white ring-1 ring-red-200 text-red-700 rounded-full text-xs font-semibold">{filteredFines.length} fines</span>
                </div>
              </div>
              <div className="table-wrap">
                <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Customer</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Book</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Reason</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Amount</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Overdue Days</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Date</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredFines.map((f) => (
                    <tr key={f.id} className="hover:bg-red-50/40 transition">
                      <td className="px-4 py-3">
                        <div className="font-medium">{f.first_name} {f.last_name}</div>
                        <div className="text-xs text-gray-400 font-mono">{f.customer_id}</div>
                      </td>
                      <td className="px-4 py-3">{f.title || '-'} {f.copy_code ? <span className="font-mono text-xs text-gray-400">({f.copy_code})</span> : ''}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${reasonStyles[f.fine_type] || reasonStyles.OVERDUE}`}>
                          {reasonLabels[f.fine_type] || reasonLabels.OVERDUE}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-red-700">{f.amount} RWF</td>
                      <td className="px-4 py-3">{f.days_overdue}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs ${statusColors[f.status]}`}>{f.status}</span>
                      </td>
                      <td className="px-4 py-3 text-xs">{new Date(f.created_at).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        {f.status === 'UNPAID' && (
                          <div className="flex gap-2">
                            <button onClick={() => setPayModal({ fineId: f.id, amount: f.amount, method: 'CASH', reference: '' })} className="px-2 py-1 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 transition">Pay</button>
                            <button onClick={() => handleWaive(f.id)} className="px-2 py-1 bg-gray-200 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-300 transition">Waive</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                  {filteredFines.length === 0 && <tr><td colSpan="8" className="text-center py-10 text-gray-400">{search ? 'No fines match your search' : 'No fines found'}</td></tr>}
                </tbody>
              </table>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="relative px-5 py-4 bg-gradient-to-r from-green-50 to-emerald-50/60 border-b border-green-100">
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <h2 className="font-bold text-gray-800">Payment Records</h2>
                <p className="text-xs text-gray-500">{search ? `Results for "${search}"` : 'All payments collected'}</p>
              </div>
              <span className="px-2.5 py-1 bg-white ring-1 ring-green-200 text-green-700 rounded-full text-xs font-semibold">{filteredPayments.length} payments</span>
            </div>
          </div>
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
              {filteredPayments.map((p) => (
                <tr key={p.id} className="hover:bg-green-50/40 transition">
                  <td className="px-4 py-3">{p.first_name} {p.last_name} <span className="text-xs text-gray-400 font-mono">({p.customer_id})</span></td>
                  <td className="px-4 py-3 font-semibold text-green-700">{p.amount} RWF</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 bg-gray-50 text-gray-700 ring-1 ring-gray-200 rounded-md text-xs font-medium">{p.method}</span>
                  </td>
                  <td className="px-4 py-3 text-xs font-mono">{p.reference || '-'}</td>
                  <td className="px-4 py-3 text-xs">{new Date(p.paid_at).toLocaleString()}</td>
                </tr>
              ))}
              {filteredPayments.length === 0 && <tr><td colSpan="5" className="text-center py-10 text-gray-400">{search ? 'No payments match your search' : 'No payments yet'}</td></tr>}
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
