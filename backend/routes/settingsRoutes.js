const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const { auth, requireRole } = require('../middleware/auth');

// Public — the login page checks whether email/password sign-in is allowed
router.get('/email-login', settingsController.getEmailLogin);

// Librarian-only — grant/revoke the email/password option for members
router.put('/email-login', auth, requireRole('LIBRARIAN'), settingsController.setEmailLogin);

module.exports = router;