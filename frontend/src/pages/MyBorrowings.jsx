import React, { useEffect, useState } from 'react';
import UserLayout from '../components/layout/UserLayout';
import Modal from '../components/common/Modal';
import { borrowService, ebookService } from '../services';
import offlineCache from '../services/offlineCache';
import { toast } from 'react-toastify';

const FINE_RATE_PER_DAY = 500;

const MyBorrowings = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [returnTarget, setReturnTarget] = useState(null);
  const [returning, setReturning] = useState(false);
  const [downloadedIds, setDownloadedIds] = useState(new Set());
  const [downloadingId, setDownloadingId] = useState(null);

  const load = async () => {
    try {
      const [res, cached] = await Promise.all([borrowService.mine(), offlineCache.list()]);
      setData(res.data.data);
      setDownloadedIds(new Set(cached.map(r => r.ebookId).filter(Boolean)));
    } catch (err) {
      toast.error('Failed to load borrowings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const overdueFor = (b) => {
    if (b.status === 'RETURNED') {
      const due = new Date(b.due_date);
      const ret = b.returned_date ? new Date(b.returned_date) : new Date();
      return Math.max(0, Math.ceil((ret - due) / 86400000));
    }
    return Number(b.current_overdue_days || Math.max(0, Math.floor((Date.now() - new Date(b.due_date).getTime()) / 86400000)));
  };

  const previewFine = (b) => {
    const days = overdueFor(b);
    return { days, amount: days * FINE_RATE_PER_DAY };
  };

  const openReturn = (b) => setReturnTarget(b);
  const closeReturn = () => { setReturnTarget(null); setReturning(false); };

  const isEbookLoan = (b) => b.copy_code && b.copy_code.startsWith('EBK');
  const ebookIdFrom = (b) => {
    const m = b.copy_code.match(/^EBK(\d+)-/);
    return m ? parseInt(m[1]) : null;
  };

  const downloadEbook = async (b) => {
    const id = ebookIdFrom(b);
    if (!id) return;
    setDownloadingId(b.id);
    try {
      const token = localStorage.getItem('token');
      await offlineCache.save(id, b.title, `${ebookService.download(id)}?token=${token}`);
      setDownloadedIds(prev => new Set(prev).add(id));
      toast.success('Book saved to this device — readable offline');
    } catch (err) {
      toast.error(err.message || 'Failed to download book');
    } finally {
      setDownloadingId(null);
    }
  };

  const confirmReturn = async () => {
    if (!returnTarget || returning) return;
    setReturning(true);
    try {
      const res = await borrowService.returnMyBook({ copy_id: returnTarget.copy_id, copy_code: returnTarget.copy_code });
      toast.success(res.data.message);
      if (res.data.fine) toast.warning(`Fine applied: ${res.data.fine.amount} RWF`);
      closeReturn();
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Return failed');
      setReturning(false);
    }
  };

  const statusBadge = (status) => {
    if (status === 'RETURNED') return <span className="px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700">Returned</span>;
    return <span className="px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700">Borrowed</span>;
  };

  const hasActive = data.some(b => b.status === 'BORROWED' || b.status === 'OVERDUE');
  const activeCount = data.filter(b => b.status === 'BORROWED' || b.status === 'OVERDUE').length;

  return (
    <UserLayout>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">My Borrowings</h1>
          <p className="text-gray-500 text-sm">Return your books here — returning frees up your borrow slots</p>
        </div>
        {hasActive && (
          <span className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
            {activeCount} active
          </span>
        )}
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading...</div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="table-wrap">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Book</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Copy</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Borrowed</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Due</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Returned</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Fine</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.map((b) => {
                const isActive = b.status === 'BORROWED' || b.status === 'OVERDUE';
                const pf = previewFine(b);
                return (
                <tr key={b.id}>
                  <td className="px-4 py-3">{b.title}</td>
                  <td className="px-4 py-3 font-mono text-xs">{b.copy_code}</td>
                  <td className="px-4 py-3 text-xs">{new Date(b.borrow_date).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-xs">{new Date(b.due_date).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-xs">{b.returned_date ? new Date(b.returned_date).toLocaleDateString() : '-'}</td>
                  <td className="px-4 py-3 text-xs">
                    {b.applied_fine > 0 ? `${b.applied_fine} RWF` : isActive && pf.days > 0 ? `${pf.amount} RWF` : '-'}
                  </td>
                  <td className="px-4 py-3">{statusBadge(b.status)}</td>
                  <td className="px-4 py-3">
                    {isActive ? (
                      <div className="flex items-center gap-2 flex-wrap">
                        {isEbookLoan(b) && !downloadedIds.has(ebookIdFrom(b)) && (
                          <button
                            onClick={() => downloadEbook(b)}
                            disabled={downloadingId === b.id}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-700 transition disabled:opacity-60"
                          >
                            {downloadingId === b.id ? 'Saving...' : '⬇ Save to device'}
                          </button>
                        )}
                        {isEbookLoan(b) && downloadedIds.has(ebookIdFrom(b)) && (
                          <span className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 text-xs font-medium">✓ Saved</span>
                        )}
                        <button
                          onClick={() => openReturn(b)}
                          className="px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs font-medium hover:bg-green-700 transition"
                        >
                          Return Book
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-300">-</span>
                    )}
                  </td>
                </tr>
                );
              })}
              {data.length === 0 && <tr><td colSpan="8" className="text-center py-8 text-gray-400">No borrowing history</td></tr>}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {/* Return confirmation modal */}
      <Modal open={!!returnTarget} onClose={closeReturn} title="Return Book">
        {returnTarget && (() => {
          const pf = previewFine(returnTarget);
          return (
            <div>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="font-semibold text-gray-800">{returnTarget.title}</h4>
                  <p className="text-xs text-gray-500 mt-0.5 font-mono">{returnTarget.copy_code}</p>
                </div>
                {pf.days > 0 ? (
                  <span className="px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-700">Overdue {pf.days}d</span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700">On time</span>
                )}
              </div>

              <div className="bg-slate-50 rounded-xl p-4 mb-5 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Borrowed</span>
                  <span className="font-medium">{new Date(returnTarget.borrow_date).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Due date</span>
                  <span className="font-medium">{new Date(returnTarget.due_date).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Overdue days</span>
                  <span className={`font-medium ${pf.days > 0 ? 'text-red-600' : 'text-emerald-600'}`}>{pf.days}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-gray-600">Estimated fine (if any)</span>
                  <span className={`font-bold ${pf.amount > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                    {pf.amount > 0 ? `${pf.amount} RWF` : '0 RWF'}
                  </span>
                </div>
              </div>

              <p className="text-xs text-gray-500 mb-5">
                Returning this book will apply any late fine to your account and will free up one of your borrow slots.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={closeReturn}
                  className="flex-1 py-2.5 rounded-lg border border-gray-300 text-gray-600 text-sm font-medium hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmReturn}
                  disabled={returning}
                  className="flex-1 py-2.5 rounded-lg bg-gradient-to-r from-green-600 to-emerald-500 text-white text-sm font-medium hover:opacity-90 transition disabled:opacity-60"
                >
                  {returning ? 'Returning...' : pf.amount > 0 ? `Return & Pay ${pf.amount} RWF` : 'Confirm Return'}
                </button>
              </div>
            </div>
          );
        })()}
      </Modal>
    </UserLayout>
  );
};

export default MyBorrowings;