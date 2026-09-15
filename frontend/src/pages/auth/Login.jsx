import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { accountRequestService } from '../../services';
import { toast } from 'react-toastify';

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
      const msg = err.response?.data?.message || 'QR login failed';
      toast.error(msg);
      setScanStatus('Error: ' + msg);
      processingRef.current = false;
      setScanning(false);
      setLoading(false);
    }
  };

  const startScanner = useCallback(async () => {
    processingRef.current = false;
    setScanning(true);
    setScanStatus('Starting camera...');

    try {
      const { Html5Qrcode } = await import('html5-qrcode');

      // Clear any old instance
      const el = document.getElementById('qr-login-reader');
      if (el) el.innerHTML = '';

      await new Promise(r => setTimeout(r, 200));

      const scanner = new Html5Qrcode('qr-login-reader');
      scannerRef.current = scanner;

      const success = await scanner.start(
        { facingMode: 'environment' },
        { fps: 15, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 },
        (decodedText) => {
          processQR(decodedText);
        },
        () => {}
      );

      if (success !== false) {
        setScanStatus('Point camera at QR code...');
      }
    } catch (err) {
      console.error('Scanner error:', err);
      toast.error('Cannot access camera. Enter your QR data manually below.');
      setScanning(false);
      setScanStatus('');
    }
  }, []);

  const stopScanner = useCallback(async () => {
    processingRef.current = false;
    if (scannerRef.current) {
      try { await scannerRef.current.stop(); } catch (e) {}
      try { scannerRef.current.clear(); } catch (e) {}
      scannerRef.current = null;
    }
    setScanning(false);
    setScanStatus('');
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

      <div className="w-full max-w-sm relative z-10">
        {/* Compact card */}
        <div className="bg-white rounded-2xl shadow-2xl p-6 animate-zoom-in">
          {/* Header */}
          <div className="text-center mb-4 animate-fade-up">
            <img src="/hope-logo.png" alt="Hope Haven School Library" className="w-12 h-12 object-contain mb-1.5 mx-auto" />
            <h1 className="text-lg font-bold text-primary-800 leading-tight">Hope Haven School Library</h1>
            <p className="text-gray-500 text-xs">Smart Library Management System</p>
          </div>

          {/* QR mode */}
          <p className="text-center text-gray-600 text-xs mb-3">
            Scan your Library Access Card QR code
          </p>

          {/* Scanner viewport */}
          <div
            id="qr-login-reader"
            className="mx-auto rounded-lg overflow-hidden"
            style={{
              display: scanning ? 'block' : 'none',
              width: '100%',
              minHeight: '220px'
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
              className="mx-auto w-32 h-32 bg-gray-100 border-2 border-dashed border-primary-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-primary-50 transition animate-pulse-soft"
            >
              <div className="text-3xl mb-1">📷</div>
              <span className="text-primary-600 text-xs font-medium">Click to Scan</span>
              <span className="text-gray-400 text-[10px] mt-0.5">Allow camera access</span>
            </button>
          )}

          {scanning && (
            <button
              onClick={stopScanner}
              className="mt-2 block mx-auto px-5 py-1.5 bg-red-600 text-white rounded-lg text-xs hover:bg-red-700"
            >
              Stop Scanning
            </button>
          )}

          {loading && !scanning && (
            <p className="text-primary-600 text-xs mt-2 text-center">Verifying card...</p>
          )}

          {/* Manual fallback */}
          <div className="mt-3 pt-3 border-t border-gray-200">
            <p className="text-[10px] text-gray-400 mb-1.5">Or paste QR code data manually:</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                placeholder="Paste QR data here..."
                className="flex-1 px-2.5 py-1.5 border rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <button
                onClick={handleManualSubmit}
                disabled={loading || !manualInput.trim()}
                className="px-3 py-1.5 bg-primary-600 text-white rounded-lg text-xs hover:bg-primary-700 disabled:opacity-50"
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
                  Tell the librarian how you need to enter the library. Your request appears in their "Members &amp; Login"
                  section so they can create your account.
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
                  type="text"
                  value={requestForm.phone}
                  onChange={(e) => setRequestForm({ ...requestForm, phone: e.target.value })}
                  placeholder="Phone (optional)"
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
                  {sendingRequest ? 'Sending request...' : '✉️ Send Request to the Librarian'}
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