const { pool } = require('../config/db');
const { updateUserBlockStatus, DAILY_RATE, BLOCK_THRESHOLD, DAMAGE_RATE, LOSS_RATE, OVERDUE_DAYS_THRESHOLD } = require('../utils/fineUtils');

// List all fines (admin)
exports.listFines = async (req, res) => {
  try {
    const { status, user_id, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let where = [];
    let params = [];
    if (status) { where.push('f.status = ?'); params.push(String(status).toUpperCase()); }
    if (user_id) { where.push('f.user_id = ?'); params.push(user_id); }
    const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const [[count]] = await pool.query(`SELECT COUNT(*) AS total FROM fines f ${whereClause}`, params);

    const [rows] = await pool.query(
      `SELECT f.*, u.first_name, u.last_name, u.customer_id, u.email, bk.title, bc.copy_code
       FROM fines f
       LEFT JOIN users u ON u.id = f.user_id
       LEFT JOIN borrowings b ON b.id = f.borrowing_id
       LEFT JOIN book_copies bc ON bc.id = b.copy_id
       LEFT JOIN books bk ON bk.id = bc.book_id
       ${whereClause}
       ORDER BY f.created_at DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    res.json({ success: true, data: rows, pagination: { total: count?.total || 0 } });
  } catch (err) {
    console.error('List fines error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get my fines
exports.myFines = async (req, res) => {
  try {
    const userId = req.user.id;
    const [rows] = await pool.query(
      `SELECT f.*, bk.title, bc.copy_code
       FROM fines f
       LEFT JOIN borrowings b ON b.id = f.borrowing_id
       LEFT JOIN book_copies bc ON bc.id = b.copy_id
       LEFT JOIN books bk ON bk.id = bc.book_id
       WHERE f.user_id = ?
       ORDER BY f.created_at DESC`, [userId]
    );

    const [[totals]] = await pool.query(
      `SELECT
        COALESCE(SUM(CASE WHEN status='UNPAID' THEN amount ELSE 0 END),0) AS unpaid,
        COALESCE(SUM(CASE WHEN status='PAID' THEN amount ELSE 0 END),0) AS paid,
        COALESCE(SUM(amount),0) AS total
       FROM fines WHERE user_id = ?`, [userId]
    );

    res.json({ success: true, data: rows, totals });
  } catch (err) {
    console.error('My fines error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Pay a fine
exports.payFine = async (req, res) => {
  try {
    const { fine_id } = req.params;
    const { amount, method = 'CASH', reference } = req.body;

    const [fineRows] = await pool.query('SELECT * FROM fines WHERE id = ?', [fine_id]);
    if (fineRows.length === 0) return res.status(404).json({ success: false, message: 'Fine not found' });
    const fine = fineRows[0];

    if (fine.status === 'PAID') return res.status(400).json({ success: false, message: 'Fine already paid' });

    const validMethods = ['CASH', 'MOBILE_MONEY', 'BANK_TRANSFER'];
    if (!validMethods.includes(String(method).toUpperCase())) {
      return res.status(400).json({ success: false, message: 'Method must be CASH, MOBILE_MONEY, or BANK_TRANSFER' });
    }

    // Record payment
    await pool.query(
      `INSERT INTO payments (user_id, fine_id, amount, method, reference, status, recorded_by)
       VALUES (?, ?, ?, ?, ?, 'COMPLETED', ?)`,
      [fine.user_id, fine.id, amount || fine.amount, String(method).toUpperCase(), reference || null, req.user.id]
    );

    // Mark fine as paid
    await pool.query(`UPDATE fines SET status = 'PAID', updated_at = NOW() WHERE id = ?`, [fine_id]);

    // Refresh user block status
    await updateUserBlockStatus(fine.user_id);

    // Unblock user if total below threshold
    const [[agg]] = await pool.query(
      `SELECT COALESCE(SUM(amount),0) AS total FROM fines WHERE user_id = ? AND status='UNPAID'`,
      [fine.user_id]
    );
    if (parseFloat(agg?.total || 0) < BLOCK_THRESHOLD) {
      const [usr] = await pool.query('SELECT status FROM users WHERE id = ?', [fine.user_id]);
      if (usr[0]?.status === 'BLOCKED') {
        await pool.query(`UPDATE users SET status = 'ACTIVE', blocked_reason = NULL WHERE id = ?`, [fine.user_id]);
      }
    }

    await pool.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
       VALUES (?, 'FINE_PAID', 'FINE', ?, ?)`,
      [req.user.id, fine_id, `${amount || fine.amount} via ${method}`]
    );

    res.json({ success: true, message: 'Fine paid successfully' });
  } catch (err) {
    console.error('Pay fine error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Pay all my unpaid fines (bulk)
exports.payAllMyFines = async (req, res) => {
  try {
    const { method = 'CASH', reference } = req.body;
    const userId = req.user.id;

    const [fines] = await pool.query(
      `SELECT * FROM fines WHERE user_id = ? AND status = 'UNPAID'`, [userId]
    );

    if (fines.length === 0) return res.status(400).json({ success: false, message: 'No unpaid fines' });

    const total = fines.reduce((s, f) => s + parseFloat(f.amount), 0);

    // Record a single payment covering all fines
    await pool.query(
      `INSERT INTO payments (user_id, fine_id, amount, method, reference, status, recorded_by)
       VALUES (?, NULL, ?, ?, ?, 'COMPLETED', ?)`,
      [userId, total, String(method).toUpperCase(), reference || null, userId]
    );

    const ids = fines.map(f => f.id);
    await pool.query(
      `UPDATE fines SET status = 'PAID', updated_at = NOW() WHERE id IN (?)`, [ids]
    );

    await pool.query(
      `UPDATE users SET status = 'ACTIVE', blocked_reason = NULL WHERE id = ?`, [userId]
    );

    await pool.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
       VALUES (?, 'BULK_FINE_PAID', 'FINE', NULL, ?)`,
      [userId, `Paid ${fines.length} fines totaling ${total}`]
    );

    res.json({ success: true, message: `Paid ${fines.length} fines (${total} RWF)` });
  } catch (err) {
    console.error('Pay all fines error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Waive a fine (librarian)
exports.waiveFine = async (req, res) => {
  try {
    const { fine_id } = req.params;
    const { reason } = req.body;

    const [fineRows] = await pool.query('SELECT * FROM fines WHERE id = ?', [fine_id]);
    if (fineRows.length === 0) return res.status(404).json({ success: false, message: 'Fine not found' });
    if (fineRows[0].status === 'PAID') return res.status(400).json({ success: false, message: 'Fine already paid' });

    await pool.query(`UPDATE fines SET status = 'WAIVED', updated_at = NOW() WHERE id = ?`, [fine_id]);
    await updateUserBlockStatus(fineRows[0].user_id);

    await pool.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
       VALUES (?, 'FINE_WAIVED', 'FINE', ?, ?)`,
      [req.user.id, fine_id, reason || 'No reason given']
    );

    res.json({ success: true, message: 'Fine waived' });
  } catch (err) {
    console.error('Waive fine error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Payment history
exports.listPayments = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT p.*, u.first_name, u.last_name, u.customer_id
       FROM payments p JOIN users u ON u.id = p.user_id
       ORDER BY p.paid_at DESC LIMIT 100`
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('List payments error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get fine settings
exports.getSettings = (req, res) => {
  res.json({
    success: true,
    daily_rate: DAILY_RATE,
    block_threshold: BLOCK_THRESHOLD,
    damage_rate: DAMAGE_RATE,
    loss_rate: LOSS_RATE,
    overdue_days_threshold: OVERDUE_DAYS_THRESHOLD
  });
};
