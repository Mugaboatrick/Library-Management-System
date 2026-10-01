import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { accountRequestService } from '../../services';
import { toast } from 'react-toastify';
import BackButton from '../../components/common/BackButton';
import { BarcodeFormat } from '@zxing/library';

const Login = () => {
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState('');
  const [manualInput, setManualInput] = useState('');
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [sendingRequest, setSendingRequest] = useState(false);
  const [requestForm, setRequestForm] = useState({
    first_name: '', last_name: '', email: '', phone: '', role: 'STUDENT',
    message: 'I need another way to enter the library. Please create an account for me.'
  });
  const { loginQR } = useAuth();
  const navigate = useNavigate();
  const scannerRef = useRef(null);
  const processingRef = useRef(false);
  // Confirm reads by majority within a tiny rolling window: fire as soon as
  // one value appears twice among the last 5 decoded frames. This still
  // filters one-off digit-guess flips (11028192 vs 06679811) but does NOT
  // wait for identical back-to-back reads, so scanning stays snappy.
  const recentReadsRef = useRef([]);
  const lastConsensusRef = useRef(null);

  const handleLoginSuccess = (user) => {
    toast.success(`Welcome, ${user.first_name}!`);
    navigate('/welcome');
  };

  const processQR = async (qrText) => {
    if (processingRef.current) return;
    processingRef.current = true;
    setScanStatus('QR detected! Logging in...');
    setLoading(true);

    // Stop camera first (fire and forget)
    try { scannerRef.current?.stop(); } catch (e) {}

    try {
      const user = await loginQR(qrText);
      handleLoginSuccess(user);
    } catch (err) {
      const recv = err.response?.data?.received;
      const msg = (() => {
        if (err.response?.data?.message) return err.response.data.message;
        if (err.code === 'ECONNABORTED') return 'Server took too long to respond. Try again.';
        if (!err.response && err.request) return 'Cannot reach the server. Check your connection.';
        return 'QR login failed';
      })();
      toast.error(recv ? `${msg} — got: "${recv}"` : msg);
      console.warn('[QR-LOGIN-FRONT] scanned text was:', qrText, 'error:', err.message);
      setScanStatus(recv ? `Error: ${msg} (got: "${recv}")` : 'Error: ' + msg);
      processingRef.current = false;
      setScanning(false);
      setLoading(false);
    }
  };

  const stopScanner = useCallback(async () => {
    processingRef.current = false;
    recentReadsRef.current = [];
    lastConsensusRef.current = null;
    if (scannerRef.current) {
      try { await scannerRef.current.stop(); } catch (e) {}
      try { scannerRef.current.clear(); } catch (e) {}
      scannerRef.current = null;
    }
    setScanning(false);
    setScanStatus('');
  }, []);

  const startScanner = useCallback(async () => {
    processingRef.current = false;
    recentReadsRef.current = [];
    lastConsensusRef.current = null;
    setScanStatus('Starting camera...');
    setScanning(true);

    // Camera API only works in a secure context (HTTPS or localhost)
    if (!window.isSecureContext) {
      setScanStatus('Camera blocked: connect via HTTPS or localhost');
      toast.error('Camera access requires HTTPS or localhost. Enter your QR data manually below.');
      setScanning(false);
      return;
    }

    const onDecoded = (decodedText) => {
      const value = String(decodedText || '').trim();
      if (!value) return;
      // Glossy plastic cards decode mostly CORRUPT (wrong digits every frame)
      // with only the occasional FULL correct read. Per-column voting fails
      // because bad reads are the majority. Instead: tally complete readings.
      // The true serial is the SAME QR, so it repeats more than any corrupt
      // guess (a misread is a one-off number). The most frequent full value
      // with enough votes is the authentic serial.
      //
      // Keep the role prefix. Reducing the value to digits alone makes every
      // member collide on the numeric part: STU0001, LIB0001 and TCH0001 all
      // become "0001", so the voter could not tell the cards apart.
      const serial = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
      // Every issued card carries a role prefix (STU/TCH/GST/LIB + serial).
      // Require it from the camera. A bare number cannot be trusted here: the
      // backend resolves those with a LIKE %digits% fallback, so a corrupt
      // 4-digit read such as "0002" could otherwise sign in a DIFFERENT member
      // once a serial like STU0002 is issued. Older/vendor cards that really
      // are numbers can still be entered by hand in the manual box below.
      if (!/^(STU|TCH|GST|LIB)\d{1,8}$/.test(serial) || serial.length > 20) {
        console.log('[QR-RAW]', JSON.stringify(value));
        setScanStatus(`${recentReadsRef.current.length} / 12 reads — keep the card still...`);
        return;
      }
      const recent = recentReadsRef.current;
      // Vote on the FULL serial (letters included), not the digits alone, so
      // STU0001 / LIB0001 / TCH0001 stay distinguishable.
      recent.push(serial);
      if (recent.length > 12) recent.shift();
      console.log('[QR-READ]', serial, 'window=', recent.length);
      if (recent.length < 4) {
        setScanStatus(`Read ${recent.length}/4: ${serial} — hold still...`);
        return;
      }

      // Whole-string plurality: the value seen most often in the window.
      const tally = {};
      for (const r of recent) tally[r] = (tally[r] || 0) + 1;
      let best = null;
      let bestCount = 0;
      for (const s in tally) {
        if (tally[s] > bestCount) { best = s; bestCount = tally[s]; }
      }

      // The role prefix already guarantees the value is a well-formed serial,
      // so 2 agreeing reads are enough to confirm.
      if (best && bestCount >= 2) {
        // Require the same winner twice in a row before trusting it.
        if (lastConsensusRef.current === best) {
          setScanStatus(`Match: ${best} — logging in...`);
          recentReadsRef.current = [];
          lastConsensusRef.current = null;
          processQR(best);
        } else {
          lastConsensusRef.current = best;
          setScanStatus(`Match: ${best} (${bestCount}x) — confirming...`);
        }
      } else {
        lastConsensusRef.current = null;
        const top = best || '';
        setScanStatus(
          bestCount > 0
            ? `No winner yet (top: ${top} ×${bestCount}) — keep still...`
            : `${recent.length} / 12 reads — keep the card still...`
        );
      }
    };

    try {
      const { Html5Qrcode } = await import('html5-qrcode');

      // Stop any previous scanner before creating a fresh one.
      await stopScanner();
      setScanning(true);

      // Give React a tick to paint the (now-visible) viewfinder with size.
      await new Promise((r) => setTimeout(r, 150));

      const el = document.getElementById('qr-login-reader');
      if (!el) throw new Error('Scanner viewport not found');
      el.innerHTML = '';

      const scanner = new Html5Qrcode('qr-login-reader', { verbose: false });
      scannerRef.current = scanner;

const config = {
        fps: 20,
        // Native BarcodeDetector is REQUIRED here: it is the only decoder that
        // has ever read your plastic card (the JS decoder on 640x480 returns
        // nothing and the scan appears dead). High res gives it enough detail
        // to resolve the small dense QR that's printed on the plastic card.
        experimentalFeatures: { useBarCodeDetectorIfSupported: true },
        videoConstraints: { width: { ideal: 1280 }, height: { ideal: 720 } },
        // Keep a LARGE scan region: the tiny plastic-card QR must fit fully
        // inside the box or the decoder returns "no QR found" forever. A small
        // box cuts the QR whenever the card is slightly off-center.
        qrbox: (w, h) => ({ width: Math.round(w * 0.85), height: Math.round(h * 0.85) }),
        // Resolve the format from the library's enum by NAME. The previous
        // hardcoded [0] was ZXing's AZTEC, not QR_CODE (which is 11), so this
        // scanner was never actually looking for the card's QR symbol. The
        // native BarcodeDetector path above ignored this list, which is why the
        // bug stayed hidden on browsers that support it.
        formatsToSupport: [BarcodeFormat.QR_CODE].filter((n) => n != null)
      };

      // Clean single attempt: start the back camera; if that fails, fall back
      // to the browser's default camera with the same config.
      let startedOk = false;
      try {
        await scanner.start({ facingMode: 'environment' }, config, onDecoded, () => {});
        startedOk = true;
      } catch (err) {
        console.warn('back camera failed, trying default:', err);
        try { await scanner.stop(); await scanner.clear(); } catch (e) {}
        scannerRef.current = null;
        el.innerHTML = '';
        const fallback = new Html5Qrcode('qr-login-reader', { verbose: false });
        scannerRef.current = fallback;
        await fallback.start(undefined, config, onDecoded, () => {});
        startedOk = true;
      }

      if (startedOk) {
        setScanStatus('Point camera at QR code...');
      }
    } catch (err) {
      console.error('Scanner error:', err);
      const details = (err && err.message) ? err.message : String(err);
      if (/NotAllowedError|PermissionDenied/i.test(details)) {
        setScanStatus('Camera permission denied — allow it in your browser');
      } else if (/NotFoundError|NoCameras/i.test(details)) {
        setScanStatus('No camera found on this device');
      } else {
        setScanStatus('Cannot access camera. Enter your QR data manually below.');
      }
      toast.error('Cannot access camera. Enter your QR data manually below.');
      setScanning(false);
    }
  }, []);

  useEffect(() => {
    return () => {
      try { scannerRef.current?.stop(); } catch {}
      try { scannerRef.current?.clear(); } catch {}
    };
  }, []);

  const handleManualSubmit = async () => {
    if (!manualInput.trim()) {
      toast.error('Enter QR code data first');
      return;
    }
    setLoading(true);
    try {
      const user = await loginQR(manualInput.trim());
      handleLoginSuccess(user);
    } catch (err) {
      toast.error(err.response?.data?.message || 'QR login failed');
    } finally {
      setLoading(false);
    }
  };

  const toggleRequestForm = () => {
    setShowRequestForm((s) => !s);
    if (!requestForm.first_name) {
      setRequestForm((f) => ({
        ...f,
        message: 'I need another way to enter the library. Please create an account for me.'
      }));
    }
  };

  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    if (!/^[a-z][^\s@]*@[^\s@]+\.[^\s@]+$/.test(requestForm.email)) {
      toast.error('Email must start with a lowercase letter and be valid');
      return;
    }
    if (requestForm.phone && !/^07\d{8}$/.test(requestForm.phone)) {
      toast.error('Phone number must start with 07 and be exactly 10 digits');
      return;
    }
    setSendingRequest(true);
    try {
      const res = await accountRequestService.create({
        first_name: requestForm.first_name,
        last_name: requestForm.last_name,
        email: requestForm.email,
        phone: requestForm.phone || null,
        role: requestForm.role,
        message: requestForm.message
      });
      toast.success(res.data.message);
      setShowRequestForm(false);
      setRequestForm({ first_name: '', last_name: '', email: '', phone: '', role: 'STUDENT', message: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not send your request');
    } finally {
      setSendingRequest(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative"
      style={{
        backgroundImage: "url('/library-bg.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary-950/80 via-primary-900/70 to-primary-800/80"></div>

      <div className="absolute top-4 left-4 z-20"><BackButton /></div>

      <div className="w-full max-w-sm relative z-10">
        {/* Compact card */}
        <div className="bg-white rounded-2xl shadow-2xl py-2.5 px-4 animate-zoom-in">
          {/* Header */}
          <div className="text-center mb-1 animate-fade-up">
            <img src="/hope-logo.png" alt="Hope Haven School Library" className="w-7 h-7 object-contain mb-0.5 mx-auto" />
            <h1 className="text-[13px] font-bold text-primary-800 leading-none">Hope Haven School Library</h1>
            <p className="text-gray-500 text-[9px] leading-none mt-0.5">Smart Library Management System</p>
          </div>

          {/* QR mode */}
          <p className="text-center text-gray-600 text-[10px] mb-1">
            Scan your Library Access Card QR code
          </p>

          {/* Scanner viewport */}
          <div
            id="qr-login-reader"
            className="mx-auto rounded-lg overflow-hidden"
            style={{
              // Keep the element occupying space even before a scan starts:
              // html5-qrcode refuses to initialize the camera on a hidden
              // (display:none) element and then never decodes frames.
              display: 'block',
              visibility: scanning ? 'visible' : 'hidden',
              width: '100%',
              height: '260px',
              maxHeight: '55vh',
              minHeight: '200px',
              aspectRatio: '4 / 3'
            }}
          ></div>

          {/* Status */}
          {scanStatus && (
            <div className={`mt-2 px-3 py-1.5 rounded-lg text-xs font-medium ${
              scanStatus.startsWith('Error') ? 'bg-red-100 text-red-700' :
              scanStatus.includes('Logging in') || scanStatus.includes('detected') ? 'bg-green-100 text-green-700' :
              'bg-blue-100 text-blue-700'
            }`}>
              {scanStatus}
            </div>
          )}

          {/* Start scan button */}
          {!scanning && !loading && (
            <button
              onClick={startScanner}
              className="mx-auto w-full max-w-[300px] h-40 bg-gray-100 border-2 border-dashed border-primary-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-primary-50 transition animate-pulse-soft"
            >
              <span className="text-primary-600 text-sm font-medium">Tap to Scan</span>
              <span className="text-gray-400 text-[10px]">Allow camera access</span>
            </button>
          )}

          {scanning && (
            <button
              onClick={stopScanner}
              className="mt-1.5 block mx-auto px-4 py-1 bg-red-600 text-white rounded-lg text-xs hover:bg-red-700"
            >
              Stop Scanning
            </button>
          )}

          {loading && !scanning && (
            <p className="text-primary-600 text-xs mt-1.5 text-center">Verifying card...</p>
          )}

          {/* Manual fallback */}
          <div className="mt-1 pt-1 border-t border-gray-200">
            <p className="text-[10px] text-gray-400 mb-1">Or paste QR code data manually:</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                placeholder="Paste QR data here..."
                className="flex-1 px-2.5 py-1.5 border border-yellow-300 bg-white/80 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
              <button
                onClick={handleManualSubmit}
                disabled={loading || !manualInput.trim()}
                className="px-3 py-1.5 bg-gradient-to-r from-yellow-400 to-emerald-500 text-white rounded-lg text-xs hover:from-yellow-500 hover:to-emerald-600 disabled:opacity-50"
              >
                Login
              </button>
            </div>
          </div>

          {/* Footer links */}
          <div className="mt-3 pt-3 border-t border-gray-200 text-center space-y-1.5">
            <p className="text-[10px] text-gray-400">
              No account? Ask the librarian — accounts are issued with a QR card.
            </p>
            <button
              onClick={toggleRequestForm}
              className="inline-block text-[11px] font-medium text-primary-600 hover:text-primary-700"
            >
              {showRequestForm ? 'Hide request form' : 'Need an account? Request one'}
            </button>

            {showRequestForm && (
              <form onSubmit={handleRequestSubmit} className="text-left mt-2 pt-2 border-t border-gray-200 space-y-2">
                <p className="text-[10px] text-gray-500">
                  Request a library account by filling in your details below. Your request appears in the librarian's
                  "Members &amp; Login" section where they can review it and create your account.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={requestForm.first_name}
                    onChange={(e) => setRequestForm({ ...requestForm, first_name: e.target.value })}
                    placeholder="First name"
                    className="px-2.5 py-1.5 border rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  />
                  <input
                    type="text"
                    value={requestForm.last_name}
                    onChange={(e) => setRequestForm({ ...requestForm, last_name: e.target.value })}
                    placeholder="Last name"
                    className="px-2.5 py-1.5 border rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>
                <input
                  type="email"
                  value={requestForm.email}
                  onChange={(e) => setRequestForm({ ...requestForm, email: e.target.value })}
                  placeholder="Email address"
                  className="w-full px-2.5 py-1.5 border rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
                <input
                  type="tel"
                  inputMode="numeric"
                  value={requestForm.phone}
                  onChange={(e) => setRequestForm({ ...requestForm, phone: e.target.value.replace(/\D/g, '') })}
                  onKeyDown={(e) => { if (e.key.length === 1 && !/[0-9]/.test(e.key)) e.preventDefault(); }}
                  placeholder="07XXXXXXXX"
                  maxLength={10}
                  pattern="07[0-9]{8}"
                  title="Phone number must start with 07 and be exactly 10 digits"
                  className="w-full px-2.5 py-1.5 border rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <select
                  value={requestForm.role}
                  onChange={(e) => setRequestForm({ ...requestForm, role: e.target.value })}
                  className="w-full px-2.5 py-1.5 border rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                >
                  <option value="STUDENT">I am a Student</option>
                  <option value="TEACHER">I am a Teacher</option>
                  <option value="GUEST">I am a Guest / Visitor</option>
                </select>
                <textarea
                  value={requestForm.message}
                  onChange={(e) => setRequestForm({ ...requestForm, message: e.target.value })}
                  placeholder="Write why you need an account..."
                  rows="2"
                  className="w-full px-2.5 py-1.5 border rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <button
                  type="submit"
                  disabled={sendingRequest}
                  className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg text-xs font-medium hover:bg-primary-700 disabled:opacity-50"
                >
                  {sendingRequest ? 'Sending request...' : ' Send Request to the Librarian'}
                </button>
              </form>
            )}

            <Link
              to="/login/admin"
              className="block text-[10px] text-gray-300 hover:text-primary-600"
            >
              Librarian sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;