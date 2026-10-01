import React, { useState, useEffect, useMemo, useRef } from 'react';
import AdminLayout from '../../components/layout/AdminLayout';
import Modal from '../../components/common/Modal';
import UserAvatar from '../../components/common/UserAvatar';
import { borrowService, bookService, ebookService, userService, publicUrl } from '../../services';
import { BarcodeFormat } from '@zxing/library';
import { toast } from 'react-toastify';

const borrowLimits = { STUDENT: 3, TEACHER: 10, GUEST: 1 };

// Every scanner target that points at a BOOK must be configured for LINEAR
// 1-D barcodes, because that is the only kind of symbol we print on a book
// label. 'customer' is the sole QR target (member cards are QR codes).
// Keeping this in one place stops the window shape and the decoder format
// from drifting apart, which silently made the confirm scan unreadable.
const BOOK_SCAN_TARGETS = ['book', 'pagebook', 'returnbook'];
const isBookScanTarget = (target) => BOOK_SCAN_TARGETS.includes(target);

// The in-modal confirm scan ('book') is the one target that is NOT fixed-format:
// it re-reads whichever symbol the book actually has. A digital e-book is
// confirmed with its stored QR, while a physical copy is confirmed with the
// printed 1-D label. Classifying every 'book' scan as linear made the digital
// confirm step impossible — the decoder was never allowed to look for a QR.
const isQrScanTarget = (target, pendingBook) => {
  if (target === 'customer') return true;
  if (target === 'book') return Boolean(pendingBook && pendingBook.isDigital);
  // 'pagebook' and 'returnbook' always point at a physical copy, so they read
  // the printed 1-D label. Anything unrecognised falls back the same way: a QR
  // is the narrower guess, and the decoder is far more likely to be pointed at a
  // book label than at a member card.
  return false;
};

