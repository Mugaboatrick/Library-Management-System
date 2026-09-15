const express = require('express');
const router = express.Router();
const { register, login, loginWithQR, getMe, changePassword, uploadProfileImage, removeProfileImage } = require('../controllers/authController');
const { auth, requireRole } = require('../middleware/auth');
const { uploadProfile } = require('../middleware/upload');

// Account creation is librarian-only. Members (students/teachers/guests)
// sign in by scanning their QR access cards.
router.post('/register', auth, requireRole('LIBRARIAN'), register);
router.post('/login', login);
router.post('/login/qr', loginWithQR);
router.get('/me', auth, getMe);
router.put('/profile-image', auth, uploadProfile.single('image'), uploadProfileImage);
router.delete('/profile-image', auth, removeProfileImage);
router.put('/change-password', auth, changePassword);

module.exports = router;
