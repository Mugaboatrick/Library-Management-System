const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');
const { pool } = require('../config/db');
const { generateCustomerId, generateCardNumber } = require('../utils/customerUtils');
const { generateCustomerQR, decryptPayload } = require('../utils/qrGenerator');
const settingsController = require('./settingsController');
const { passwordStrengthError } = require('../utils/passwordStrength');

// Register a new user (student/teacher register themselves; guest created by librarian)
exports.register = async (req, res) => {
  try {
    const { first_name, last_name, email, phone, password, role = 'STUDENT', class_name } = req.body;

    if (!first_name || !last_name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields' });
    }

    const pwError = passwordStrengthError(password);
    if (pwError) {
      return res.status(400).json({ success: false, message: pwError });
    }

    const allowedRole = String(role).toUpperCase();
    if (!['STUDENT', 'TEACHER', 'GUEST'].includes(allowedRole)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }

    // Check if email exists
    const [exist] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (exist.length > 0) {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const customerId = await generateCustomerId(allowedRole);

    const [result] = await pool.query(
      `INSERT INTO users (first_name, last_name, email, phone, password, role, customer_id, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'ACTIVE')`,
      [first_name, last_name, email, phone || null, hashedPassword, allowedRole, customerId]
    );

    const userId = result.insertId;

    // Generate QR card (with full member info embedded)
    const cardNumber = generateCardNumber(customerId);
    const qr = await generateCustomerQR(customerId, userId, {
      first_name,
      last_name,
      full_name: `${first_name} ${last_name}`.trim(),
      role: allowedRole,
      email,
      phone: phone || undefined,
      status: 'ACTIVE',
      class_name: allowedRole === 'STUDENT' ? (class_name || undefined) : undefined,
      card_number: cardNumber
    });

    await pool.query(
      `INSERT INTO customer_cards (user_id, card_number, qr_code_url, qr_code_data, status)
       VALUES (?, ?, ?, ?, 'ACTIVE')`,
      [userId, cardNumber, qr.url, qr.data]
    );

    // Audit log
    await pool.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
       VALUES (?, 'USER_REGISTER', 'USER', ?, ?)`,
      [userId, userId, `Registered as ${allowedRole} with ${customerId}`]
    );

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      user: { id: userId, first_name, last_name, email, role: allowedRole, customer_id: customerId }
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// Login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password required' });
    }

    const [rows] = await pool.query(
      `SELECT id, first_name, last_name, email, phone, role, customer_id, status, profile_image, password
       FROM users WHERE email = ?`,
      [email]
    );

    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (user.status === 'BLOCKED') {
      return res.status(403).json({
        success: false,
        message: `Account blocked: ${user.blocked_reason || 'Outstanding fines'}`
      });
    }

    // Email & password sign-in for members is only allowed when the library
    // manager has granted it (librarians always have email login).
    if (user.role !== 'LIBRARIAN' && !settingsController.isEmailLoginAllowed()) {
      return res.status(403).json({
        success: false,
        message: 'Email & password login is disabled. Sign in by scanning your QR card.'
      });
    }

    // Generate token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Fetch QR card
    const [cards] = await pool.query(
      `SELECT id, card_number, qr_code_url, status FROM customer_cards WHERE user_id = ? ORDER BY id DESC LIMIT 1`,
      [user.id]
    );

    await pool.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
       VALUES (?, 'USER_LOGIN', 'USER', ?, 'Login successful')`,
      [user.id, user.id]
    );

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        customer_id: user.customer_id,
        status: user.status,
        profile_image: user.profile_image,
        card: cards[0] || null
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Login via QR code scan (primary method)
exports.loginWithQR = async (req, res) => {
  try {
    const qr_code = req.body.qr_code || req.body.qr_data;
    if (!qr_code) {
      return res.status(400).json({ success: false, message: 'QR code data is required' });
    }

    // Strip non-printable characters a camera can inject (BOM, ZWSP, etc.)
    // without flattening the label/value structure of the printed member card.
    const rawQr = String(qr_code)
      .replace(/[\uFEFF\u200B-\u200D\u2060]/g, '')
      .replace(/\r\n?/g, '\n')
      .trim();
    // Diagnose camera-vs-test mismatches: dump exact char codes so an
    // invisible character in the scanned text becomes visible.
    if (!/^(STU|TCH|GST|LIB)\d+$/i.test(rawQr)) {
      const codes = Array.from(String(qr_code).slice(0, 40)).map(c => c.charCodeAt(0));
      console.log('[QR-LOGIN] scan len=' + String(qr_code).length + ' preview=' + JSON.stringify(rawQr.slice(0, 160)) + ' codes=' + JSON.stringify(codes));
    }
    const payload = decryptPayload(rawQr);
    let customerId = payload ? payload.customer_id : null;

    // Fallback for older or vendor-issued cards: a QR can contain only a serial
    // number, a card number, or a member ID. Match those against the current
    // user and card records before rejecting the scan.
    if (!customerId) {
      const serialDigits = rawQr.replace(/\D+/g, '');
      const candidateValues = Array.from(new Set([
        rawQr,
        rawQr.toUpperCase(),
        rawQr.toLowerCase(),
        serialDigits,
        rawQr.replace(/[^A-Za-z0-9]/g, '')
      ].filter(Boolean)));

      const directValues = candidateValues.filter(Boolean);
      const serialLike = serialDigits.length >= 4 ? `%${serialDigits}%` : `%${directValues[0] || ''}%`;

      if (directValues.length > 0 || serialDigits.length >= 4) {
        const conds = [];
        const args = [];

        if (directValues.length > 0) {
          const p = directValues.map(() => '?').join(', ');
          conds.push(`u.customer_id IN (${p})`);
          args.push(...directValues);
          conds.push(`u.physical_card_no IN (${p})`);
          args.push(...directValues);
        }
        conds.push('u.customer_id LIKE ?');
        args.push(serialLike);
        conds.push('u.physical_card_no LIKE ?');
        args.push(serialLike);
        conds.push(
          `EXISTS (
             SELECT 1 FROM customer_cards cc
             WHERE cc.user_id = u.id
               AND (cc.card_number = ?
                    OR cc.card_number LIKE ?
                    OR cc.qr_code_data LIKE ?
                    OR cc.qr_code_url LIKE ?)
           )`
        );
        args.push(directValues[0] || '', serialLike, serialLike, serialLike);

        const [bySerial] = await pool.query(
          `SELECT u.id, u.first_name, u.last_name, u.email, u.phone, u.role, u.customer_id, u.status, u.profile_image
           FROM users u
           WHERE ${conds.join(' OR ')}
           ORDER BY u.id ASC
           LIMIT 1`,
          args
        );

        if (bySerial.length > 0) {
          customerId = bySerial[0].customer_id;
        }
      }
    }

    if (!customerId) {
      console.log('[QR-LOGIN] -> REJECTED (no payload/customer_id) input=' + JSON.stringify(rawQr.slice(0, 200)));
      const preview = rawQr.length > 120 ? rawQr.slice(0, 120) + '...' : rawQr;
      return res.status(400).json({
        success: false,
        message: 'Invalid or tampered QR code',
        received: preview
      });
    }

    // Lookup user by customer_id
    const [rows] = await pool.query(
      `SELECT id, first_name, last_name, email, phone, role, customer_id, status, profile_image
       FROM users WHERE customer_id = ?`,
      [customerId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    const user = rows[0];

    if (user.status === 'BLOCKED') {
      return res.status(403).json({
        success: false,
        message: `Account blocked: ${user.blocked_reason || 'Outstanding fines'}`
      });
    }

    // Generate token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Fetch QR card
    const [cards] = await pool.query(
      `SELECT id, card_number, qr_code_url, status FROM customer_cards WHERE user_id = ? ORDER BY id DESC LIMIT 1`,
      [user.id]
    );

    await pool.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
       VALUES (?, 'USER_LOGIN_QR', 'USER', ?, 'Logged in via QR code')`,
      [user.id, user.id]
    );

    res.json({
      success: true,
      message: 'Login successful (QR code)',
      token,
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        customer_id: user.customer_id,
        status: user.status,
        profile_image: user.profile_image,
        card: cards[0] || null
      }
    });
  } catch (err) {
    console.error('QR login error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Regenerate the logged-in user's own QR card (self-service)
exports.regenerateMyQR = async (req, res) => {
  try {
    const userId = req.user.id;
    const [userRows] = await pool.query(
      'SELECT customer_id, first_name, last_name, email, phone, status, class_name, role, created_at FROM users WHERE id = ?', [userId]
    );
    if (userRows.length === 0) return res.status(404).json({ success: false, message: 'User not found' });
    const usr = userRows[0];

    // Generate fresh QR card with full member info
    const cardNumber = generateCardNumber(usr.customer_id);
    const qr = await generateCustomerQR(usr.customer_id, userId, {
      first_name: usr.first_name,
      last_name: usr.last_name,
      full_name: `${usr.first_name} ${usr.last_name}`.trim(),
      role: usr.role,
      email: usr.email,
      phone: usr.phone || undefined,
      status: usr.status,
      class_name: usr.role === 'STUDENT' ? (usr.class_name || undefined) : undefined,
      card_number: cardNumber,
      created_at: usr.created_at
    });

    const [result] = await pool.query(
      `INSERT INTO customer_cards (user_id, card_number, qr_code_url, qr_code_data, status)
       VALUES (?, ?, ?, ?, 'ACTIVE')`,
      [userId, cardNumber, qr.url, qr.data]
    );

    // Deactivate old cards
    await pool.query(
      `UPDATE customer_cards SET status = 'REPLACED'
       WHERE user_id = ? AND id != ?`, [userId, result.insertId]
    );

    await pool.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
       VALUES (?, 'QR_REGENERATED_SELF', 'CARD', ?, 'User regenerated own QR card')`,
      [userId, result.insertId]
    );

    res.status(201).json({
      success: true,
      message: 'QR card regenerated',
      card: { id: result.insertId, card_number: cardNumber, qr_code_url: qr.url, qr_code_data: qr.data }
    });
  } catch (err) {
    console.error('Regenerate QR error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get current user profile
exports.getMe = async (req, res) => {
  try {
    const userId = req.user.id;

    const [rows] = await pool.query(
`SELECT id, first_name, last_name, email, phone, profile_image, role, role_id, customer_id, status, class_name,
blocked_reason, created_at
       FROM users WHERE id = ?`,
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const [cards] = await pool.query(
      `SELECT id, card_number, qr_code_url, qr_code_data, status, issued_at
       FROM customer_cards WHERE user_id = ? ORDER BY id DESC LIMIT 1`,
      [userId]
    );

    // Current borrowing count
    const [[borrowCount]] = await pool.query(
      `SELECT COUNT(*) AS count FROM borrowings WHERE user_id = ? AND status IN ('BORROWED','OVERDUE')`,
      [userId]
    );

    const [fines] = await pool.query(
      `SELECT COALESCE(SUM(amount),0) AS total_unpaid FROM fines WHERE user_id = ? AND status = 'UNPAID'`,
      [userId]
    );

    res.json({
      success: true,
      user: rows[0],
      card: cards[0] || null,
      activeBorrowings: borrowCount?.count || 0,
      unpaidFines: parseFloat(fines[0]?.total_unpaid || 0)
    });
  } catch (err) {
    console.error('Get me error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Upload / update profile image
exports.uploadProfileImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file provided' });
    }

    const userId = req.user.id;
    const urlPath = `/uploads/profiles/${req.file.filename}`;

    // Remove previous profile image file if any
    const [prev] = await pool.query('SELECT profile_image FROM users WHERE id = ?', [userId]);
    if (prev[0]?.profile_image) {
      const oldFile = path.join(__dirname, '..', prev[0].profile_image.replace(/^\/uploads/, 'uploads'));
      fs.unlink(oldFile, () => {});
    }

    await pool.query('UPDATE users SET profile_image = ? WHERE id = ?', [urlPath, userId]);

    res.json({ success: true, message: 'Profile image updated', profile_image: urlPath });
  } catch (err) {
    console.error('Upload profile image error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Remove profile image
exports.removeProfileImage = async (req, res) => {
  try {
    const userId = req.user.id;
    const [prev] = await pool.query('SELECT profile_image FROM users WHERE id = ?', [userId]);

    if (!prev[0]?.profile_image) {
      return res.json({ success: true, message: 'No profile image set' });
    }

    const oldFile = path.join(__dirname, '..', prev[0].profile_image.replace(/^\/uploads/, 'uploads'));
    fs.unlink(oldFile, () => {});

    await pool.query('UPDATE users SET profile_image = NULL WHERE id = ?', [userId]);
    res.json({ success: true, message: 'Profile image removed' });
  } catch (err) {
    console.error('Remove profile image error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Change password
exports.changePassword = async (req, res) => {
  try {
    const { old_password, new_password } = req.body;
    const userId = req.user.id;

    if (!old_password || !new_password) {
      return res.status(400).json({ success: false, message: 'Old and new password required' });
    }

    const pwError = passwordStrengthError(new_password);
    if (pwError) {
      return res.status(400).json({ success: false, message: pwError });
    }

    const [rows] = await pool.query('SELECT password FROM users WHERE id = ?', [userId]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const valid = await bcrypt.compare(old_password, rows[0].password);
    if (!valid) {
      return res.status(400).json({ success: false, message: 'Old password is incorrect' });
    }

    const hashed = await bcrypt.hash(new_password, 10);
    await pool.query('UPDATE users SET password = ? WHERE id = ?', [hashed, userId]);

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
