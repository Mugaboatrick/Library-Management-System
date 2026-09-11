import React, { useEffect, useState } from 'react';
import UserLayout from '../components/layout/UserLayout';
import Modal from '../components/common/Modal';
import { bookService, ebookService, borrowService, fineService, publicUrl } from '../services';
import offlineCache from '../services/offlineCache';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const borrowLimits = { STUDENT: 3, TEACHER: 10, GUEST: 1 };
const FINE_RATE_PER_DAY = 500;

const BrowseBooks = () => {
  const { user } = useAuth();
  const [books, setBooks] = useState([]);
  const [ebooks, setEbooks] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [borrowingId, setBorrowingId] = useState(null);
  const [borrowedEbookIds, setBorrowedEbookIds] = useState(new Set());
  const [activeCount, setActiveCount] = useState(0);
  const [unpaidTotal, setUnpaidTotal] = useState(0);
  const [pending, setPending] = useState(null);
  const [loanDays, setLoanDays] = useState(14);
  const [success, setSuccess] = useState(null);
  const [payForm, setPayForm] = useState({ method: 'MOBILE_MONEY', reference: '' });
  const [paying, setPaying] = useState(false);
  const [downloadedIds, setDownloadedIds] = useState(new Set());
  const [downloadingIds, setDownloadingIds] = useState(new Set());

  const limit = borrowLimits[user?.role] || 1;
  const slotsLeft = Math.max(0, limit - activeCount);

  const loadCategories = async () => {
    try {
      const res = await bookService.categories();
      setCategories(res.data.data);
    } catch (e) {}
  };

  // E-books already saved on this device -> readable offline
  useEffect(() => {
    offlineCache.list().then(records => {
      setDownloadedIds(new Set(records.map(r => r.ebookId).filter(Boolean)));
    }).catch(() => {});
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const params = { limit: 100 };
      if (search) params.search = search;
      if (category) params.category = category;
      const [bRes, eRes, borrowRes, fineRes] = await Promise.all([
        bookService.list(params).catch(() => ({ data: { data: [] } })),
        ebookService.list({ limit: 100, search }).catch(() => ({ data: { data: [] } })),
        borrowService.mine().catch(() => ({ data: { data: [] } })),
        fineService.mine().catch(() => ({ data: { data: {}, totals: {} } }))
      ]);
      setBooks(bRes.data.data.filter(b => (b.category || '').toLowerCase() !== 'digital').map(b => ({ ...b, _type: 'physical' })));
      setEbooks(eRes.data.data.map(e => ({ ...e, _type: 'digital' })));
      const active = borrowRes.data.data.filter(b => b.status === 'BORROWED' || b.status === 'OVERDUE');
      setActiveCount(active.length);
      setUnpaidTotal(Number(fineRes.data?.totals?.unpaid || 0));
      const borrowedIds = new Set(active.filter(b => b.copy_code && b.copy_code.startsWith('EBK')).map(b => {
        const m = b.copy_code.match(/^EBK(\d+)-/);
        return m ? parseInt(m[1]) : null;
      }).filter(Boolean));
      setBorrowedEbookIds(borrowedIds);
      const subj = [...new Set(eRes.data.data.map(e => (e.subject || '').trim()).filter(Boolean))];
      setCategories(prev => [...new Set([...prev, ...subj])]);
    } catch (err) {
      toast.error('Failed to load books');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadCategories(); }, []);

  useEffect(() => {
    const timer = setTimeout(load, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, category]);

  const openBorrow = (book, isDigital) => {
    if (slotsLeft <= 0) {
      toast.warning(`Borrow limit reached (${limit}). Return books to borrow more.`);
      return;
    }
    setLoanDays(14);
    setPending({ book, isDigital });
  };

  const dueDate = (() => {
    const d = new Date();
    d.setDate(d.getDate() + loanDays);
    return d;
  })();

  const confirmBorrow = async () => {
    if (!pending || borrowingId) return;
    const { book, isDigital } = pending;
    setBorrowingId(book.id);
    try {
      const payload = isDigital
        ? { ebook_id: book.id, due_days: loanDays }
        : { user_id: user.id, book_reference: book.id, due_days: loanDays };
      const res = await borrowService.borrow(payload);
      const loan = res.data.loan?.due_date || dueDate.toISOString();
      toast.success(res.data.message);
      setPending(null);
      setSuccess({
        book,
        isDigital,
        message: res.data.message,
        copyCode: res.data.book?.copy_code,
        dueDate: loan,
        borrowCount: res.data.borrow_count,
        borrowLimit: res.data.borrow_limit
      });
      // Borrowing a digital book delivers it to this device for offline reading
      if (isDigital) downloadBook(book.id, book.title);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Borrow failed');
    } finally {
      setBorrowingId(null);
    }
  };

  const closePending = () => { setPending(null); setSuccess(null); };

  const downloadBook = async (id, title) => {
    setDownloadingIds(prev => new Set(prev).add(id));
    try {
      const token = localStorage.getItem('token');
      await offlineCache.save(id, title, `${ebookService.download(id)}?token=${token}`);
      setDownloadedIds(prev => new Set(prev).add(id));
      toast.success('Book saved to this device — readable offline');
    } catch (err) {
      toast.error(err.response?.status === 403 ? 'Not allowed to download this book' : (err.message || 'Failed to download book'));
    } finally {
      setDownloadingIds(prev => { const s = new Set(prev); s.delete(id); return s; });
    }
  };

  const handlePayFines = async (e) => {
    e.preventDefault();
    setPaying(true);
    try {
      const res = await fineService.payAll(payForm);
      toast.success(res.data.message);
      setPayForm({ method: 'MOBILE_MONEY', reference: '' });
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payment failed');
    } finally {
      setPaying(false);
    }
  };

  const allBooks = [...books, ...ebooks].filter(b => {
    if (!category) return true;
    return (b.category || '').toLowerCase() === category.toLowerCase()
        || (b.subject || '').toLowerCase() === category.toLowerCase();
  });

  return (
    <UserLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Search Books</h1>
        <p className="text-gray-500 text-sm">Browse the physical library catalog and borrow available copies</p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6 flex flex-col sm:flex-row gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by title, author, or ISBN..."
          className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="px-3 py-2 border rounded-lg">
          <option value="">All Categories</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
          {allBooks.map((book) => {
            const available = book.available || 0;
            const isBorrowing = borrowingId === book.id;
            const isDigital = book._type === 'digital';
            const isBorrowedEbook = isDigital && borrowedEbookIds.has(book.id);
            const isBorrowedPhysical = !isDigital && available <= 0;
            const isUnavailable = isDigital ? isBorrowedEbook : isBorrowedPhysical;
            return (
              <div key={`${isDigital ? 'eb' : 'bk'}-${book.id}`} className="card-hover bg-white rounded-lg border border-gray-200 overflow-hidden flex flex-col">
                {book.cover_image ? (
                  <div className="h-44 bg-slate-100 flex items-center justify-center overflow-hidden">
                    <img
                      src={publicUrl(book.cover_image)}
                      alt={book.title}
                      className="h-full w-full object-cover"
                      onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement.classList.add('bg-gradient-to-br', 'from-primary-100', 'to-blue-100'); e.currentTarget.parentElement.innerHTML = '📕'; }}
                    />
                  </div>
                ) : (
                  <div className="h-44 bg-gradient-to-br from-primary-100 to-blue-100 flex items-center justify-center text-6xl">
                    📕
                  </div>
                )}

                <div className="p-5 flex flex-col flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-gray-800">{book.title}</h3>
                    {isDigital ? (
                      <span className={`px-2 py-0.5 rounded-full text-xs shrink-0 ${
                        isBorrowedEbook ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                      }`}>
                        {isBorrowedEbook ? 'Currently borrowed' : 'Available'}
                      </span>
                    ) : (
                      <span className={`px-2 py-0.5 rounded-full text-xs shrink-0 ${
                        available > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {available > 0 ? `${available} available` : 'Unavailable'}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">{book.author || 'Unknown'}</p>

                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">{book.category || book.subject || 'General'}</span>
                    {!isDigital && book.shelf_location && <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs font-mono">{book.shelf_location}</span>}
                  </div>

                  <div className="flex-1"></div>

                  {isDigital ? (
                    isBorrowedEbook ? (
                      <button
                        onClick={() => downloadBook(book.id, book.title)}
                        disabled={downloadedIds.has(book.id) || downloadingIds.has(book.id)}
                        className={`flex-1 w-full py-2.5 rounded-lg font-medium text-sm transition ${
                          downloadedIds.has(book.id)
                            ? 'bg-emerald-50 text-emerald-600 cursor-default'
                            : 'bg-gradient-to-r from-emerald-600 to-teal-500 text-white hover:opacity-90 disabled:opacity-60'
                        }`}
                      >
                        {downloadedIds.has(book.id)
                          ? '✓ Downloaded — read offline'
                          : downloadingIds.has(book.id)
                            ? 'Downloading...'
                            : '⬇ Download to device'}
                      </button>
                    ) : (
                      <button
                        onClick={() => openBorrow(book, true)}
                        disabled={isBorrowing}
                        className={`flex-1 w-full py-2.5 rounded-lg font-medium text-sm transition ${
                          !isBorrowedEbook
                            ? 'bg-gradient-to-r from-primary-600 to-blue-500 text-white hover:opacity-90'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        {isBorrowing ? 'Borrowing...' : 'Borrow'}
                      </button>
                    )
                  ) : (
                    <button
                      onClick={() => openBorrow(book, false)}
                      disabled={isUnavailable || isBorrowing}
                      className={`mt-4 w-full py-2.5 rounded-lg font-medium text-sm transition ${
                        !isUnavailable
                          ? 'bg-gradient-to-r from-primary-600 to-blue-500 text-white hover:opacity-90'
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {isBorrowing ? 'Borrowing...' : isUnavailable ? 'Not available' : 'Borrow this book'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          {allBooks.length === 0 && <div className="col-span-full text-center py-12 text-gray-400">No books found</div>}
        </div>
      )}

      {/* ===== Borrow Modal (confirm / success + pay) ===== */}
      <Modal open={!!pending || !!success} onClose={closePending} title={success ? 'Borrow Successful' : 'Confirm Borrow'}>
        {success ? (
          <div>
            <div className="flex flex-col items-center text-center mb-5">
              <span className="w-14 h-14 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-3xl mb-3 animate-bounce-soft">✓</span>
              <h4 className="font-bold text-gray-800">{success.book.title}</h4>
              <p className="text-sm text-gray-500 mt-1">borrowed successfully</p>
              {success.copyCode && <span className="mt-2 px-3 py-1 bg-slate-100 rounded-full text-xs font-mono text-gray-600">{success.copyCode}</span>}
              <div className="mt-4 bg-slate-50 rounded-xl px-5 py-3 w-full">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Return by</span>
                  <span className="font-semibold text-gray-800">
                    {new Date(success.dueDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                    {' '}
                    {new Date(success.dueDate).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="flex justify-between text-sm mt-2">
                  <span className="text-gray-600">Borrow count</span>
                  <span className="font-semibold text-gray-800">{success.borrowCount} / {success.borrowLimit}</span>
                </div>
                {success.isDigital && (
                  <div className={`mt-3 px-3 py-2 rounded-lg text-xs flex items-center gap-2 ${
                    downloadedIds.has(success.book.id) ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'
                  }`}>
                    {downloadedIds.has(success.book.id)
                      ? '✓ Downloaded to this device — readable offline'
                      : '⬇ Saving book to this device — readable offline'}
                  </div>
                )}
              </div>
            </div>

            {unpaidTotal > 0 ? (
              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-3">
                  <h5 className="font-semibold text-gray-800">💰 Pay Outstanding Fines</h5>
                  <span className="text-sm font-bold text-red-600">{unpaidTotal} RWF</span>
                </div>
                <form onSubmit={handlePayFines} className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Payment Method *</label>
                    <select
                      value={payForm.method}
                      onChange={(e) => setPayForm({ ...payForm, method: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
                    >
                      <option value="CASH">Cash</option>
                      <option value="MOBILE_MONEY">Mobile Money</option>
                      <option value="BANK_TRANSFER">Bank Transfer</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Reference (optional)</label>
                    <input
                      value={payForm.reference}
                      onChange={(e) => setPayForm({ ...payForm, reference: e.target.value })}
                      placeholder="e.g. MoMo transaction ID"
                      className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={closePending}
                      className="flex-1 py-2.5 rounded-lg border border-gray-300 text-gray-600 text-sm font-medium hover:bg-gray-50 transition"
                    >
                      Later
                    </button>
                    <button
                      type="submit"
                      disabled={paying}
                      className="flex-1 py-2.5 rounded-lg bg-gradient-to-r from-green-600 to-emerald-500 text-white text-sm font-medium hover:opacity-90 transition disabled:opacity-60"
                    >
                      {paying ? 'Paying...' : `Pay ${unpaidTotal} RWF`}
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="border-t pt-4 flex justify-end">
                <button onClick={closePending} className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-primary-600 to-blue-500 text-white text-sm font-medium hover:opacity-90 transition">
                  Done
                </button>
              </div>
            )}
          </div>
        ) : pending && (
          <div>
            <div className="flex gap-4 mb-5">
              <div className="w-20 h-28 rounded-lg overflow-hidden bg-gradient-to-br from-primary-100 to-blue-100 flex items-center justify-center shrink-0">
                {pending.book.cover_image ? (
                  <img
                    src={publicUrl(pending.book.cover_image)}
                    alt={pending.book.title}
                    className="w-full h-full object-cover"
                    onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement.textContent = '📕'; }}
                  />
                ) : <span className="text-3xl">📕</span>}
              </div>
              <div className="min-w-0">
                <h4 className="font-semibold text-gray-800 text-sm">{pending.book.title}</h4>
                <p className="text-xs text-gray-500 mt-0.5">{pending.book.author || 'Unknown'}</p>
                <span className="inline-block mt-1.5 px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                  {pending.isDigital ? 'Digital' : 'Physical'}
                </span>
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 mb-5 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Loan duration</span>
                <select
                  value={loanDays}
                  onChange={(e) => setLoanDays(Number(e.target.value))}
                  className="text-sm border rounded-lg px-2 py-1 focus:ring-2 focus:ring-primary-500 focus:outline-none"
                >
                  <option value={7}>7 days</option>
                  <option value={14}>14 days</option>
                  <option value={21}>21 days</option>
                  <option value={30}>30 days</option>
                </select>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Return deadline</span>
                <span className="text-sm font-semibold text-gray-800">
                  {dueDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                  {' '}
                  {dueDate.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Your borrow slots</span>
                <span className={`text-sm font-semibold ${slotsLeft <= 0 ? 'text-red-600' : slotsLeft === 1 ? 'text-amber-600' : 'text-emerald-600'}`}>
                  {activeCount} / {limit} used — {slotsLeft} left
                </span>
              </div>

              <div className="border-t pt-3 flex items-start gap-2">
                <span className="text-amber-500 mt-0.5">⚠</span>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Late returns incur a fine of <strong>{FINE_RATE_PER_DAY} RWF per day</strong> overdue.
                  Please return this book on or before the deadline above.
                </p>
              </div>
            </div>

            {unpaidTotal > 0 && (
              <div className="mb-5 rounded-xl border-2 border-red-200 bg-red-50 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h5 className="font-semibold text-red-700 flex items-center gap-2">🔒 Pay outstanding fines to borrow</h5>
                  <span className="text-sm font-bold text-red-600">{unpaidTotal} RWF</span>
                </div>
                <p className="text-xs text-red-600/80 mb-3">Borrowing is blocked until your outstanding fines are paid.</p>
                <form onSubmit={handlePayFines} className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Payment Method *</label>
                    <select
                      value={payForm.method}
                      onChange={(e) => setPayForm({ ...payForm, method: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-primary-500 focus:outline-none"
                    >
                      <option value="CASH">Cash</option>
                      <option value="MOBILE_MONEY">Mobile Money</option>
                      <option value="BANK_TRANSFER">Bank Transfer</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Reference (optional)</label>
                    <input
                      value={payForm.reference}
                      onChange={(e) => setPayForm({ ...payForm, reference: e.target.value })}
                      placeholder="e.g. MoMo transaction ID"
                      className="w-full px-3 py-2 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-primary-500 focus:outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={paying}
                    className="w-full py-2.5 rounded-lg bg-gradient-to-r from-green-600 to-emerald-500 text-white text-sm font-medium hover:opacity-90 transition disabled:opacity-60"
                  >
                    {paying ? 'Paying...' : `Pay ${unpaidTotal} RWF & Continue`}
                  </button>
                </form>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={closePending}
                className="flex-1 py-2.5 rounded-lg border border-gray-300 text-gray-600 text-sm font-medium hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmBorrow}
                disabled={borrowingId === pending.book.id || slotsLeft <= 0 || unpaidTotal > 0}
                className={`flex-1 py-2.5 rounded-lg text-white text-sm font-medium transition ${
                  slotsLeft <= 0 || unpaidTotal > 0
                    ? 'bg-gray-300 cursor-not-allowed'
                    : borrowingId === pending.book.id
                      ? 'bg-primary-400'
                      : 'bg-gradient-to-r from-primary-600 to-blue-500 hover:opacity-90'
                }`}
              >
                {borrowingId === pending.book.id
                  ? 'Borrowing...'
                  : unpaidTotal > 0
                    ? 'Pay fines to continue'
                    : 'Confirm Borrow'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </UserLayout>
  );
};

export default BrowseBooks;