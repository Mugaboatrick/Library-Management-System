const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');
const { generateCustomerId, generateCardNumber } = require('../utils/customerUtils');
const { generateCustomerQR } = require('../utils/qrGenerator');
const { getBorrowLimit } = require('../utils/fineUtils');

// List all users with optional role filter
exports.listUsers = async (req, res) => {
  try {
    const { role, status, search, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let where = [];
    let params = [];

    if (role) { where.push('role = ?'); params.push(String(role).toUpperCase()); }
    if (status) { where.push('status = ?'); params.push(String(status).toUpperCase()); }
    if (search) {
      where.push('(first_name LIKE ? OR last_name LIKE ? OR email LIKE ? OR customer_id LIKE ?)');
      const s = `%${search}%`;
      params.push(s, s, s, s);
    }

    const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const [[count]] = await pool.query(
      `SELECT COUNT(*) AS total FROM users ${whereClause}`, params
    );

    const [rows] = await pool.query(
      `SELECT id, first_name, last_name, email, phone, role, customer_id, status, blocked_reason,
              created_at,
              (SELECT COUNT(*) FROM borrowings b WHERE b.user_id = users.id AND b.status IN ('BORROWED','OVERDUE')) AS active_borrowings
       FROM users ${whereClause}
       ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    res.json({
      success: true,
      data: rows,
      pagination: { total: count?.total || 0, page: parseInt(page), limit: parseInt(limit) }
    });
  } catch (err) {
    console.error('List users error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get single user detail with borrowings & fines
exports.getUser = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.query(
      `SELECT id, first_name, last_name, email, phone, role, customer_id, status, blocked_reason, created_at
       FROM users WHERE id = ?`, [id]
    );
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'User not found' });

    const [cards] = await pool.query(
      `SELECT * FROM customer_cards WHERE user_id = ? ORDER BY id DESC LIMIT 1`, [id]
    );

    const [borrowings] = await pool.query(
      `SELECT b.*, bc.copy_code, bk.title
       FROM borrowings b
       JOIN book_copies bc ON bc.id = b.copy_id
       JOIN books bk ON bk.id = bc.book_id
       WHERE b.user_id = ?
       ORDER BY b.borrow_date DESC LIMIT 20`, [id]
    );

    const [fines] = await pool.query(
      `SELECT * FROM fines WHERE user_id = ? ORDER BY created_at DESC LIMIT 20`, [id]
    );

    res.json({
      success: true,
      user: rows[0],
      card: cards[0] || null,
      borrowings,
      fines
    });
  } catch (err) {
    console.error('Get user error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Create user manually (librarian) - incl. guest temporary account
exports.createUser = async (req, res) => {
  try {
    const { first_name, last_name, email, phone, password, role } = req.body;

    if (!first_name || !last_name || !email || !role) {
      return res.status(400).json({ success: false, message: 'Required fields missing' });
    }

    const allowedRole = String(role).toUpperCase();
    if (!['STUDENT', 'TEACHER', 'GUEST'].includes(allowedRole)) {
      return res.status(400).json({ success: false, message: 'Role must be STUDENT, TEACHER, or GUEST' });
    }

    const [exist] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (exist.length > 0) return res.status(409).json({ success: false, message: 'Email already exists' });

    const hashed = password ? await bcrypt.hash(password, 10) : await bcrypt.hash('guest123', 10);
    const customerId = await generateCustomerId(allowedRole);

    const [result] = await pool.query(
      `INSERT INTO users (first_name, last_name, email, phone, password, role, customer_id, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'ACTIVE')`,
      [first_name, last_name, email, phone || null, hashed, allowedRole, customerId]
    );

    const userId = result.insertId;
    const cardNumber = generateCardNumber(customerId);
    const qr = await generateCustomerQR(customerId, userId, {
      full_name: `${first_name} ${last_name}`.trim(),
      role: allowedRole,
      email,
      phone: phone || undefined,
      card_number: cardNumber
    });

    await pool.query(
      `INSERT INTO customer_cards (user_id, card_number, qr_code_url, qr_code_data, status)
       VALUES (?, ?, ?, ?, 'ACTIVE')`,
      [userId, cardNumber, qr.url, qr.data]
    );

    await pool.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
       VALUES (?, 'USER_CREATED', 'USER', ?, ?)`,
      [req.user.id, userId, `Librarian created ${allowedRole} ${customerId}`]
    );

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: { id: userId, customer_id: customerId, card_number: cardNumber, qr_code_url: qr.url }
    });
  } catch (err) {
    console.error('Create user error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Update user (role, personal info, status)
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { first_name, last_name, email, phone, role, status } = req.body;

    const [exist] = await pool.query('SELECT id FROM users WHERE id = ?', [id]);
    if (exist.length === 0) return res.status(404).json({ success: false, message: 'User not found' });

    await pool.query(
      `UPDATE users SET first_name = COALESCE(?, first_name),
        last_name = COALESCE(?, last_name),
        email = COALESCE(?, email),
        phone = COALESCE(?, phone),
        role = COALESCE(?, role),
        status = COALESCE(?, status)
       WHERE id = ?`,
      [first_name, last_name, email, phone, role, status, id]
    );

    await pool.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
       VALUES (?, 'USER_UPDATED', 'USER', ?, ?)`,
      [req.user.id, id, JSON.stringify(req.body)]
    );

    res.json({ success: true, message: 'User updated' });
  } catch (err) {
    console.error('Update user error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get QR card for a user & regenerate
exports.getQRCards = async (req, res) => {
  try {
    const { id } = req.params;
    const [cards] = await pool.query(
      `SELECT cc.*, u.first_name, u.last_name, u.customer_id, u.role, u.email
       FROM customer_cards cc JOIN users u ON u.id = cc.user_id
       WHERE cc.user_id = ? ORDER BY cc.id DESC`, [id]
    );
    res.json({ success: true, data: cards });
  } catch (err) {
    console.error('Get QR cards error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.regenerateQR = async (req, res) => {
  try {
    const { user_id } = req.params;
    const [userRows] = await pool.query(
      'SELECT customer_id, first_name, last_name, email, phone, role FROM users WHERE id = ?', [user_id]
    );
    if (userRows.length === 0) return res.status(404).json({ success: false, message: 'User not found' });
    const usr = userRows[0];

    const cardNumber = generateCardNumber(usr.customer_id);
    const qr = await generateCustomerQR(usr.customer_id, parseInt(user_id), {
      full_name: `${usr.first_name} ${usr.last_name}`.trim(),
      role: usr.role,
      email: usr.email,
      phone: usr.phone || undefined,
      card_number: cardNumber
    });

    const [result] = await pool.query(
      `INSERT INTO customer_cards (user_id, card_number, qr_code_url, qr_code_data, status)
       VALUES (?, ?, ?, ?, 'ACTIVE')`,
      [parseInt(user_id), cardNumber, qr.url, qr.data]
    );

    // Deactivate old cards
    await pool.query(
      `UPDATE customer_cards SET status = 'REPLACED'
       WHERE user_id = ? AND id != ?`, [parseInt(user_id), result.insertId]
    );

    await pool.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
       VALUES (?, 'QR_REGENERATED', 'CARD', ?, ?)`,
      [req.user.id, result.insertId, userRows[0].customer_id]
    );

    res.status(201).json({
      success: true,
      message: 'QR card regenerated',
      card: { id: result.insertId, card_number: cardNumber, qr_code_url: qr.url }
    });
  } catch (err) {
    console.error('Regenerate QR error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.deleteCard = async (req, res) => {
  try {
    const { id, cardId } = req.params;
    const [card] = await pool.query('SELECT id, user_id FROM customer_cards WHERE id = ? AND user_id = ?', [cardId, id]);
    if (card.length === 0) return res.status(404).json({ success: false, message: 'Card not found' });

    await pool.query('DELETE FROM customer_cards WHERE id = ?', [cardId]);

    await pool.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
       VALUES (?, 'QR_DELETED', 'CARD', ?, ?)`,
      [req.user.id, cardId, `Deleted card ${cardId} for user ${id}`]
    );

    res.json({ success: true, message: 'Card deleted' });
  } catch (err) {
    console.error('Delete card error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.updateCard = async (req, res) => {
  try {
    const { id, cardId } = req.params;
    const { status, card_number } = req.body;

    const [card] = await pool.query('SELECT id FROM customer_cards WHERE id = ? AND user_id = ?', [cardId, id]);
    if (card.length === 0) return res.status(404).json({ success: false, message: 'Card not found' });

    if (status) {
      await pool.query('UPDATE customer_cards SET status = ? WHERE id = ?', [status.toUpperCase(), cardId]);
    }
    if (card_number) {
      await pool.query('UPDATE customer_cards SET card_number = ? WHERE id = ?', [card_number, cardId]);
    }

    await pool.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
       VALUES (?, 'QR_UPDATED', 'CARD', ?, ?)`,
      [req.user.id, cardId, JSON.stringify(req.body)]
    );

    res.json({ success: true, message: 'Card updated' });
  } catch (err) {
    console.error('Update card error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Block/unblock user based on fines
exports.toggleBlock = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;

    if (!['ACTIVE', 'BLOCKED', 'SUSPENDED'].includes(String(status).toUpperCase())) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    await pool.query(
      `UPDATE users SET status = ?, blocked_reason = ? WHERE id = ?`,
      [String(status).toUpperCase(), reason || null, id]
    );

    res.json({ success: true, message: `User ${String(status).toUpperCase()}` });
  } catch (err) {
    console.error('Toggle block error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Dashboard stats (borrow limit helper exposed)
exports.getBorrowLimitInfo = (req, res) => {
  res.json({
    success: true,
    limits: {
      STUDENT: getBorrowLimit('STUDENT'),
      TEACHER: getBorrowLimit('TEACHER'),
      GUEST: getBorrowLimit('GUEST')
    }
  });
};
