const express = require('express');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Serve uploads (qrcards) statically - QR images are fine to serve
router.use('/qrcards', express.static(path.join(__dirname, '..', 'uploads', 'qrcards')));

// Export endpoint to allow downloading QR card as image with auth
const { auth } = require('../middleware/auth');
const { pool } = require('../config/db');

router.get('/card/:userId', auth, async (req, res) => {
  try {
    const userId = req.user.role === 'LIBRARIAN' ? req.params.userId : req.user.id;
    const [cards] = await pool.query(
      `SELECT qr_code_url FROM customer_cards WHERE user_id = ? AND status = 'ACTIVE' ORDER BY id DESC LIMIT 1`,
      [userId]
    );
    if (cards.length === 0) return res.status(404).json({ success: false, message: 'No QR card' });

    const filePath = path.join(__dirname, '..', 'uploads', 'qrcards', path.basename(cards[0].qr_code_url));
    if (!fs.existsSync(filePath)) return res.status(404).json({ success: false, message: 'File not found' });

    res.setHeader('Content-Disposition', `attachment; filename="qr_${userId}.png"`);
    res.sendFile(filePath);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
