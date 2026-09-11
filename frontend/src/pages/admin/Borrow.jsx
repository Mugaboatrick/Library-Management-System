import React, { useState, useEffect, useRef } from 'react';
import AdminLayout from '../../components/layout/AdminLayout';
import { borrowService, ebookService } from '../../services';
import { toast } from 'react-toastify';

const AdminBorrow = () => {
  const [mode, setMode] = useState('borrow');
  const [form, setForm] = useState({ customer_code: '', user_id: '', copy_code: '', book_reference: '', ebook_id: '', due_days: 14, condition: '', condition_note: '' });
  const [ebooks, setEbooks] = useState([]);
  const [activeLoans, setActiveLoans] = useState([]);
  const [result, setResult] = useState(null);
  const [scanTarget, setScanTarget] = useState(null); // 'customer' | 'book'

  // QR scanner state
  const [Html5QrcodePlugin, setHtml5QrcodePlugin] = useState(null);
  const [scannerActive, setScannerActive] = useState(false);
  const scannerInstanceRef = useRef(null);

  useEffect(() => {
    ebookService.list({ limit: 100 }).then(res => setEbooks(res.data.data)).catch(() => {});
    borrowService.list({}).then(res => setActiveLoans((res.data.data || []).filter(l => ['BORROWED', 'OVERDUE'].includes(l.status)))).catch(() => {});
    import('html5-qrcode').then(m => setHtml5QrcodePlugin(() => m.Html5Qrcode));
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
    if (!scannerActive || !scanTarget) return;
    if (!Html5QrcodePlugin) {
      toast.error('Scanner library not loaded');
      setScannerActive(false);
      return;
    }
    const scanner = new Html5QrcodePlugin('qr-reader');
    scannerInstanceRef.current = scanner;
    scanner.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 200, height: 200 } },
      (decodedText) => {
        stopScanner();
        handleDecoded(scanTarget, decodedText);
      },
      () => {}
    ).catch((err) => {
      console.error(err);
      toast.error('Unable to access camera. Check permissions or use manual entry.');
      setScannerActive(false);
    });
    return () => {
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
  }, [scannerActive, scanTarget, Html5QrcodePlugin]);

  const loadActiveLoans = () => {
    borrowService.list({}).then(res => setActiveLoans((res.data.data || []).filter(l => ['BORROWED', 'OVERDUE'].includes(l.status)))).catch(() => {});
  };

  const startScanner = (target) => {
    setScanTarget(target);
    setScannerActive(true);
  };

  const stopScanner = () => {
    if (scannerInstanceRef.current) {
      try { scannerInstanceRef.current.stop().then(() => { scannerInstanceRef.current.clear(); }).catch(() => {}); } catch {}
      scannerInstanceRef.current = null;
    }
    setScannerActive(false);
    setScanTarget(null);
  };

  const handleDecoded = (target, text) => {
    // Try to parse JSON QR payload; otherwise use raw text as customer/copy code
    let value = text;
    try {
      const parsed = JSON.parse(text);
      if (parsed.data && parsed.data.customer_id) {
        value = parsed.data.customer_id;
      }
    } catch {}
    if (target === 'customer') {
      setForm(f => ({ ...f, customer_code: value.trim() }));
      toast.success('Customer identified');
    } else {
      setForm(f => ({ ...f, copy_code: value.trim() }));
      toast.success('Book copy identified');
    }
  };

  const handleBorrow = async (e) => {
    e.preventDefault();
    setResult(null);
    const payload = {};
    if (form.customer_code) payload.customer_code = form.customer_code.trim();
    if (form.user_id) payload.user_id = parseInt(form.user_id);
    if (form.ebook_id) payload.ebook_id = parseInt(form.ebook_id);
    if (form.copy_code) payload.copy_code = form.copy_code.trim();
    if (form.book_reference) payload.book_reference = form.book_reference;
    if (form.due_days) payload.due_days = parseInt(form.due_days);

    if (!payload.customer_code && !payload.user_id) {
      toast.error('Enter customer ID (STU0001) or select user');
      return;
    }
    if (!payload.ebook_id && !payload.copy_code && !payload.book_reference) {
      toast.error('Select a book');
      return;
    }

    try {
      const res = await borrowService.borrow(payload);
      setResult(res.data);
      toast.success(res.data.message);
      setForm({ ...form, copy_code: '', book_reference: '', ebook_id: '' });
      loadActiveLoans();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Borrow failed');
    }
  };

  const handleReturn = async (e) => {
    e.preventDefault();
    setResult(null);
    if (!form.copy_code) {
      toast.error('Enter the copy code of the book to return');
      return;
    }
    const payload = { copy_code: form.copy_code.trim() };
    if (form.condition) payload.condition = form.condition;
    if (form.condition_note) payload.condition_note = form.condition_note;

    try {
      const res = await borrowService.returnBook(payload);
      setResult(res.data);
      if (res.data.fine) {
        toast.warning(`Fine applied: ${res.data.fine.amount} RWF (${res.data.fine.days_overdue} overdue days)`);
      } else {
        toast.success(res.data.message);
      }
      setForm({ ...form, copy_code: '', condition: '', condition_note: '' });
      loadActiveLoans();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Return failed');
    }
  };

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Borrow / Return</h1>
        <p className="text-gray-500 text-sm">Scan QR codes and process transactions</p>
      </div>

      {/* QR Scanner overlay */}
      {scannerActive && (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-700">Scanning {scanTarget === 'customer' ? 'Customer QR' : 'Book Code'}</h2>
              <button onClick={stopScanner} className="px-3 py-1 bg-red-600 text-white rounded-lg text-sm">Close</button>
            </div>
            <div id="qr-reader" className="w-full"></div>
            <p className="text-xs text-gray-400 mt-3 text-center">Point camera at the QR code</p>
          </div>
        </div>
      )}

      <div className="mb-6 bg-white rounded-lg border border-gray-200 p-3 inline-block">
        <div className="flex gap-2">
          <button
            onClick={() => setMode('borrow')}
            className={`px-4 py-2 rounded-lg text-sm ${mode === 'borrow' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600'}`}
          >
            📤 Borrow
          </button>
          <button
            onClick={() => setMode('return')}
            className={`px-4 py-2 rounded-lg text-sm ${mode === 'return' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600'}`}
          >
            📥 Return
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: transaction form */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          {mode === 'borrow' ? (
            <form onSubmit={handleBorrow}>
              <h2 className="font-semibold text-gray-700 mb-4">Borrow a Book</h2>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-600 mb-1">Customer QR / ID *</label>
                <div className="flex gap-2">
                  <input
                    value={form.customer_code}
                    onChange={(e) => setForm({ ...form, customer_code: e.target.value })}
                    placeholder="Scan or enter customer ID (e.g. STU0001)"
                    className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono"
                  />
                  <button type="button" onClick={() => startScanner('customer')} className="px-3 py-2 bg-primary-100 text-primary-700 rounded-lg text-sm hover:bg-primary-200">
                    📷 Scan
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-1">Alternative: select a registered user below</p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-600 mb-1">Or Select User</label>
                <UserSelector onSelect={(u) => u
                    ? setForm({ ...form, user_id: u.id, customer_code: u.customer_id })
                    : setForm({ ...form, user_id: '', customer_code: '' })
                  } />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-600 mb-1">Select Book *</label>
                <select
                  value={form.ebook_id}
                  onChange={(e) => setForm({ ...form, ebook_id: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                >
                  <option value="">-- Select a book --</option>
                  {ebooks.map((eb) => {
                    const ebCode = `EBK${String(eb.id).padStart(3, '0')}-D1`;
                    const isOut = activeLoans.some((l) => l.copy_code === ebCode);
                    return (
                      <option key={eb.id} value={eb.id} disabled={isOut}>
                        {eb.title}{eb.author ? ` · ${eb.author}` : ''}{isOut ? ' (currently borrowed)' : ''}
                      </option>
                    );
                  })}
                </select>
                <p className="text-xs text-gray-400 mt-1">Books marked "(currently borrowed)" are lent out and will reappear after being returned.</p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-600 mb-1">Loan Period (days)</label>
                <input type="number" min="1" value={form.due_days} onChange={(e) => setForm({ ...form, due_days: e.target.value })} className="w-32 px-3 py-2 border rounded-lg" />
              </div>

              <button type="submit" className="w-full py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium">
                Process Borrow
              </button>
            </form>
          ) : (
            <form onSubmit={handleReturn}>
              <h2 className="font-semibold text-gray-700 mb-4">Return a Book</h2>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-600 mb-1">Select Book to Return *</label>
                <select
                  value={form.copy_code}
                  onChange={(e) => setForm({ ...form, copy_code: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 font-mono"
                  required
                >
                  <option value="">-- Select an active loan --</option>
                  {activeLoans.map((l) => (
                    <option key={l.id} value={l.copy_code}>
                      {l.title} · {l.copy_code} · {l.first_name} {l.last_name}
                    </option>
                  ))}
                </select>
                {activeLoans.length === 0 && (
                  <p className="text-xs text-gray-400 mt-1">No books are currently on loan to users.</p>
                )}
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-600 mb-1">Condition Assessment</label>
                <select
                  value={form.condition}
                  onChange={(e) => setForm({ ...form, condition: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="">-- Select condition (optional) --</option>
                  <option value="GOOD">Good</option>
                  <option value="DAMAGED">Damaged (fine 10,000 RWF)</option>
                  <option value="LOST">Lost (fine 25,000 RWF)</option>
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-600 mb-1">Condition Note</label>
                <textarea
                  value={form.condition_note}
                  onChange={(e) => setForm({ ...form, condition_note: e.target.value })}
                  placeholder="e.g. torn pages, missing cover..."
                  rows="2"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <button type="submit" className="w-full py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium">
                Process Return & Check Fine
              </button>
            </form>
          )}

          {result && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="font-semibold text-green-800 mb-2">✓ Transaction Result</h3>
              <pre className="text-xs text-green-800 whitespace-pre-wrap">{JSON.stringify(result, null, 2)}</pre>
            </div>
          )}
        </div>

        {/* Right: quick book lookup */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-700 mb-4">Quick Book Lookup</h2>
          <p className="text-xs text-gray-400 mb-3">Digital books available in the library:</p>
          <div className="max-h-96 overflow-y-auto border rounded-lg">
            <div className="table-wrap">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-3 py-2 text-xs font-semibold text-gray-600">Title</th>
                  <th className="text-left px-3 py-2 text-xs font-semibold text-gray-600">Copy</th>
                  <th className="text-left px-3 py-2 text-xs font-semibold text-gray-600">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {ebooks.map((eb) => {
                  const code = `EBK${String(eb.id).padStart(3, '0')}-D1`;
                  const borrowed = activeLoans.some((l) => l.copy_code === code);
                  return (
                    <tr key={eb.id} className="hover:bg-gray-50">
                      <td className="px-3 py-2 text-xs">{eb.title}</td>
                      <td className="px-3 py-2 font-mono text-xs">{code}</td>
                      <td className="px-3 py-2">
                        <span className={`text-xs ${borrowed ? 'text-red-600' : 'text-green-600'}`}>
                          {borrowed ? 'BORROWED' : 'AVAILABLE'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-3">Tip: pick the book in the left form to borrow it.</p>
        </div>
      </div>
    </AdminLayout>
  );
};

// User selector component - dropdown menu of registered accounts
const UserSelector = ({ onSelect }) => {
  const [users, setUsers] = useState([]);
  const [value, setValue] = useState('');

  const { userService } = require('../../services');

  useEffect(() => {
    userService.list({ limit: 300 })
      .then(res => setUsers(res.data.data))
      .catch(() => setUsers([]));
  }, []);

  const handleChange = (e) => {
    const v = e.target.value;
    setValue(v);
    const u = users.find(x => x.id === parseInt(v));
    if (u) onSelect(u);
  };

  const handleClear = () => {
    setValue('');
    onSelect(null);
  };

  return (
    <div className="mt-2">
      <select
        value={value}
        onChange={handleChange}
        className="w-full px-3 py-2 border rounded-lg text-sm"
      >
        <option value="">-- Select user account --</option>
        {users.map((u) => (
          <option key={u.id} value={u.id}>
            {u.first_name} {u.last_name} · {u.customer_id || u.email} ({u.role})
          </option>
        ))}
      </select>
      <div className="mt-1 flex">
        {value && (
          <button type="button" onClick={handleClear} className="text-xs text-red-600 hover:underline">
            Clear selection
          </button>
        )}
      </div>
    </div>
  );
};

export default AdminBorrow;
