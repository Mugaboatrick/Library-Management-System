import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

const Login = () => {
  const [mode, setMode] = useState('qr');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState('');
  const [manualInput, setManualInput] = useState('');
  const { login, loginQR } = useAuth();
  const navigate = useNavigate();
  const scannerRef = useRef(null);
  const processingRef = useRef(false);

  const handleLoginSuccess = (user) => {
    toast.success(`Welcome, ${user.first_name}!`);
    navigate('/welcome');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(email, password);
      handleLoginSuccess(user);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
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
      toast.error('Cannot access camera. Use email login or enter QR manually.');
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-900 to-primary-700 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-8 animate-zoom-in">
        <div className="text-center mb-6 animate-fade-up">
          <img src="/hope-logo.png" alt="Hope Haven School Library" className="w-16 h-16 object-contain mb-2 mx-auto" />
          <h1 className="text-2xl font-bold text-primary-800">Hope Haven School Library</h1>
          <p className="text-gray-500 text-sm">Smart Library Management System</p>
        </div>

        <div className="flex bg-gray-100 rounded-lg p-1 mb-6 animate-fade-up" style={{ animationDelay: '100ms' }}>
          <button
            onClick={() => { if (mode !== 'qr') setMode('qr'); }}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition ${mode === 'qr' ? 'bg-primary-600 text-white shadow' : 'text-gray-600'}`}
          >
            📷 Scan QR Card
          </button>
          <button
            onClick={() => { stopScanner(); setMode('credentials'); }}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition ${mode === 'credentials' ? 'bg-primary-600 text-white shadow' : 'text-gray-600'}`}
          >
            🔑 Email & Password
          </button>
        </div>

        {mode === 'qr' ? (
          <div className="text-center">
            <p className="text-gray-600 text-sm mb-4">Scan your Library Access Card QR code to sign in</p>

            {/* Scanner viewport */}
            <div
              id="qr-login-reader"
              className="mx-auto rounded-lg overflow-hidden"
              style={{
                display: scanning ? 'block' : 'none',
                width: '100%',
                minHeight: '300px'
              }}
            ></div>

            {/* Status */}
            {scanStatus && (
              <div className={`mt-3 px-4 py-2 rounded-lg text-sm font-medium ${
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
                className="mx-auto w-48 h-48 bg-gray-100 border-2 border-dashed border-primary-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-primary-50 transition animate-pulse-soft"
              >
                <div className="text-5xl mb-2">📷</div>
                <span className="text-primary-600 text-sm font-medium">Click to Scan</span>
                <span className="text-gray-400 text-xs mt-1">Allow camera access</span>
              </button>
            )}

            {scanning && (
              <button
                onClick={stopScanner}
                className="mt-3 px-6 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700"
              >
                Stop Scanning
              </button>
            )}

            {loading && !scanning && (
              <p className="text-primary-600 text-sm mt-3">Verifying card...</p>
            )}

            {/* Manual fallback */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-400 mb-2">Or paste QR code data manually:</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  placeholder="Paste QR data here..."
                  className="flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <button
                  onClick={handleManualSubmit}
                  disabled={loading || !manualInput.trim()}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700 disabled:opacity-50"
                >
                  Login
                </button>
              </div>
            </div>

            <p className="text-xs text-gray-400 mt-3">
              Tip: All users can scan their card. Librarians can also use email & password.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="you@example.com"
                required
              />
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="••••••••"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500 mb-2">Demo accounts</p>
              <div className="text-xs text-gray-400 space-y-1">
                <p>Librarian: librarian@hopehaven.edu / admin123</p>
                <p>Student: student@hopehaven.edu / student123</p>
                <p>Teacher: teacher@hopehaven.edu / teacher123</p>
              </div>
            </div>
          </form>
        )}

        <div className="mt-4 text-center text-sm">
          <span className="text-gray-500">New student/teacher?</span>{' '}
          <Link to="/register" className="text-primary-600 hover:underline">Register here</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
