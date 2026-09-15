const http = require('http');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const { testConnection } = require('./config/db');
const { initSocket } = require('./utils/socket');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const bookRoutes = require('./routes/bookRoutes');
const borrowRoutes = require('./routes/borrowRoutes');
const fineRoutes = require('./routes/fineRoutes');
const ebookRoutes = require('./routes/ebookRoutes');
const reportRoutes = require('./routes/reportRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const accountRequestRoutes = require('./routes/accountRequestRoutes');
const { cleanupDeletedQRCards } = require('./controllers/userController');
const { startCronJobs } = require('./cron/fineCron');

const app = express();
// Security middleware (allow cross-origin images from localhost dev frontends)
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));
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
app.use('/api/borrowings', borrowRoutes);
app.use('/api/fines', fineRoutes);
app.use('/api/ebooks', ebookRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/account-requests', accountRequestRoutes);

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

  server.listen(PORT, () => {
    console.log(`\n==============================`);
    console.log(`Hope Haven Library API running on http://localhost:${PORT}`);
    console.log(`==============================\n`);
    startCronJobs();
  });

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
