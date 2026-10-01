import React, { useEffect, useMemo, useRef, useState } from 'react';
import UserLayout from '../components/layout/UserLayout';
import Modal from '../components/common/Modal';
import { bookService, ebookService, borrowService, fineService, categoryService, publicUrl } from '../services';
import offlineCache from '../services/offlineCache';
import { authStorage } from '../services/authStorage';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import SubjectCover from '../components/common/SubjectCover';
import { accessModeBadge, accessModeInfo, canBorrowEbook } from '../utils/ebookAccess';
import { BarcodeFormat } from '@zxing/library';

const borrowLimits = { STUDENT: 3, TEACHER: 10, GUEST: 1 };

const BrowseBooks = () => {
  const { user } = useAuth();
  const [books, setBooks] = useState([]);
  const [ebooks, setEbooks] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [section, setSection] = useState('');
  const [sections, setSections] = useState([]);
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

  // "My Borrowed Books" view
  const [tab, setTab] = useState('browse');
  const [myLoans, setMyLoans] = useState([]);
  const [loanFilter, setLoanFilter] = useState('ALL');
  const [loanSearch, setLoanSearch] = useState('');
  const [returnTarget, setReturnTarget] = useState(null);
  const [returningId, setReturningId] = useState(null);

  // QR scanner state (for self-identification — the member's own card)
  const [Html5QrcodePlugin, setHtml5QrcodePlugin] = useState(null);
  const [scannerActive, setScannerActive] = useState(false);
  const [cameraStarting, setCameraStarting] = useState(false);
  const scanTargetRef = useRef(null);
  const scannerInstanceRef = useRef(null);
  const [customerId, setCustomerId] = useState('');
  const [customerFound, setCustomerFound] = useState(false);
  const [cardScanned, setCardScanned] = useState(false);

  const limit = borrowLimits[user?.role] || 1;
  const slotsLeft = Math.max(0, limit - activeCount);

  const loadCategories = async () => {
    try {
      const [catRes, secRes, managedRes] = await Promise.all([
        bookService.categories(),
        bookService.sections().catch(() => ({ data: { data: [] } })),
        categoryService.categories().catch(() => ({ data: { data: [] } }))
      ]);
      const managed = (managedRes.data.data || []).map(c => c.name);
      const existing = catRes.data.data || [];
      setCategories([...new Set([...managed, ...existing])]);
      setSections(secRes.data.data || []);
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
      if (section) params.section = section;
      const [bRes, eRes, borrowRes, fineRes] = await Promise.all([
        bookService.list(params).catch(() => ({ data: { data: [] } })),
        ebookService.list({ limit: 100, search, section }).catch(() => ({ data: { data: [] } })),
        borrowService.mine().catch(() => ({ data: { data: [] } })),
        fineService.mine().catch(() => ({ data: { data: {}, totals: {} } }))
      ]);
      setBooks(bRes.data.data.filter(b => (b.category || '').toLowerCase() !== 'digital').map(b => ({ ...b, _type: 'physical' })));
      setEbooks(eRes.data.data.map(e => ({ ...e, _type: 'digital' })));
      const loans = borrowRes.data.data || [];
      setMyLoans(loans);
      const active = loans.filter(b => b.status === 'BORROWED' || b.status === 'OVERDUE');
      setActiveCount(active.length);
      setUnpaidTotal(Number(fineRes.data?.totals?.unpaid || 0));
      const borrowedIds = new Set(active.filter(b => b.copy_code && b.copy_code.startsWith('EBK')).map(b => {
        const m = b.copy_code.match(/^EBK(\d+)-/);
        return m ? parseInt(m[1]) : null;
      }).filter(Boolean));
      setBorrowedEbookIds(borrowedIds);
      const ebSecs = [...new Set(eRes.data.data.map(e => (e.section || e.subject || '').trim()).filter(Boolean))];
      setSections(prev => [...new Set([...prev, ...ebSecs])]);
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
  }, [search, category, section]);

  const openBorrow = (book, isDigital) => {
    if (slotsLeft <= 0) {
      toast.warning(`Borrow limit reached (${limit}). Return books to borrow more.`);
      return;
    }
    setLoanDays(14);
    setCustomerId('');
    setCustomerFound(false);
    setCardScanned(false);
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

    if (!cardScanned) {
      toast.warning('Scan your member QR card first, then confirm the borrow.');
      return;
    }

    setBorrowingId(book.id);
    try {
      const payload = isDigital
        ? { ebook_id: book.id, due_days: loanDays }
        : { user_id: user.id, book_reference: book.id, due_days: loanDays };
      const res = await borrowService.borrow(payload);
      const isRequest = !isDigital;
      const loan = isRequest ? null : (res.data.loan?.due_date || dueDate.toISOString());
      toast.success(res.data.message);
      setPending(null);
      setSuccess({
        book,
        isDigital,
        isRequest,
        message: res.data.message,
        copyCode: res.data.book?.copy_code,
        dueDate: loan,
        borrowCount: res.data.borrow_count,
        pendingCount: res.data.pending_count,
        borrowLimit: res.data.borrow_limit
      });
      // Borrowing a digital book delivers it to this device for offline reading (READ_ONLY can't be borrowed anyway)
      if (isDigital && book.access_mode !== 'READ_ONLY') downloadBook(book.id, book.title);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Borrow failed');
    } finally {
      setBorrowingId(null);
    }
  };

  const closePending = () => { setPending(null); setSuccess(null); setScannerActive(false); setCustomerId(''); setCustomerFound(false); setCardScanned(false); };

  useEffect(() => {
    import('html5-qrcode').then(m => setHtml5QrcodePlugin(() => m.Html5Qrcode)).catch(() => setScannerActive(false));
    return () => {
      if (scannerInstanceRef.current) {
        try { scannerInstanceRef.current.stop().catch(() => {}); } catch {}
      }
    };
  }, []);

  useEffect(() => {
    if (!scannerActive) return;
    setCameraStarting(true);
    if (!Html5QrcodePlugin) return;
    if (!window.isSecureContext) {
      toast.error('Camera access requires HTTPS or localhost. Use manual entry.');
      setCameraStarting(false);
      setScannerActive(false);
      return;
    }
    try { localStorage.removeItem('Html5Qrcode_lastUsedCameraId'); } catch {}
    const constraintsList = [
      { facingMode: 'environment' },
      {}
    ];
    // Resolve the format from the library's enum by NAME. The previous
    // hardcoded [0] was ZXing's AZTEC, not QR_CODE (which is 11), so this
    // scanner was never actually looking for the member card's QR symbol.
    const formatsToSupport = [BarcodeFormat.QR_CODE].filter((n) => n != null);
    const scanConfig = {
      fps: 20,
      experimentalFeatures: { useBarCodeDetectorIfSupported: true },
      videoConstraints: { width: { ideal: 1280 }, height: { ideal: 720 } },
      qrbox: (w, h) => ({ width: Math.round(w * 0.85), height: Math.round(h * 0.85) }),
      formatsToSupport
    };

    let scanner = null;
    let started = false;
    let lastError = null;
    let cancelled = false;

    (async () => {
      // Let the sized viewport paint before start(), otherwise html5-qrcode
      // measures it while still 0x0 and the camera produces no frames.
      await new Promise((r) => setTimeout(r, 150));
      if (cancelled) return;
      for (const constraints of constraintsList) {
        if (cancelled) return;
        const el = document.getElementById('qr-reader-browse');
        if (el) el.innerHTML = '';
        scanner = new Html5QrcodePlugin('qr-reader-browse');
        scannerInstanceRef.current = scanner;
        try {
          const s = await scanner.start(constraints, scanConfig, (decodedText) => {
            stopScanner();
            applyScannedCustomerId(decodedText);
          }, () => {});
          if (s !== false) {
            started = true;
            break;
          }
        } catch (err) {
          lastError = err;
          console.warn('Camera attempt failed:', constraints, err);
          try { await scanner.stop(); } catch (e) {}
          try { scanner.clear(); } catch (e) {}
          scannerInstanceRef.current = null;
        }
      }
      if (started) {
        setCameraStarting(false);
      } else {
        console.error(lastError);
        toast.error('Unable to access camera. Check permissions or use manual entry.');
        setCameraStarting(false);
        setScannerActive(false);
      }
    })();

    return () => {
      cancelled = true;
      if (scannerInstanceRef.current) {
        try {
          scannerInstanceRef.current.stop()
            .then(() => scannerInstanceRef.current.clear())
            .catch(() => {});
        } catch {}
        scannerInstanceRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scannerActive, Html5QrcodePlugin]);

  const startScanner = () => {
    scanTargetRef.current = 'customer';
    setCameraStarting(true);
    setScannerActive(true);
  };

  const stopScanner = () => {
    if (scannerInstanceRef.current) {
      try { scannerInstanceRef.current.stop().then(() => { scannerInstanceRef.current.clear(); }).catch(() => {}); } catch {}
      scannerInstanceRef.current = null;
    }
    setCameraStarting(false);
    setScannerActive(false);
    scanTargetRef.current = null;
  };

  const applyScannedCustomerId = (text) => {
    let value = (text || '').trim();
    try {
      const parsed = JSON.parse(text);
      if (parsed.data && parsed.data.customer_id) value = parsed.data.customer_id;
      else if (parsed.type === 'customer' && parsed.customer_id) value = parsed.customer_id;
    } catch {
      const m = String(text).match(/Customer ID:\s*([A-Z0-9-]+)/i);
      if (m) value = m[1].trim();
    }
    const code = (value || '').toUpperCase();
    if (!code) return;
    setCustomerId(code);
    setCustomerFound(code === String(user?.customer_id || '').toUpperCase());
    if (code === String(user?.customer_id || '').toUpperCase()) {
      setCardScanned(true);
      toast.success('Card matches your account — confirmed.');
    } else {
      setCardScanned(false);
      toast.warning(`Scanned ${code}. This book will be borrowed by your account (${user?.customer_id || user?.email}).`);
    }
  };

  const downloadBook = async (id, title) => {
    setDownloadingIds(prev => new Set(prev).add(id));
    try {
      const token = authStorage.getToken();
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

  const allBooks = (() => {
    const combined = [...ebooks, ...books].filter(b => {
      if (category) {
      const cat = category.toLowerCase();
      const isDigitalMatch = b._type === 'digital' && cat === 'digital';
      const isCatMatch = (b.category || '').toLowerCase() === cat;
      const isSubjMatch = (b.subject || '').toLowerCase() === cat;
      if (!isDigitalMatch && !isCatMatch && !isSubjMatch) return false;
    }
    if (section && (b.section || '').trim().toLowerCase() !== section.toLowerCase()) return false;
      return true;
    });
    const seen = new Set();
    const out = [];
    for (const b of combined) {
      const key = (b.title || '').trim().toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(b);
    }
    return out;
  })();

  // ---- My borrowed books ----------------------------------------------------
  // Whole days until the due date. Negative = overdue.
  const loanDaysLeft = (l) => {
    if (!l.due_date) return null;
    const due = new Date(l.due_date); due.setHours(0, 0, 0, 0);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    return Math.round((due - today) / 86400000);
  };

  const loanOverdue = (l) => l.status === 'OVERDUE' || (loanDaysLeft(l) ?? 1) < 0;

  const loanDueLabel = (l) => {
    const d = loanDaysLeft(l);
    if (d === null) return { text: 'No due date', tone: 'text-gray-400' };
    if (d < 0) {
      const n = Math.abs(d);
      return { text: `${n} day${n === 1 ? '' : 's'} overdue`, tone: 'text-red-600' };
    }
    if (d === 0) return { text: 'Due today', tone: 'text-amber-600' };
    if (d === 1) return { text: 'Due tomorrow', tone: 'text-amber-600' };
    if (d <= 3) return { text: `Due in ${d} days`, tone: 'text-amber-600' };
    return { text: `${d} days left`, tone: 'text-gray-500' };
  };

  const myActiveLoans = useMemo(
    () => myLoans.filter(l => l.status === 'BORROWED' || l.status === 'OVERDUE'),
    [myLoans]
  );
  const myOverdueCount = useMemo(() => myActiveLoans.filter(loanOverdue).length, [myActiveLoans]);
  const myDueSoonCount = useMemo(
    () => myActiveLoans.filter((l) => { const d = loanDaysLeft(l); return d !== null && d >= 0 && d <= 3; }).length,
    [myActiveLoans]
  );
  const myLoanHistory = useMemo(
    () => myLoans.filter(l => l.status === 'RETURNED').slice(0, 15),
    [myLoans]
  );

  const visibleMyLoans = useMemo(() => {
    const q = loanSearch.trim().toLowerCase();
    return myActiveLoans
      .filter((l) => {
        if (loanFilter === 'OVERDUE' && !loanOverdue(l)) return false;
        if (loanFilter === 'DUE_SOON') {
          const d = loanDaysLeft(l);
          if (d === null || d < 0 || d > 3) return false;
        }
        if (!q) return true;
        return [l.title, l.copy_code].filter(Boolean).some((v) => String(v).toLowerCase().includes(q));
      })
      .sort((a, b) => new Date(a.due_date || 0) - new Date(b.due_date || 0));
  }, [myActiveLoans, loanSearch, loanFilter]);

  const isDigitalLoan = (l) => String(l.copy_code || '').toUpperCase().startsWith('EBK');

  const confirmReturnBook = async () => {
    if (!returnTarget || returningId) return;

    // Hard copies are completed by the librarian scanning the book. The server
    // rejects this too; this guard just avoids a pointless round trip.
    if (!isDigitalLoan(returnTarget)) {
      toast.info('Return this book at the library desk — a librarian scans it to complete the return.');
      setReturnTarget(null);
      return;
    }

    setReturningId(returnTarget.id);
    try {
      const res = await borrowService.returnMyBook({ copy_code: returnTarget.copy_code });
      if (res.data.fine) {
        toast.warning(`Returned with a fine of ${res.data.fine.amount} RWF (${res.data.fine.days_overdue} overdue days). Pay it to borrow again.`);
      } else {
        toast.success(res.data.message);
      }
      setReturnTarget(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Return failed');
    } finally {
      setReturningId(null);
    }
  };

  return (
    <UserLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Borrow Books</h1>
        <p className="text-gray-500 text-sm">Browse every book in our library. Borrow a <span className="text-amber-700 font-medium">Hard Copy</span> and pick it up from the library, or borrow a <span className="text-indigo-600 font-medium">Digital E-Book</span> to read it here on the system.</p>
      </div>

      {/* Tabs: browse the catalogue, or manage what you already have on loan */}
      <div className="flex flex-wrap gap-2 mb-5 border-b border-gray-200">
        <button
          onClick={() => setTab('browse')}
          className={`px-4 py-2.5 text-sm font-semibold rounded-t-lg border-b-2 -mb-px transition ${
            tab === 'browse'
              ? 'border-primary-600 text-primary-700 bg-white'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          Browse Books
        </button>
        <button
          onClick={() => setTab('borrowed')}
          className={`px-4 py-2.5 text-sm font-semibold rounded-t-lg border-b-2 -mb-px transition flex items-center gap-2 ${
            tab === 'borrowed'
              ? 'border-primary-600 text-primary-700 bg-white'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          My Borrowed Books
          {myActiveLoans.length > 0 && (
            <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
              myOverdueCount > 0 ? 'bg-red-100 text-red-700' : 'bg-primary-100 text-primary-700'
            }`}>
              {myActiveLoans.length}
            </span>
          )}
        </button>
      </div>

      {tab === 'borrowed' ? (
        <div className="space-y-5">
          {/* Summary strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Borrowed</p>
              <p className="text-2xl font-bold text-gray-800">{myActiveLoans.length}</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Slots used</p>
              <p className={`text-2xl font-bold ${slotsLeft <= 0 ? 'text-red-600' : 'text-emerald-600'}`}>{activeCount} / {limit}</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Overdue</p>
              <p className={`text-2xl font-bold ${myOverdueCount > 0 ? 'text-red-600' : 'text-gray-800'}`}>{myOverdueCount}</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Unpaid fines</p>
              <p className={`text-2xl font-bold ${unpaidTotal > 0 ? 'text-red-600' : 'text-gray-800'}`}>{unpaidTotal}</p>
            </div>
          </div>

          {myOverdueCount > 0 && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              You have {myOverdueCount} overdue book{myOverdueCount === 1 ? '' : 's'}. Please return
              {myOverdueCount === 1 ? ' it' : ' them'} to the library to avoid extra fines.
            </div>
          )}

          {/* Borrowed list */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="px-5 py-3 border-b border-gray-100 flex flex-wrap items-center gap-3">
              <div className="flex-1 min-w-0">
                <h2 className="font-bold text-gray-800">Books I have borrowed</h2>
                <p className="text-xs text-gray-500">Check what is still out on loan</p>
              </div>
              <span className="px-2.5 py-1 bg-primary-50 text-primary-700 rounded-full text-xs font-semibold">
                {activeCount} / {limit} slots used
              </span>
            </div>

            {/* Hard copies can only be given back at the desk. */}
            {visibleMyLoans.some((l) => !isDigitalLoan(l)) && (
              <div className="px-5 py-2.5 bg-amber-50 border-b border-amber-100 flex items-start gap-2">
                <span className="text-amber-600 text-sm leading-none mt-0.5">i</span>
                <p className="text-xs text-amber-800 leading-relaxed">
                  Hard copies must be returned at the library desk. A librarian scans the book to
                  complete the return — until it is scanned the book stays marked as borrowed.
                </p>
              </div>
            )}

            <div className="px-4 py-3 border-b border-gray-100 space-y-2.5">
              <input
                value={loanSearch}
                onChange={(e) => setLoanSearch(e.target.value)}
                placeholder="Search your borrowed books by title or copy code..."
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
              />
              <div className="flex flex-wrap gap-1.5">
                {[
                  { key: 'ALL', label: `All (${myActiveLoans.length})` },
                  { key: 'OVERDUE', label: `Overdue (${myOverdueCount})` },
                  { key: 'DUE_SOON', label: `Due soon (${myDueSoonCount})` }
                ].map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setLoanFilter(t.key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                      loanFilter === t.key
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
                {loanSearch && (
                  <button
                    onClick={() => { setLoanSearch(''); setLoanFilter('ALL'); }}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-500 hover:bg-gray-100 transition"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {visibleMyLoans.length === 0 ? (
              <div className="px-4 py-12 text-center text-sm text-gray-400">
                {myActiveLoans.length === 0
                  ? 'You have no books borrowed right now. Browse the catalogue to borrow one.'
                  : 'No borrowed books match this search or filter.'}
                {myActiveLoans.length === 0 && (
                  <button
                    onClick={() => setTab('browse')}
                    className="mt-3 block mx-auto px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition"
                  >
                    Browse Books
                  </button>
                )}
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {visibleMyLoans.map((l) => {
                  const due = loanDueLabel(l);
                  const over = loanOverdue(l);
                  return (
                    <li key={l.id} className={`px-5 py-4 flex flex-wrap sm:flex-nowrap items-center gap-3 ${over ? 'bg-red-50/40' : ''}`}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-gray-800">{l.title}</p>
                          {isDigitalLoan(l) && (
                            <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded text-[10px] font-semibold">Digital E-Book</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Copy <span className="font-mono">{l.copy_code}</span>
                          {' · borrowed '}
                          {new Date(l.borrow_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Due{' '}
                          {new Date(l.due_date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                          {' · '}
                          <span className={`font-semibold ${due.tone}`}>{due.text}</span>
                        </p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${over ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                        {over ? 'OVERDUE' : l.status}
                      </span>
                      {isDigitalLoan(l) ? (
                        <button
                          onClick={() => setReturnTarget(l)}
                          className="px-4 py-2 bg-primary-600 text-white rounded-lg text-xs font-semibold hover:bg-primary-700 transition whitespace-nowrap shrink-0"
                        >
                          Return this e-book
                        </button>
                      ) : (
                        // A hard copy stays on loan until a librarian scans it.
                        <span className="px-3 py-2 text-[11px] leading-tight text-gray-500 bg-gray-50 border border-gray-200 rounded-lg whitespace-nowrap shrink-0 max-w-[190px]">
                          Return at the library desk — a librarian scans the book
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Recent returned */}
          {myLoanHistory.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="px-5 py-3 border-b border-gray-100">
                <h2 className="font-bold text-gray-800">Recently returned</h2>
                <p className="text-xs text-gray-500">Books you have already given back</p>
              </div>
              <ul className="divide-y divide-gray-100">
                {myLoanHistory.map((l) => (
                  <li key={`h-${l.id}`} className="px-5 py-3 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-700 truncate">{l.title}</p>
                      <p className="text-xs text-gray-400 font-mono truncate">{l.copy_code}</p>
                    </div>
                    {Number(l.applied_fine) > 0 ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700 shrink-0">
                        Fine {l.applied_fine} RWF
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 shrink-0">Returned</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : (
        <>
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
        <select value={section} onChange={(e) => setSection(e.target.value)} className="px-3 py-2 border rounded-lg">
          <option value="">All Sections</option>
          {sections.map((s) => <option key={s} value={s}> {s}</option>)}
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
                      onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement.classList.add('bg-gradient-to-br', 'from-primary-100', 'to-blue-100'); e.currentTarget.parentElement.innerHTML = ''; }}
                    />
                  </div>
                ) : (
                  <SubjectCover subject={book.subject || book.category} grade={book.grade_level} title={book.author} />
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
                    {isDigital ? (
                      <>
                        <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded text-xs font-medium"> Digital E-Book</span>
                        {(() => { const b = accessModeBadge(book.access_mode); return (
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${b.className}`} title={b.hint}>{b.label}</span>
                        ); })()}
                        {book.qr_code ? (
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-xs font-mono" title="Book QR code">QR: {book.qr_code}</span>
                        ) : (
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-xs">No QR</span>
                        )}
                      </>
                    ) : (
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-xs font-medium"> Hard Copy</span>
                    )}
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">{book.category || book.subject || 'General'}</span>
                    {book.section && <span className="px-2 py-0.5 bg-violet-100 text-violet-700 rounded text-xs font-medium" title="Library section where this book is kept"> {book.section}</span>}
                    {!isDigital && book.shelf_location && <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs font-mono">{book.shelf_location}</span>}
                  </div>

                  {isDigital && (
                    <p className="mt-2 text-xs text-gray-500">
                      {accessModeInfo(book.access_mode).hint}
                    </p>
                  )}

                  <div className="flex-1"></div>

                  {isDigital ? (
                    isBorrowedEbook ? (
                      Number(book.is_protected) === 1 ? (
                        <span className="flex-1 w-full py-2.5 rounded-lg bg-amber-50 text-amber-700 text-center font-medium text-sm cursor-default">
                           Read online — copy & download disabled
                        </span>
                      ) : (
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
                            ? ' Downloaded — read offline'
                            : downloadingIds.has(book.id)
                              ? 'Downloading...'
                              : ' Download to device'}
                        </button>
                      )
                    ) : (
                      canBorrowEbook(book) ? (
                        <button
                          onClick={() => openBorrow(book, true)}
                          disabled={isBorrowing}
                          className="flex-1 w-full py-2.5 rounded-lg font-medium text-sm bg-gradient-to-r from-primary-600 to-blue-500 text-white hover:opacity-90 disabled:opacity-60"
                        >
                          {isBorrowing ? 'Borrowing...' : book.access_mode === 'BORROW_ONLY' ? ' Borrow to read' : 'Borrow'}
                        </button>
                      ) : (
                        <span className="flex-1 w-full py-2.5 rounded-lg bg-gray-100 text-gray-400 text-center font-medium text-sm cursor-default">
                           Read online in My E-Books
                        </span>
                      )
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
        </>
      )}

      {/* Confirm returning a book you borrowed */}
      <Modal open={!!returnTarget} onClose={() => setReturnTarget(null)} title="Return This Book">
        {returnTarget && (() => {
          const due = loanDueLabel(returnTarget);
          const over = loanOverdue(returnTarget);
          const busy = returningId === returnTarget.id;
          return (
            <div>
              <p className="text-sm text-gray-600 mb-4">
                You are returning this book. Please hand it in at the library desk so the librarian
                can check its condition.
              </p>

              <div className="bg-slate-50 rounded-xl p-4 mb-4 space-y-1.5">
                <p className="font-semibold text-gray-800 text-sm">{returnTarget.title}</p>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Copy code</span>
                  <span className="font-mono text-gray-800">{returnTarget.copy_code}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Type</span>
                  <span className="font-semibold text-gray-800">
                    {isDigitalLoan(returnTarget) ? 'Digital E-Book' : 'Hard Copy'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Due date</span>
                  <span className="font-semibold text-gray-800">
                    {new Date(returnTarget.due_date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Status</span>
                  <span className={`font-semibold ${due.tone}`}>{due.text}</span>
                </div>
              </div>

              {over ? (
                <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-800">
                  This book is overdue. A late-return fine will be added to your account and must be
                  paid before you can borrow again.
                </div>
              ) : (
                <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs text-emerald-800">
                  On time — no fine will be charged for this return.
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setReturnTarget(null)}
                  disabled={busy}
                  className="flex-1 py-2.5 rounded-lg border border-gray-300 text-gray-600 text-sm font-medium hover:bg-gray-50 transition disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmReturnBook}
                  disabled={busy}
                  className={`flex-1 py-2.5 rounded-lg text-white text-sm font-medium transition ${
                    busy ? 'bg-primary-500 cursor-wait' : 'bg-primary-600 hover:bg-primary-700'
                  }`}
                >
                  {busy ? 'Returning...' : 'Confirm Return'}
                </button>
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* ===== Borrow Modal (confirm / success + pay) ===== */}
      <Modal open={!!pending || !!success} onClose={closePending} title={success ? (success.isRequest ? 'Request Sent' : 'Borrow Successful') : 'Confirm Borrow'}>
        {success ? (
          <div>
            <div className="flex flex-col items-center text-center mb-5">
              <span className={`w-14 h-14 rounded-full ${success.isRequest ? 'bg-amber-100 text-amber-600' : 'bg-green-100 text-green-600'} flex items-center justify-center text-3xl mb-3 animate-bounce-soft`}>{success.isRequest ? '⏳' : ''}</span>
              <h4 className="font-bold text-gray-800">{success.book.title}</h4>
              <p className="text-sm text-gray-500 mt-1">{success.isRequest ? 'borrow request sent to the librarian' : 'borrowed successfully'}</p>
              {success.copyCode && <span className="mt-2 px-3 py-1 bg-slate-100 rounded-full text-xs font-mono text-gray-600">{success.copyCode}</span>}
              <div className="mt-4 bg-slate-50 rounded-xl px-5 py-3 w-full">
                {success.isRequest ? (
                  <div className="text-sm text-gray-600 space-y-2">
                    <div className="flex items-start gap-2">
                      <span className="text-amber-500 mt-0.5">⏳</span>
                      <p className="text-left text-xs leading-relaxed">
                        Your request is now waiting for the librarian to confirm it. Once approved you'll receive a notification, then you can
                        come to the library to pick up <strong>{success.book.title}</strong>.
                      </p>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Pending requests</span>
                      <span className="font-semibold text-gray-800">{success.pendingCount} / {success.borrowLimit}</span>
                    </div>
                  </div>
                ) : (
                  <>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Return by</span>
                    <span className="font-semibold text-gray-800">
                      {success.dueDate && new Date(success.dueDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm mt-2">
                    <span className="text-gray-600">Borrow count</span>
                    <span className="font-semibold text-gray-800">{success.borrowCount} / {success.borrowLimit}</span>
                  </div>
                  {success.isDigital && success.book.access_mode !== 'READ_ONLY' && (
                    <div className={`mt-3 px-3 py-2 rounded-lg text-xs flex items-center gap-2 ${
                      downloadedIds.has(success.book.id) ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'
                    }`}>
                      {downloadedIds.has(success.book.id)
                        ? ' Downloaded to this device — readable offline'
                        : ' Saving book to this device — readable offline'}
                    </div>
                  )}
                  {success.isDigital && success.book.access_mode === 'READ_ONLY' && (
                    <div className="mt-3 px-3 py-2 rounded-lg bg-amber-50 text-amber-700 text-xs">
                       This book can only be read online (in My E-Books or the reader) — copying & downloading are disabled.
                    </div>
                  )}
                  </>
                )}
              </div>
            </div>

            {unpaidTotal > 0 ? (
              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-3">
                  <h5 className="font-semibold text-gray-800"> Pay Outstanding Fines</h5>
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
                    onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement.textContent = ''; }}
                  />
                ) : <span className="text-3xl"></span>}
              </div>
              <div className="min-w-0">
                <h4 className="font-semibold text-gray-800 text-sm">{pending.book.title}</h4>
                <p className="text-xs text-gray-500 mt-0.5">{pending.book.author || 'Unknown'}</p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                <span className="inline-block px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                  {pending.isDigital ? 'Digital' : 'Physical'}
                </span>
                {pending.book.section && (
                  <span className="inline-block px-2 py-0.5 bg-violet-100 text-violet-700 rounded text-xs font-medium"> Section: {pending.book.section}</span>
                )}
                {pending.isDigital && (() => { const b = accessModeBadge(pending.book.access_mode); return (
                  <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${b.className}`}>
                    {b.label}
                  </span>
                ); })()}
                </div>
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

              <div className="border-t pt-3">
                <h4 className="font-semibold text-gray-700 mb-2"> Borrowing for</h4>
                <div className="flex gap-2">
                  <input
                    value={customerId}
                    onChange={(e) => {
                      setCustomerId(e.target.value);
                      setCustomerFound(e.target.value.trim().toUpperCase() === String(user?.customer_id || '').toUpperCase());
                    }}
                    placeholder="Scan or enter customer ID (e.g. STU0001)"
                    className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono text-sm"
                  />
                  <button
                    type="button"
                    onClick={startScanner}
                    className="px-3 py-2 bg-primary-100 text-primary-700 rounded-lg text-sm hover:bg-primary-200"
                  >
                     Scan
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-1">Scan your member QR card first, then confirm the borrow.</p>
                {customerId && (
                  <p className={`mt-1.5 text-xs ${customerFound ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {customerFound
                      ? ` ${customerId} matches your account.`
                      : ` ${customerId} is not your account — this book is borrowed by you (${user?.customer_id || user?.email}).`}
                  </p>
                )}
              </div>

              {pending.isDigital && pending.book.qr_code && (
                <div className="border-t pt-3 flex items-start gap-2">
                  <p className="text-xs text-gray-500 leading-relaxed">
                    This book's QR code <strong className="font-mono text-emerald-700">{pending.book.qr_code}</strong> is stored on your record.
                    When you come to the library, present the book — the librarian scans it and the system confirms it matches before issuing.
                  </p>
                </div>
              )}
            </div>

            {unpaidTotal > 0 && (
              <div className="mb-5 rounded-xl border-2 border-red-200 bg-red-50 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h5 className="font-semibold text-red-700 flex items-center gap-2"> Pay outstanding fines to borrow</h5>
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
                disabled={borrowingId === pending.book.id || slotsLeft <= 0 || unpaidTotal > 0 || !cardScanned}
                className={`flex-1 py-2.5 rounded-lg text-white text-sm font-medium transition ${
                  slotsLeft <= 0 || unpaidTotal > 0 || !cardScanned
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
                    : !cardScanned
                      ? 'Scan member QR to continue'
                      : 'Confirm Borrow'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* QR Scanner overlay — above any modal (z-50) so the camera is visible */}
      {scannerActive && (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-700">Scanning Member QR Card</h2>
              <button onClick={stopScanner} className="px-3 py-1 bg-red-600 text-white rounded-lg text-sm">Close</button>
            </div>
            <div
              id="qr-reader-browse"
              className="w-full overflow-hidden rounded-lg"
              style={{
                // html5-qrcode measures this element to size the camera video.
                // With no height it measures 0x0: the camera opens, but no frame
                // is ever decoded and the scan looks permanently dead. A member
                // card is a square QR, so this is a taller box than the wide,
                // short one used for 1-D book labels in Borrow.
                display: 'block',
                width: '100%',
                height: '320px',
                maxHeight: '60vh'
              }}
            />
            {cameraStarting && (
              <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
                <p className="text-sm mt-3">Starting camera…</p>
              </div>
            )}
            <p className="text-xs text-gray-400 mt-3 text-center">Point camera at your member QR code</p>
          </div>
        </div>
      )}
    </UserLayout>
  );
};

export default BrowseBooks;