const AdminBorrow = () => {
  const [form, setForm] = useState({ customer_code: '', user_id: '' });
  const [books, setBooks] = useState([]);
  const [ebooks, setEbooks] = useState([]);
  const [users, setUsers] = useState([]);
  const [activeLoans, setActiveLoans] = useState([]);
  const [customer, setCustomer] = useState(null);
  const [pending, setPending] = useState(null);
  const [loanDays, setLoanDays] = useState(14);
  const [scannedCopy, setScannedCopy] = useState(null);
  const [borrowingId, setBorrowingId] = useState(null);
  const [success, setSuccess] = useState(null);
  const [retForm, setRetForm] = useState({ copy_code: '', condition: '', condition_note: '' });
  const [pageCopyCode, setPageCopyCode] = useState('');
  const [retScan, setRetScan] = useState(null);

  // On-loan view state
  const [loanSearch, setLoanSearch] = useState('');
  const [loanFilter, setLoanFilter] = useState('ALL');
  const [quickReturn, setQuickReturn] = useState(null);
  const [quickForm, setQuickForm] = useState({ condition: '', condition_note: '' });
  const [returningId, setReturningId] = useState(null);

  // QR scanner state
  const [Html5QrcodePlugin, setHtml5QrcodePlugin] = useState(null);
  const [scannerActive, setScannerActive] = useState(false);
  const [cameraStarting, setCameraStarting] = useState(false);
  const [scannerError, setScannerError] = useState(null);
  const [scanStatus, setScanStatus] = useState('');
  const [scanTarget, setScanTarget] = useState(null);
  const scanTargetRef = useRef(null);
  // The confirm scanner must know whether the pending book is digital, because
  // that decides the symbol it is allowed to decode. Read through a ref so the
  // value is current at the moment the scanner is configured, not the value
  // captured when the effect was created.
  const pendingBookRef = useRef(null);
  pendingBookRef.current = pending;
  const scannerInstanceRef = useRef(null);

  const loadUsers = () => {
    userService.list({ limit: 300 })
      .then(res => setUsers((res.data.data || []).filter(u => u.role !== 'LIBRARIAN')))
      .catch(() => {});
  };

  const load = async () => {
    try {
      // Query BORROWED and OVERDUE separately. Fetching one big page of ALL
      // borrowings and filtering in the browser silently hid live loans once
      // returned history grew past the limit.
      const empty = { data: { data: [] } };
      const [bRes, eRes, borrowedRes, overdueRes] = await Promise.all([
        bookService.list({ limit: 300 }).catch(() => empty),
        ebookService.list({ limit: 300 }).catch(() => empty),
        borrowService.list({ status: 'BORROWED', limit: 200 }).catch(() => empty),
        borrowService.list({ status: 'OVERDUE', limit: 200 }).catch(() => empty)
      ]);
      setBooks(bRes.data.data.filter(b => (b.category || '').toLowerCase() !== 'digital').map(b => ({ ...b, _type: 'physical' })));
      setEbooks(eRes.data.data.map(e => ({ ...e, _type: 'digital' })));
      const loans = [...(borrowedRes.data.data || []), ...(overdueRes.data.data || [])];
      loans.sort((a, b) => new Date(a.due_date || 0) - new Date(b.due_date || 0));
      setActiveLoans(loans);
    } catch (err) {
      toast.error('Failed to load books');
    }
  };

  useEffect(() => {
    loadUsers();
    load();
    import('html5-qrcode').then(m => setHtml5QrcodePlugin(() => m.Html5Qrcode)).catch(() => setScannerActive(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cleanup scanner on unmount
  useEffect(() => {
    return () => {
      if (scannerInstanceRef.current) {
        try { scannerInstanceRef.current.stop().catch(() => {}); } catch {}
      }
    };
  }, []);

  // Start scanner only after the #qr-reader div is rendered
  useEffect(() => {
    if (!scannerActive) return;
    setCameraStarting(true);
    // Library not loaded yet (dynamic import is async) — keep the overlay open
    // and this effect will re-run the moment Html5QrcodePlugin becomes ready.
    if (!Html5QrcodePlugin) {
      return;
    }
    if (!window.isSecureContext) {
      toast.error('Camera access requires HTTPS or localhost. Use manual entry.');
      setCameraStarting(false);
      setScannerActive(false);
      return;
    }
    // Reset the remembered camera so a stale device ID can't break start()
    try { localStorage.removeItem('Html5Qrcode_lastUsedCameraId'); } catch {}
    const constraintsList = [
      { facingMode: 'environment' },
      {}
    ];

    // Member cards are QR only; book labels are linear 1-D barcodes. Deciding
    // per target stops the book scanner from locking onto a QR code and vice
    // versa, which is what made "Scan book barcode" feel unreliable.
    // Format ids are resolved from the library's enum by NAME. The previous
    // hardcoded numbers used ZXing's Java/Android numbering, which does not
    // match @zxing/library: EAN_13 is 7 there, not 3. EAN-13 is the
    // international ISBN barcode, so international book labels never decoded.
    // The old QR list was worse — 0 is AZTEC, not QR_CODE (11), so member cards
    // were being scanned with the wrong decoder.
    const BOOK_FORMATS = [
      BarcodeFormat.EAN_13, BarcodeFormat.EAN_8,
      BarcodeFormat.UPC_A, BarcodeFormat.UPC_E,
      BarcodeFormat.CODE_128, BarcodeFormat.CODE_39,
      BarcodeFormat.CODE_93, BarcodeFormat.ITF,
      BarcodeFormat.CODABAR, BarcodeFormat.RSS_14,
      BarcodeFormat.RSS_EXPANDED
    ].filter((n) => n != null);
    const QR_FORMATS = [BarcodeFormat.QR_CODE].filter((n) => n != null);


    const scanConfig = {
      fps: 20,
      // Native BarcodeDetector is REQUIRED here: it is the only decoder that
      // has ever read printed labels reliably (the JS decoder returns nothing
      // and the scan appears dead). High res gives it enough detail to resolve
      // small dense QRs and 1D book barcodes (member cards + book labels).
      experimentalFeatures: { useBarCodeDetectorIfSupported: true },
      videoConstraints: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        facingMode: { ideal: 'environment' }
      },
      // The scan window must suit the label shape. A member QR is square and
      // must sit inside a near-square box; a 1-D book barcode is a thin strip
      // that needs a wide, short box. Using one box for both cut whichever
      // shape did not fit, so the decoder reported nothing.
      qrbox: (w, h) => {
        const isQr = isQrScanTarget(scanTargetRef.current, pendingBookRef.current);
        return isQr
          ? { width: Math.round(w * 0.8), height: Math.round(h * 0.8) }
          : { width: Math.round(w * 0.92), height: Math.round(h * 0.32) };
      },
      // Every scanner that points at a PHYSICAL book reads LINEAR barcodes only.
      // That includes the in-modal confirm scan ('book') when the pending loan is
      // a physical copy, not just the two page scanners: it is used to
      // re-confirm the very same physical book, whose label is the printed
      // Code128. Treating it as QR-only meant the confirm step could never read
      // a book the earlier scan had just resolved.
      // A digital e-book confirm scan is the exception and must read QR, as does
      // the member card ('customer').
      formatsToSupport: isQrScanTarget(scanTargetRef.current, pendingBookRef.current)
        ? QR_FORMATS
        : BOOK_FORMATS
    };

    let scanner = null;
    let started = false;
    let lastError = null;
    let cancelled = false;

    (async () => {
      // The scanner can only mount into a #qr-reader element that is in the DOM.
      // If the overlay failed to render there is nothing to attach a camera to.
      const mount = document.getElementById('qr-reader');
      if (!mount) {
        setScannerError('Scanner view is missing. Reopen the page and try again.');
        setCameraStarting(false);
        setScannerActive(false);
        return;
      }

      // Let the sized viewport paint before start(), otherwise html5-qrcode
      // measures it while still 0x0 and the camera produces no frames.
      await new Promise((r) => setTimeout(r, 150));
      if (cancelled) return;

      for (const constraints of constraintsList) {
        if (cancelled) return;
        const el = document.getElementById('qr-reader');
        if (el) el.innerHTML = '';

        scanner = new Html5QrcodePlugin('qr-reader', { verbose: false });
        scannerInstanceRef.current = scanner;

        try {
          const s = await scanner.start(
            constraints,
            scanConfig,
            (decodedText) => {
              const target = scanTargetRef.current;
              stopScanner();
              handleDecoded(decodedText, target);
            },
            () => {}
          );
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

      if (cancelled) return;

      if (started) {
        setScannerError(null);
        setCameraStarting(false);
        const video = document.querySelector('#qr-reader video');
        const size = video ? `${video.videoWidth}x${video.videoHeight}` : 'no video';
        setScanStatus(`Camera ready (${size}) — hold the code steady inside the frame.`);
      } else {
        console.error(lastError);
        const name = lastError && lastError.name;
        const reason =
          name === 'NotAllowedError' || name === 'PermissionDeniedError'
            ? 'Camera permission was denied. Allow camera access for this site in your browser, then try again.'
            : name === 'NotFoundError' || name === 'DevicesNotFoundError'
              ? 'No camera was found on this device.'
              : name === 'NotReadableError' || name === 'TrackStartError'
                ? 'The camera is busy in another app (video call / browser tab). Close it and try again.'
                : (lastError && lastError.message)
                  ? String(lastError.message)
                  : 'Unable to access camera. Check permissions or use manual entry.';
        // Keep the overlay open so the reason stays readable and retry is possible.
        setScannerError(reason);
        toast.error(reason);
        setCameraStarting(false);
        setScanStatus('');
      }
    })();

    return () => {
      cancelled = true;
      const inst = scannerInstanceRef.current;
      scannerInstanceRef.current = null;
      if (inst) {
        try { inst.stop().then(() => inst.clear()).catch(() => {}); } catch {}
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scannerActive, Html5QrcodePlugin]);

  const startScanner = () => {
    scanTargetRef.current = 'customer';
    setScanTarget('customer');
    setCameraStarting(true);
    setScannerActive(true);
  };

  const startBookScanner = () => {
    if (!pending) return;
    scanTargetRef.current = 'book';
    setScanTarget('book');
    setCameraStarting(true);
    setScannerActive(true);
  };

  // Scan-first flow: scan the book the member brought  the system finds the
  // book (physical copy code) or matches the stored QR (digital book), then
  // jumps straight into the confirm-borrow modal.
  const startPageBookScanner = () => {
    scanTargetRef.current = 'pagebook';
    setScanTarget('pagebook');
    setCameraStarting(true);
    setScannerActive(true);
  };

  const normalizeScannedBookCode = (code) => {
    const raw = String(code || '').trim();
    if (!raw) return '';

    const digits = raw.replace(/\D+/g, '');
    if (!digits) return raw;
    if (digits.length === 10) return `978${digits}`;
    if (digits.length === 13) return digits;
    return raw;
  };

  const resolvePageBookScan = (code) => {
    const trimmed = (code || '').trim();
    if (!trimmed) return;
    const normalized = normalizeScannedBookCode(trimmed) || trimmed;

    // Physical book: copy code BOOK<id>-C<n>  look up the book by its id.
    const copyMatch = /^BOOK(\d+)-C\d+$/i.exec(trimmed);
    if (copyMatch) {
      const bookId = Number(copyMatch[1]);
      const book = books.find(b => b.id === bookId);
      if (!book) {
        toast.error(`Copy ${trimmed} scanned, but book #${bookId} was not found in the catalog.`);
        return;
      }
      openBorrowByScan(book, false, trimmed);
      return;
    }

    // Custom copy codes, printed EAN/ISBN barcodes and e-book QR codes are all
    // matched server-side so any label ever printed resolves.
    resolveScanCode(normalized)
      .then((hit) => {
        if (!hit) {
          toast.warning(`Scanned "${trimmed}" does not match any book, copy or e-book.`);
          return;
        }
        if (hit.kind === 'ebook') {
          const ebook = ebooks.find(e => e.id === hit.id) || hit.ebook;
          if (!ebook) {
            toast.error('That e-book is not in the loaded list. Reload the page and scan again.');
            return;
          }
          openBorrowByScan(ebook, true, hit.code);
          return;
        }
        const book = books.find(b => b.id === hit.book_id) || hit.book;
        if (!book) {
          toast.error('That book is not in the loaded list. Reload the page and scan again.');
          return;
        }
        openBorrowByScan(book, false, hit.copy_code);
      })
      .catch(() => toast.error('Could not look up the scanned code. Check your connection.'));
  };

  // Any scanned label is resolved by the SERVER, not by a client-side regex.
  // Client matching only understood auto-generated codes (BOOK003-C2) and an
  // isbn column that the books table does not have, so real labels (custom
  // copy codes like BK-BIOL-S1, printed EAN/ISBN, e-book QR) never resolved.
  const resolveScanCode = async (raw) => {
    const code = String(raw || '').trim();
    if (!code) return null;
    try {
      const res = await bookService.resolveScan(code);
      return res.data || null;
    } catch (err) {
      if (err.response && err.response.status === 404) return null;
      throw err;
    }
  };

  const openBorrowByScan = (book, isDigital, scannedCode) => {
    if (!customer) {
      toast.warning('Select a customer first (scan the member QR or enter their ID).');
      return;
    }
    if (isDigital && !book.qr_code) {
      toast.error(`"${book.title}" has no QR stored. Add one in E-Book Management first.`);
      return;
    }
    if (customerSlotsLeft <= 0) {
      toast.warning(`Borrow limit reached for ${customer.first_name} ${customer.last_name || ''} (${customerLimit}). Return books to borrow more.`);
      return;
    }
    setLoanDays(14);
    setScannedCopy(isDigital ? scannedCode : scannedCode || null);
    setPending({ book, isDigital });
  };

  const stopScanner = () => {
    if (scannerInstanceRef.current) {
      try { scannerInstanceRef.current.stop().then(() => { scannerInstanceRef.current.clear(); }).catch(() => {}); } catch {}
      scannerInstanceRef.current = null;
    }
    setCameraStarting(false);
    setScannerActive(false);
    setScannerError(null);
    setScanStatus('');
    scanTargetRef.current = null;
    setScanTarget(null);
  };

  // Resolve a customer from a QR code by exact customer_id.
  // Fast path: already in the currently-loaded page of users.
  // Fallback: exact server-side lookup by customer_id so a scan resolves even
  // when the member is far down a large user base (not just the first 300).
  const resolveCustomer = async (code) => {
    const trimmed = (code || '').trim().toUpperCase();
    if (!trimmed) { setCustomer(null); return; }
    const local = users.find(u => String(u.customer_id || '').toUpperCase() === trimmed);
    if (local) { setCustomer(local); return; }
    try {
      const res = await userService.list({ search: trimmed, limit: 1 });
      const exact = (res.data?.data || []).find(u => String(u.customer_id || '').toUpperCase() === trimmed);
      if (exact && exact.role === 'LIBRARIAN') {
        setCustomer(null);
        toast.warning('System administrators manage the library and cannot borrow books. Pick a member.');
      } else if (exact) {
        setCustomer(exact);
      } else {
        setCustomer(null);
        toast.warning(`No member found with customer ID ${trimmed}. Verify the card.`);
      }
    } catch {
      setCustomer(null);
    }
  };

  const handleDecoded = (text, target) => {
    let value = text;
    try {
      const parsed = JSON.parse(text);
      if (parsed.data && parsed.data.customer_id) {
        value = parsed.data.customer_id;
      } else if (parsed.data && parsed.data.copy_code) {
        value = parsed.data.copy_code;
      } else if (parsed.type === 'book' && parsed.book_id) {
        // Legacy payload with only an id: let the server decide what it maps to.
        // A client-side BOOK### guess could name the wrong copy.
        value = String(parsed.book_id);
      }
    } catch {
      const m = String(text).match(/Customer ID:\s*([A-Z0-9-]+)/i);
      if (m) value = m[1].trim();
    }
    // Prefer the literal scanned text; JSON wrappers and BOOK-ISBN- prefixes
    // only exist in client-side rewrites, and the server matches all shapes.
    const code = (value || '').trim() || String(text || '').trim();
    const normalizedBookCode = normalizeScannedBookCode(code) || code;

    if (target === 'returnbook') {
      resolveReturnScan(normalizedBookCode);
      return;
    }

    if (target === 'pagebook') {
      resolvePageBookScan(normalizedBookCode);
      return;
    }

    if (target === 'book') {
      const bookId = pending?.book?.id;
      if (!bookId) return;
      const { isDigital } = pending;

      if (isDigital) {
        // Digital book: the scanned QR must match the QR code stored on the e-book.
        const expected = (pending.book.qr_code || '').trim();
        const normalized = code.replace(/\s+/g, ' ').trim();
        if (!expected) {
          toast.error('This digital book has no QR code stored. Add one in E-Book Management > Upload/Edit QR.');
          setScannedCopy(null);
          return;
        }
        // Tolerate printing noise (a BOOK-ISBN- prefix, extra whitespace) while
        // still requiring the scan to be THIS e-book's code. Only the scanned
        // value is varied: seeding the set with `expected` made every scan match.
        const canon = (v) => v.replace(/\s+/g, '').replace(/^BOOK-ISBN-/i, '').toUpperCase();
        const matched = canon(normalized) === canon(expected);
        if (!matched) {
          toast.error(`Scanned QR "${normalized}" does not match this book's stored QR "${expected}". Verify the book.`);
          setScannedCopy(null);
          return;
        }
        setScannedCopy(normalized);
        toast.success(`QR matched "${pending.book.title}" — ready to confirm`);
        return;
      }

      // Physical book: the scanned label must resolve to an available copy of
      // THIS book. Resolution is server-side so custom copy codes and printed
      // EAN/ISBN barcodes work, not just auto-generated BOOK###-C# codes.
      const expectedBookId = bookId;
      const resolvedCode = normalizeScannedBookCode(code) || code;
      resolveScanCode(resolvedCode)
        .then((hit) => {
          if (!hit) {
            toast.error(`Scanned "${resolvedCode}" does not match any book or copy.`);
            setScannedCopy(null);
            return;
          }
          if (hit.kind === 'ebook') {
            toast.error('That is a digital e-book label, but a physical copy is selected.');
            setScannedCopy(null);
            return;
          }
          if (hit.book_id !== expectedBookId) {
            toast.error(`Scanned "${code}" belongs to a different book, not "${pending.book.title}".`);
            setScannedCopy(null);
            return;
          }
          if (hit.copy_status && hit.copy_status !== 'AVAILABLE') {
            toast.error(`Copy ${hit.copy_code} is ${hit.copy_status}. Pick an available copy.`);
            setScannedCopy(null);
            return;
          }
          setScannedCopy(hit.copy_code);
          toast.success(`Copy ${hit.copy_code} scanned & ready to borrow`);
        })
        .catch(() => toast.error('Could not look up the scanned code. Check your connection.'));
      return;
    }

    setForm(f => ({ ...f, customer_code: code }));
    resolveCustomer(code);
  };

  const customerCount = customer
    ? activeLoans.filter(l => l.user_id === customer.id).length
    : 0;
  const customerLimit = (customer && borrowLimits[customer.role]) || 1;
  const customerSlotsLeft = customer ? Math.max(0, customerLimit - customerCount) : null;

  const statCards = [
    { label: 'Physical Books', value: books.length, icon: '', tile: 'bg-green-50 border-green-200', text: 'text-[#2d6f2d]' },
    { label: 'Digital Books', value: ebooks.length, icon: '', tile: 'bg-blue-50 border-blue-200', text: 'text-blue-600' },
    { label: 'Active Loans', value: activeLoans.length, icon: '', tile: 'bg-amber-50 border-amber-200', text: 'text-amber-600' },
    { label: 'Members', value: users.length, icon: '', tile: 'bg-purple-50 border-purple-200', text: 'text-purple-600' }
  ];

  const dueDate = (() => {
    const d = new Date();
    d.setDate(d.getDate() + loanDays);
    return d;
  })();

  const confirmBorrow = async () => {
    if (!pending || borrowingId) return;
    if (!customer) {
      toast.error('Select a customer to borrow for (scan QR or pick a user).');
      return;
    }
    const { book, isDigital } = pending;

    if (!scannedCopy) {
      toast.warning('Scan the QR code of the book being borrowed before continuing.');
      return;
    }

    setBorrowingId(book.id);
    try {
      const payload = { user_id: customer.id, due_days: loanDays };
      if (isDigital) {
        payload.ebook_id = book.id;
      } else {
        // scannedCopy was resolved server-side to a real copy_code, so always
        // send it. The old regex only recognised BOOK###-C# and silently sent a
        // bare book id for custom copy codes, issuing an arbitrary copy.
        payload.copy_code = scannedCopy;
      }
      const res = await borrowService.borrow(payload);
      toast.success(res.data.message);
      setPending(null);
      setSuccess({
        book,
        isDigital,
        message: res.data.message,
        copyCode: res.data.book?.copy_code,
        dueDate: res.data.loan?.due_date || dueDate.toISOString(),
        borrowCount: res.data.borrow_count,
        borrowLimit: res.data.borrow_limit,
        customerName: `${customer.first_name} ${customer.last_name || ''}`.trim()
      });
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Borrow failed');
    } finally {
      setBorrowingId(null);
    }
  };

  const closeModal = () => { setPending(null); setSuccess(null); };

  // Scan-first return: scan the book the student returns  the system verifies
  // it is an active loan (physical copy code or digital QR match), then the
  // admin can assess condition and process the return.
  const startReturnScanner = () => {
    scanTargetRef.current = 'returnbook';
    setScanTarget('returnbook');
    setCameraStarting(true);
    setScannerActive(true);
  };

  const resolveReturnScan = (code) => {
    const trimmed = (code || '').trim();
    if (!trimmed) return;
    const normalized = (normalizeScannedBookCode(trimmed) || trimmed).replace(/\s+/g, ' ').trim();

    // 1) Directly match an active physical loan by exact copy code.
    const direct = activeLoans.find(l => String(l.copy_code || '').toUpperCase() === normalized.toUpperCase());
    if (direct) {
      setRetScan(direct);
      setRetForm(f => ({ ...f, copy_code: direct.copy_code }));
      toast.success(`Book "${direct.title}" returned by ${direct.first_name} ${direct.last_name} — matches the active loan.`);
      return;
    }

    // 2) Digital book: QR matches the stored code  find the borrower's active loan for it.
    const ebook = ebooks.find(e => {
      const stored = (e.qr_code || '').replace(/\s+/g, ' ').trim();
      return stored && stored.toUpperCase() === normalized.toUpperCase();
    });
    if (ebook) {
      const virtualCode = `EBK${String(ebook.id).padStart(3, '0')}-D1`;
      const loan = activeLoans.find(l => String(l.copy_code || '').toUpperCase() === virtualCode.toUpperCase());
      if (loan) {
        setRetScan(loan);
        setRetForm(f => ({ ...f, copy_code: loan.copy_code }));
        toast.success(`Digital book "${loan.title}" returned by ${loan.first_name} ${loan.last_name} — QR matches.`);
        return;
      }
      toast.warning(`"${ebook.title}" QR matched, but this digital book is not on an active loan.`);
      return;
    }

    // 3) Copy code that is not on an active loan — warn so the real book is verified.
    if (/^BOOK\d+-C\d+$/i.test(normalized)) {
      toast.warning(`Copy ${normalized} is not on any active loan. Verify the book and the borrower.`);
      return;
    }

    toast.warning(`Scanned "${trimmed}" does not match any active loan or stored book QR.`);
  };

  const handleReturn = async (e) => {
    e.preventDefault();
    if (!retForm.copy_code) {
      toast.error('Select the active loan to return');
      return;
    }
    try {
      await processReturn(retForm.copy_code, retForm.condition, retForm.condition_note);
      setRetForm({ copy_code: '', condition: '', condition_note: '' });
      setRetScan(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Return failed');
    }
  };

  const pickLoan = (l) => {
    setRetForm(f => ({ ...f, copy_code: l.copy_code }));
    setRetScan(l);
    document.getElementById('return-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // ---- On-loan view helpers -------------------------------------------------
  // Whole days until the due date. Negative = overdue.
  const loanDaysLeft = (l) => {
    if (!l.due_date) return null;
    const due = new Date(l.due_date); due.setHours(0, 0, 0, 0);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    return Math.round((due - today) / 86400000);
  };

  const isOverdue = (l) => l.status === 'OVERDUE' || (loanDaysLeft(l) ?? 1) < 0;

  const dueLabel = (l) => {
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

  const overdueCount = useMemo(() => activeLoans.filter(isOverdue).length, [activeLoans]);
  const dueSoonCount = useMemo(
    () => activeLoans.filter((l) => { const d = loanDaysLeft(l); return d !== null && d >= 0 && d <= 3; }).length,
    [activeLoans]
  );

  const visibleLoans = useMemo(() => {
    const q = loanSearch.trim().toLowerCase();
    return activeLoans.filter((l) => {
      if (loanFilter === 'OVERDUE' && !isOverdue(l)) return false;
      if (loanFilter === 'DUE_SOON') {
        const d = loanDaysLeft(l);
        if (d === null || d < 0 || d > 3) return false;
      }
      if (!q) return true;
      return [l.title, l.copy_code, l.first_name, l.last_name, l.customer_id]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));
    });
  }, [activeLoans, loanSearch, loanFilter]);

  // Single code path for both the quick-return dialog and the condition form.
  const processReturn = async (copyCode, condition, note) => {
    const payload = { copy_code: copyCode };
    if (condition) payload.condition = condition;
    if (note) payload.condition_note = note;
    const res = await borrowService.returnBook(payload);
    if (res.data.fine) {
      toast.warning(`Fine applied: ${res.data.fine.amount} RWF (${res.data.fine.days_overdue} overdue days)`);
    } else {
      toast.success(res.data.message);
    }
    return res;
  };

  const openQuickReturn = (l) => {
    setQuickReturn(l);
    setQuickForm({ condition: '', condition_note: '' });
  };

  const handleQuickReturn = async () => {
    if (!quickReturn || returningId) return;
    setReturningId(quickReturn.id);
    try {
      await processReturn(quickReturn.copy_code, quickForm.condition, quickForm.condition_note);
      setQuickReturn(null);
      setRetForm(f => ({ ...f, copy_code: '' }));
      setRetScan(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Return failed');
    } finally {
      setReturningId(null);
    }
  };

  return (
    <AdminLayout>
      <div className="flex flex-wrap justify-between items-center mb-6 gap-3">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-[#2d6f2d]">Borrow / Return</h1>
          <p className="text-gray-500 text-base mt-1">Issue books to members and verify returns — scan to confirm every copy</p>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {statCards.map((c) => (
          <div key={c.label} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3 shadow-sm">
            <div>
              <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">{c.label}</p>
              <p className={`text-2xl font-bold ${c.text}`}>{c.value}</p>
            </div>
          </div>
        ))}
      </div>

<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* ============ LEFT: BORROW — scan the book to verify ============ */}
        <div className="space-y-6">
          {/* Customer selection */}
          <div id="borrow-customer" className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3 bg-gradient-to-r from-green-50 to-emerald-50/60 border-b border-green-100 flex flex-wrap items-center gap-3">
              <div className="flex-1 min-w-0">
                <h2 className="font-bold text-gray-800">Borrowing for</h2>
                <p className="text-xs text-gray-500">
                  {customer ? `${customer.first_name} ${customer.last_name} · ${customer.role}` : 'Scan the member QR card or pick a member below'}
                </p>
              </div>
              {customer && (
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ring-1 ${
                  customerSlotsLeft <= 0 ? 'bg-red-50 text-red-600 ring-red-200' : customerSlotsLeft === 1 ? 'bg-amber-50 text-amber-600 ring-amber-200' : 'bg-green-50 text-green-700 ring-green-200'
                }`}>
                  {customerCount} / {customerLimit} slots used
                </span>
              )}
            </div>
            <div className="px-4 py-3 space-y-2.5">
              <div className="flex gap-2">
                <input
                  value={form.customer_code}
                  onChange={(e) => {
                    setForm(f => ({ ...f, customer_code: e.target.value }));
                    const u = users.find(x => String(x.customer_id || '').toUpperCase() === String(e.target.value).trim().toUpperCase());
                    setCustomer(u || null);
                  }}
                  onKeyDown={(e) => { if (e.key === 'Enter') resolveCustomer(form.customer_code); }}
                  placeholder="Scan or type customer ID (e.g. STU0001)"
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 font-mono text-sm"
                />
                <button type="button" onClick={startScanner} className="px-3.5 py-2 bg-[#2d6f2d] text-white rounded-lg text-sm font-medium hover:bg-green-700 transition"> Scan</button>
              </div>
              <select
                value={customer?.id || ''}
                onChange={(e) => {
                  const u = users.find(x => String(x.id) === e.target.value);
                  setCustomer(u || null);
                  setForm(f => ({ ...f, customer_code: u ? u.customer_id : '' }));
                }}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                <option value="">-- Select a member from the list --</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.first_name} {u.last_name || ''} · {u.customer_id} · {u.role}</option>
                ))}
              </select>
              {customer && (
                <div className="rounded-lg bg-white border border-green-200 px-3 py-2.5 flex items-center gap-2.5">
                  <UserAvatar user={customer} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{customer.first_name} {customer.last_name}</p>
                    <p className="text-xs text-gray-500 font-mono truncate">{customer.customer_id || customer.email}</p>
                  </div>
                  <span className={`text-xs font-semibold whitespace-nowrap ${customerSlotsLeft <= 0 ? 'text-red-600' : customerSlotsLeft === 1 ? 'text-amber-600' : 'text-emerald-600'}`}>
                    {customerSlotsLeft} slot{customerSlotsLeft === 1 ? '' : 's'} left
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Scan-first: confirm the borrow by scanning the book the user brought */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3 bg-gradient-to-r from-blue-50 to-indigo-50/60 border-b border-blue-100 flex items-center gap-3">
              <div>
                <h2 className="font-bold text-gray-800">Scan the book the user brought</h2>
                <p className="text-xs text-gray-500">Point the camera at the barcode on the book — verifies the exact copy before borrowing</p>
              </div>
            </div>
            <div className="px-4 py-3">
              <input
                value={pageCopyCode}
                onChange={(e) => setPageCopyCode(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') resolvePageBookScan(pageCopyCode); }}
                placeholder="Scan or enter book barcode / copy code..."
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
              />
              <div className="flex gap-2 mt-2">
                <button type="button" onClick={startPageBookScanner} className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-500 text-white rounded-lg text-sm font-medium hover:opacity-90 transition">Scan book barcode</button>
                <button type="button" onClick={() => resolvePageBookScan(pageCopyCode)} className="px-4 py-2 border border-blue-200 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-50 transition">Find book</button>
              </div>
              {!customer && (
                <p className="text-xs text-amber-600 mt-2.5 font-medium"> Select the member first above — the book is borrowed for them.</p>
              )}
            </div>
          </div>

          {/* ===== Borrow Modal (confirm / success) ===== */}
          <Modal open={!!pending || !!success} onClose={closeModal} title={success ? 'Borrow Successful' : 'Confirm Borrow'}>
            {success ? (
              <div>
                <div className="flex flex-col items-center text-center mb-5">
                  <h4 className="font-bold text-gray-800">{success.book.title}</h4>
                  <p className="text-sm text-gray-500 mt-1">borrowed for <strong>{success.customerName}</strong></p>
                  {success.copyCode && <span className="mt-2 px-3 py-1 bg-slate-100 rounded-full text-xs font-mono text-gray-600">{success.copyCode}</span>}
                  <div className="mt-4 bg-slate-50 rounded-xl px-5 py-3 w-full">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Return by</span>
                      <span className="font-semibold text-gray-800">
                        {new Date(success.dueDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm mt-2">
                      <span className="text-gray-600">Borrow count</span>
                      <span className="font-semibold text-gray-800">{success.borrowCount} / {success.borrowLimit}</span>
                    </div>
                  </div>
                </div>
                <div className="border-t pt-4 flex justify-end">
                  <button onClick={closeModal} className="px-6 py-2.5 rounded-lg bg-[#2d6f2d] text-white text-sm font-medium hover:bg-green-700 transition">Done</button>
                </div>
              </div>
            ) : pending && (
              <div>
                <div className="flex gap-4 mb-5">
                  <div className="w-20 h-28 rounded-lg overflow-hidden bg-gradient-to-br from-green-100 to-blue-100 flex items-center justify-center shrink-0">
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
                    <span className="inline-block mt-1.5 px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                      {pending.isDigital ? 'Digital' : 'Physical'}
                    </span>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-xl p-4 mb-5 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Borrower</span>
                    <span className="text-sm font-semibold text-gray-800">
                      {customer.first_name} {customer.last_name} · {customer.customer_id || customer.email}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Loan duration</span>
                    <select
                      value={loanDays}
                      onChange={(e) => setLoanDays(Number(e.target.value))}
                      className="text-sm border rounded-lg px-2 py-1 focus:ring-2 focus:ring-green-500 focus:outline-none"
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
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Borrow slots</span>
                    <span className={`text-sm font-semibold ${customerSlotsLeft <= 0 ? 'text-red-600' : customerSlotsLeft === 1 ? 'text-amber-600' : 'text-emerald-600'}`}>
                      {customerCount} / {customerLimit} used — {customerSlotsLeft} left
                    </span>
                  </div>
                </div>

                <div className="mb-5 rounded-xl border-2 border-blue-200 bg-blue-50 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="font-semibold text-blue-800 flex items-center gap-2"> Scan the book (barcode / QR)</h5>
                    {scannedCopy && <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-sm font-mono font-semibold">{scannedCopy}</span>}
                  </div>
                  {pending.isDigital ? (
                    <p className="text-xs text-blue-700/80 mb-2">
                      Scan the QR code the member presents for this digital book. It must match the QR stored on the e-book — the system only confirms the borrow if the QR matches.
                    </p>
                  ) : (
                    <p className="text-xs text-blue-700/80 mb-2">Scan the barcode / QR code on the book copy that is being borrowed. This records the exact copy (or ISBN) issued to the member.</p>
                  )}
                  <button
                    type="button"
                    onClick={startBookScanner}
                    className={`w-full py-2.5 rounded-lg text-sm font-medium transition ${
                      scannedCopy ? 'bg-emerald-600 text-white cursor-default' : 'bg-gradient-to-r from-blue-600 to-indigo-500 text-white hover:opacity-90'
                    }`}
                  >
                    {scannedCopy ? ' Book scanned' : ' Scan book barcode / QR code'}
                  </button>
                  {scannedCopy && (
                    <button
                      type="button"
                      onClick={() => setScannedCopy(null)}
                      className="mt-2 w-full py-2 rounded-lg text-xs text-red-600 hover:bg-red-50 transition"
                    >
                      Clear scanned code
                    </button>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={closeModal}
                    className="flex-1 py-2.5 rounded-lg border border-gray-300 text-gray-600 text-sm font-medium hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmBorrow}
                    disabled={borrowingId === pending.book.id || customerSlotsLeft <= 0 || !scannedCopy}
                    className={`flex-1 py-2.5 rounded-lg text-white text-sm font-medium transition ${
                      customerSlotsLeft <= 0 || !scannedCopy
                        ? 'bg-gray-300 cursor-not-allowed'
                        : borrowingId === pending.book.id
                          ? 'bg-green-500'
                          : 'bg-[#2d6f2d] hover:bg-green-700'
                    }`}
                  >
                    {borrowingId === pending.book.id
                      ? 'Borrowing...'
                      : !scannedCopy
                        ? 'Scan book to continue'
                        : 'Confirm Borrow'}
                  </button>
                </div>
              </div>
            )}
          </Modal>
        </div>

        {/* ============ RIGHT: RETURN — scan the book to verify ============ */}
        <div className="space-y-6">
          {/* Scan-first: verify the book being returned */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3 bg-gradient-to-r from-green-50 to-emerald-50/60 border-b border-green-100 flex items-center gap-3">
              <div>
                <h2 className="font-bold text-gray-800">Scan the book being returned</h2>
                <p className="text-xs text-gray-500">Verifies it is the real book on the active loan before processing</p>
              </div>
            </div>
            <div className="px-4 py-3">
              <input
                value={retForm.copy_code}
                onChange={(e) => { setRetForm(f => ({ ...f, copy_code: e.target.value })); setRetScan(null); }}
                onKeyDown={(e) => { if (e.key === 'Enter') resolveReturnScan(retForm.copy_code); }}
                placeholder="Scan or enter book barcode / copy code..."
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 font-mono text-sm"
              />
              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  onClick={startReturnScanner}
                  className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-500 text-white rounded-lg text-sm font-medium hover:opacity-90 transition"
                >
                  Scan book barcode
                </button>
                <button
                  type="button"
                  onClick={() => resolveReturnScan(retForm.copy_code)}
                  className="px-4 py-2 border border-green-200 text-[#2d6f2d] rounded-lg text-sm font-medium hover:bg-green-50 transition"
                >
                  Verify book
                </button>
              </div>

              {retScan && (
                <div className="mt-3 rounded-lg bg-green-50 border border-green-200 px-3 py-2.5 flex items-center gap-2.5">
                  <UserAvatar user={{ first_name: retScan.first_name, last_name: retScan.last_name }} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{retScan.title}</p>
                    <p className="text-xs text-gray-500 font-mono truncate">{retScan.copy_code} · returned by {retScan.first_name} {retScan.last_name}</p>
                  </div>
                  <span className="text-xs font-semibold text-emerald-700 whitespace-nowrap"> Real book verified</span>
                </div>
              )}
            </div>
          </div>

          {/* Books currently on loan — searchable, filterable, one-click return */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3 bg-gradient-to-r from-amber-50 to-orange-50/60 border-b border-amber-100 flex flex-wrap items-center gap-3">
              <div className="flex-1 min-w-0">
                <h2 className="font-bold text-gray-800">Books Currently Borrowed</h2>
                <p className="text-xs text-gray-500">Every book that is out with a member — search, then return it</p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="px-2.5 py-1 bg-white ring-1 ring-amber-200 text-amber-700 rounded-full text-xs font-semibold">
                  {activeLoans.length} out
                </span>
                {overdueCount > 0 && (
                  <span className="px-2.5 py-1 bg-red-50 ring-1 ring-red-200 text-red-700 rounded-full text-xs font-semibold">
                    {overdueCount} overdue
                  </span>
                )}
              </div>
            </div>

            {/* Search + filters */}
            <div className="px-4 py-3 border-b border-gray-100 space-y-2.5">
              <input
                value={loanSearch}
                onChange={(e) => setLoanSearch(e.target.value)}
                placeholder="Search by book title, copy code, or member name / ID..."
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm"
              />
              <div className="flex flex-wrap gap-1.5">
                {[
                  { key: 'ALL', label: `All (${activeLoans.length})` },
                  { key: 'OVERDUE', label: `Overdue (${overdueCount})` },
                  { key: 'DUE_SOON', label: `Due soon (${dueSoonCount})` }
                ].map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setLoanFilter(t.key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                      loanFilter === t.key
                        ? 'bg-amber-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
                {loanSearch && (
                  <button
                    type="button"
                    onClick={() => { setLoanSearch(''); setLoanFilter('ALL'); }}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-500 hover:bg-gray-100 transition"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            <div className="max-h-[28rem] overflow-y-auto divide-y divide-gray-100">
              {visibleLoans.length === 0 ? (
                <div className="px-4 py-10 text-center text-sm text-gray-400">
                  {activeLoans.length === 0
                    ? 'No books are currently on loan.'
                    : 'No borrowed books match this search or filter.'}
                </div>
              ) : (
                visibleLoans.map((l) => {
                  const due = dueLabel(l);
                  const over = isOverdue(l);
                  return (
                    <div
                      key={l.id}
                      className={`px-4 py-3 flex items-center gap-3 transition ${
                        over ? 'bg-red-50/40 hover:bg-red-50/70' : 'hover:bg-amber-50/30'
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">{l.title}</p>
                        <p className="text-xs text-gray-500 truncate">
                          <span className="font-mono">{l.copy_code}</span>
                          {' · '}
                          {l.first_name} {l.last_name}
                          {l.customer_id ? ` (${l.customer_id})` : ''}
                        </p>
                        <p className="text-[11px] text-gray-400 mt-0.5">
                          Due{' '}
                          {new Date(l.due_date).toLocaleDateString(undefined, {
                            weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
                          })}
                          {' · '}
                          <span className={`font-semibold ${due.tone}`}>{due.text}</span>
                        </p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${over ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                        {over ? 'OVERDUE' : l.status}
                      </span>
                      <button
                        type="button"
                        onClick={() => openQuickReturn(l)}
                        className="px-3 py-1.5 bg-[#2d6f2d] text-white rounded-lg text-xs font-semibold hover:bg-green-700 transition whitespace-nowrap shrink-0"
                      >
                        Return
                      </button>
                      <button
                        type="button"
                        onClick={() => pickLoan(l)}
                        title="Open the return form to record condition"
                        className="px-2.5 py-1.5 border border-gray-200 text-gray-600 rounded-lg text-xs font-semibold hover:bg-gray-50 transition whitespace-nowrap shrink-0"
                      >
                        Details
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Complete the return */}
          <form id="return-form" onSubmit={handleReturn} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3 bg-gradient-to-r from-green-50 to-emerald-50/60 border-b border-green-100 flex items-center gap-3">
              <div>
                <h2 className="font-bold text-gray-800">Complete the Return</h2>
                <p className="text-xs text-gray-500">Optionally assess condition — fines apply for damaged or lost books</p>
              </div>
            </div>
            <div className="px-4 py-3 space-y-3">
              {retScan && (
                <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-[#2d6f2d] font-medium">
                   Returning <span className="font-mono">{retScan.copy_code}</span> — {retScan.title} ({retScan.first_name} {retScan.last_name})
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Copy code *</label>
                <input
                  value={retForm.copy_code}
                  onChange={(e) => { setRetForm({ ...retForm, copy_code: e.target.value }); setRetScan(null); }}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 font-mono text-sm"
                  required
                  placeholder="BOOK001-C1 or EBK001-D1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Condition Assessment</label>
                <select
                  value={retForm.condition}
                  onChange={(e) => setRetForm({ ...retForm, condition: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">-- Select condition (optional) --</option>
                  <option value="GOOD">Good</option>
                  <option value="DAMAGED">Damaged (fine 10,000 RWF)</option>
                  <option value="LOST">Lost (fine 25,000 RWF)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Condition Note</label>
                <textarea
                  value={retForm.condition_note}
                  onChange={(e) => setRetForm({ ...retForm, condition_note: e.target.value })}
                  placeholder="e.g. torn pages, missing cover..."
                  rows="2"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                />
              </div>
              <button
                type="submit"
                disabled={!retForm.copy_code}
                className={`w-full py-2.5 rounded-lg font-semibold transition ${
                  retForm.copy_code ? 'bg-[#2d6f2d] text-white hover:bg-green-700' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                Process Return & Check Fine
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Quick return straight from the borrowed-books list */}
      <Modal open={!!quickReturn} onClose={() => setQuickReturn(null)} title="Return Borrowed Book">
        {quickReturn && (() => {
          const due = dueLabel(quickReturn);
          const over = isOverdue(quickReturn);
          const busy = returningId === quickReturn.id;
          return (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <UserAvatar user={{ first_name: quickReturn.first_name, last_name: quickReturn.last_name }} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-gray-800 text-sm truncate">{quickReturn.title}</p>
                  <p className="text-xs text-gray-500 truncate">
                    <span className="font-mono">{quickReturn.copy_code}</span>
                    {' · '}
                    {quickReturn.first_name} {quickReturn.last_name}
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl p-3 mb-4 space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Borrowed by</span>
                  <span className="font-semibold text-gray-800">
                    {quickReturn.first_name} {quickReturn.last_name}
                    {quickReturn.customer_id ? ` · ${quickReturn.customer_id}` : ''}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Due date</span>
                  <span className="font-semibold text-gray-800">
                    {new Date(quickReturn.due_date).toLocaleDateString(undefined, {
                      weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
                    })}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Status</span>
                  <span className={`font-semibold ${due.tone}`}>{due.text}</span>
                </div>
              </div>

              {over && (
                <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-800">
                  This book is overdue — an overdue fine will be applied automatically when the return is processed.
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Condition</label>
                  <select
                    value={quickForm.condition}
                    onChange={(e) => setQuickForm(f => ({ ...f, condition: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Returned in good condition (no damage fine)</option>
                    <option value="GOOD">Good</option>
                    <option value="DAMAGED">Damaged (fine 10,000 RWF)</option>
                    <option value="LOST">Lost (fine 25,000 RWF)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Condition Note</label>
                  <textarea
                    value={quickForm.condition_note}
                    onChange={(e) => setQuickForm(f => ({ ...f, condition_note: e.target.value }))}
                    placeholder="e.g. torn pages, missing cover..."
                    rows="2"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-5">
                <button
                  type="button"
                  onClick={() => setQuickReturn(null)}
                  disabled={busy}
                  className="flex-1 py-2.5 rounded-lg border border-gray-300 text-gray-600 text-sm font-medium hover:bg-gray-50 transition disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleQuickReturn}
                  disabled={busy}
                  className={`flex-1 py-2.5 rounded-lg text-white text-sm font-medium transition ${
                    busy ? 'bg-green-500 cursor-wait' : 'bg-[#2d6f2d] hover:bg-green-700'
                  }`}
                >
                  {busy ? 'Processing...' : 'Confirm Return'}
                </button>
              </div>
            </div>
          );
        })()}
      </Modal>

      {scannerActive && (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-700">
                {scanTarget === 'customer' && 'Scan Member QR Card'}
                {scanTarget === 'book' && 'Scan Book to Confirm Borrow'}
                {scanTarget === 'pagebook' && 'Scan Book Barcode'}
                {scanTarget === 'returnbook' && 'Scan Book Being Returned'}
                {!scanTarget && 'Scanner'}
              </h2>
              <button
                onClick={stopScanner}
                className="px-3 py-1 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700"
              >
                Close
              </button>
            </div>

            <div
              id="qr-reader"
              className="w-full overflow-hidden rounded-lg"
              style={{
                // html5-qrcode measures this element to size the camera video.
                // With no height it measures 0x0: the camera opens, but no
                // frame is ever decoded and the scan looks permanently dead.
                display: 'block',
                width: '100%',
                height: '320px',
                maxHeight: '60vh'
              }}
            />

            {cameraStarting && (
              <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
                <p className="text-sm mt-3">Starting camera&hellip;</p>
              </div>
            )}

            {scanStatus && !scannerError && (
              <div className="mt-3 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700">
                {scanStatus}
              </div>
            )}

            {scannerError && (
              <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3">
                <p className="text-sm text-red-700 font-medium">Scanner unavailable</p>
                <p className="text-xs text-red-600 mt-1">{scannerError}</p>
                <p className="text-xs text-gray-500 mt-2">
                  You can still type the code manually below.
                </p>
              </div>
            )}

                <p className="text-xs text-gray-400 mt-3 text-center">
                  {scanTarget === 'customer'
                    ? 'Point the camera at the member QR code'
                    : scanTarget === 'pagebook'
                      ? 'Hold steady and fill the frame with the book barcode (1D)'
                      : 'Hold steady and fill the frame with the barcode or QR code'}
                </p>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminBorrow;