const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// Ensure uploads directories exist
const ebooksDir = path.join(__dirname, '..', 'uploads', 'ebooks');
const qrcardsDir = path.join(__dirname, '..', 'uploads', 'qrcards');
const profilesDir = path.join(__dirname, '..', 'uploads', 'profiles');
const coversDir = path.join(__dirname, '..', 'uploads', 'covers');

[ebooksDir, qrcardsDir, profilesDir, coversDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// E-book file upload config (PDF/EPUB)
const ebookStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, ebooksDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}_${uuidv4()}${ext}`);
  }
});

const ebookFilter = (req, file, cb) => {
  const allowed = ['.pdf', '.epub'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF and EPUB files are allowed'));
  }
};

const uploadEbook = multer({
  storage: ebookStorage,
  fileFilter: ebookFilter,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 100 * 1024 * 1024 }
});

// E-book bundle: PDF/EPUB file + optional cover image
const ebookBundleStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, file.fieldname === 'cover' ? coversDir : ebooksDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}_${uuidv4()}${ext}`);
  }
});

const ebookBundleFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (file.fieldname === 'file' && ['.pdf', '.epub'].includes(ext)) return cb(null, true);
  if (file.fieldname === 'cover' && ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)) return cb(null, true);
  cb(new Error(file.fieldname === 'cover' ? 'Cover must be an image (jpg, png, gif, webp)' : 'Only PDF and EPUB files are allowed'));
};

const uploadEbookBundle = multer({
  storage: ebookBundleStorage,
  fileFilter: ebookBundleFilter,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 100 * 1024 * 1024 }
});

// General upload (used for book covers / card images)
const generalStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, qrcardsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}_${uuidv4()}${ext}`);
  }
});

const uploadGeneral = multer({
  storage: generalStorage,
  limits: { fileSize: 5 * 1024 * 1024 }
});

// Profile image upload config
const profileStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, profilesDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `profile_${req.user.id}_${Date.now()}${ext}`);
  }
});

const profileFilter = (req, file, cb) => {
  const allowed = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (jpg, png, gif, webp) are allowed'));
  }
};

const uploadProfile = multer({
  storage: profileStorage,
  fileFilter: profileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }
});

module.exports = { uploadEbook, uploadEbookBundle, uploadGeneral, uploadProfile, ebooksDir, qrcardsDir, profilesDir, coversDir };
