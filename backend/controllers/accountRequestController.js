const { pool } = require('../config/db');

// Public — a member (student, teacher or guest) requests an account because
// they need another way to enter the library.
exports.createRequest = async (req, res) => {
  try {
    const { first_name, last_name, email, phone, role = 'STUDENT', message } = req.body;

    if (!first_name || !last_name || !email) {
      return res.status(400).json({ success: false, message: 'First name, last name and email are required' });
    }

    const allowedRoles = ['STUDENT', 'TEACHER', 'GUEST'];
    const reqRole = String(role).toUpperCase();
    if (!allowedRoles.includes(reqRole)) {
      return res.status(400).json({ success: false, message: 'Invalid account type' });
    }

    const [exist] = await pool.query(
      'SELECT id FROM account_requests WHERE email = ? AND status = ?',
      [email, 'PENDING']
    );
    if (exist.length > 0) {
      return res.status(400).json({ success: false, message: 'A request for this email is already waiting for the librarian.' });
    }

    const [result] = await pool.query(
      `INSERT INTO account_requests (first_name, last_name, email, phone, role, message, status)
       VALUES (?, ?, ?, ?, ?, ?, 'PENDING')`,
      [first_name, last_name, email, phone || null, reqRole, message || null]
    );

    res.status(201).json({
      success: true,
      message: 'Request sent. The librarian will review it and create your account.',
      request: { id: result.insertId, status: 'PENDING' }
    });
  } catch (err) {
    console.error('Create account request error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Librarian-only — list account requests (default PENDING)
exports.listRequests = async (req, res) => {
  try {
    const { status } = req.query;
    let sql = 'SELECT * FROM account_requests';
    const params = [];
    if (status && ['PENDING', 'APPROVED', 'REJECTED'].includes(String(status).toUpperCase())) {
      sql += ' WHERE status = ?';
      params.push(String(status).toUpperCase());
    }
    sql += ' ORDER BY created_at DESC';
    const [rows] = await pool.query(sql, params);
    res.json({ success: true, requests: rows });
  } catch (err) {
    console.error('List account requests error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Librarian-only — update status (PENDING / APPROVED / REJECTED) or restore
exports.updateRequestStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const newStatus = String(status || '').toUpperCase();
    if (!['PENDING', 'APPROVED', 'REJECTED'].includes(newStatus)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }
    const [result] = await pool.query(
      'UPDATE account_requests SET status = ? WHERE id = ?',
      [newStatus, id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }
    res.json({ success: true, message: `Request marked ${newStatus}`, id: Number(id), status: newStatus });
  } catch (err) {
    console.error('Update account request error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Librarian-only — delete a request
exports.deleteRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.query('DELETE FROM account_requests WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }
    res.json({ success: true, message: 'Request removed' });
  } catch (err) {
    console.error('Delete account request error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};