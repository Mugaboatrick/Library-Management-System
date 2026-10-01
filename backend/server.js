const http = require('http');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const { testConnection } = require('./config/db');
const { initSocket } = require('./utils/socket');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const bookRoutes = require('./routes/bookRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const borrowRoutes = require('./routes/borrowRoutes');
const fineRoutes = require('./routes/fineRoutes');
const ebookRoutes = require('./routes/ebookRoutes');
const reportRoutes = require('./routes/reportRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const accountRequestRoutes = require('./routes/accountRequestRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const messageRoutes = require('./routes/messageRoutes');
const { cleanupDeletedQRCards } = require('./controllers/userController');
const { startCronJobs } = require('./cron/fineCron');

const app = express();

// Behind a reverse proxy / nginx, X-Forwarded-For carries the real client IP.
// trust proxy keeps the auth rate limiter per-user (not per-proxy), important
// when many members share one public upstream address.
app.set('trust proxy', 1);

// Security middleware (allow cross-origin images from localhost dev frontends)
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// Compress all JSON/static responses (gzip) — shrinks payloads ~6-10x for
// large book/fine/QR data fetched by many concurrent members.
app.use(compression());
const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002'
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true); // dev mode: allow all
    }
  },
  credentials: true
}));

// Body parsers
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Diagnostics: capture every non-2xx/3xx response to a log file so errors
// reported from the browser can be traced even when the dev terminal is closed.
// Must be registered BEFORE the route mounts to observe every request.
const fs = require('fs');
const diagnosticsLogFile = path.join(__dirname, 'error-diag.log');
function logDiagnostics(entry) {
  try {
    fs.appendFileSync(diagnosticsLogFile, entry + '\n');
  } catch (e) {
    // never let logging break the request
  }
}

app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    if (res.statusCode >= 400) {
      let detail = '';
      try {
        if (req.file) {
          detail = ` file=${req.file.originalname}(${req.file.mimetype},${req.file.size}B) dest=${req.file.destination}`;
        } else if (req.body && Object.keys(req.body).length) {
          detail = ' body=' + JSON.stringify(req.body).slice(0, 500);
        }
      } catch (e) {
        detail = ' detail=<unavailable>';
      }
      logDiagnostics(
        `${new Date().toISOString()} [${res.statusCode}] ${req.method} ${req.originalUrl} ${Date.now() - start}ms auth=${req.headers.authorization ? 'yes' : 'no'}${detail}`
      );
    }
  });
  next();
});

// Rate limiting for auth to prevent brute force
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: 'Too many requests, please try again later' }
});

// Static public uploads (QR card images)
app.use('/uploads/qrcards', express.static(path.join(__dirname, 'uploads', 'qrcards')));
app.use('/uploads/profiles', express.static(path.join(__dirname, 'uploads', 'profiles')));
app.use('/uploads/covers', express.static(path.join(__dirname, 'uploads', 'covers')));

// API routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/borrowings', borrowRoutes);
app.use('/api/fines', fineRoutes);
app.use('/api/ebooks', ebookRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/account-requests', accountRequestRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/messages', messageRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Hope Haven Library API is running', time: new Date().toISOString() });
});

// Error handler for multer etc.
app.use((err, req, res, next) => {
  if (err && err.message && err.message.includes('PDF')) {
    return res.status(400).json({ success: false, message: err.message });
  }
  if (err && err.code === 'LIMIT_FILE_SIZE') {
    const maxMb = Math.round((parseInt(process.env.MAX_FILE_SIZE) || 100 * 1024 * 1024) / 1024 / 1024);
    return res.status(400).json({ success: false, message: `File too large (max ${maxMb}MB)` });
  }
  if (err && err.type === 'entity.parse.failed') {
    return res.status(400).json({ success: false, message: 'Invalid JSON in request body' });
  }
  if (err && (err.status === 413 || err.type === 'entity.too.large' || err.code === 'LIMIT_BODY_SIZE')) {
    return res.status(413).json({ success: false, message: 'Request body too large' });
  }
  if (err && err.status && err.status >= 400 && err.status < 500) {
    return res.status(err.status).json({ success: false, message: err.message || 'Invalid request' });
  }
  logDiagnostics(
    `${new Date().toISOString()} [500] ${req.method} ${req.originalUrl} :: ${(err && err.stack) || err}`
  );
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

const PORT = process.env.PORT || 5000;

async function start() {
  // Start server immediately; check DB in parallel so the API is reachable
  // even if MySQL is momentarily unavailable.

  const server = http.createServer(app);
  // Attach Socket.IO for real-time notifications
  initSocket(server);

  const startServer = (port) => new Promise((resolve, reject) => {
    const onError = (err) => {
      if (err.code === 'EADDRINUSE') {
        resolve(null);
        return;
      }
      reject(err);
    };

    server.once('error', onError);
    server.listen(port, () => {
      server.removeListener('error', onError);
      console.log(`\n==============================`);
      console.log(`Hope Haven Library API running on http://localhost:${port}`);
      console.log(`==============================\n`);
      startCronJobs();
      resolve(port);
    });
  });

  let actualPort = await startServer(PORT);
  if (actualPort === null) {
    actualPort = await startServer(5001);
    console.log('Port 5000 was busy, using fallback port 5001. Update your frontend API URL if needed.');
  }

  const dbOk = await testConnection();
  if (!dbOk) {
    console.log('WARNING: Database not connected. Run database/schema.sql and set DB credentials in .env');
  } else {
    try {
      await cleanupDeletedQRCards();
    } catch (err) {
      console.error('QR card cleanup failed:', err.message);
    }
  }
}

start();
