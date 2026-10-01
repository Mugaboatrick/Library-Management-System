const { pool } = require('../config/db');
const { createNotification } = require('./notificationController');
const { emitToUser } = require('../utils/socket');

const MESSAGE_QUERY = `
  SELECT m.id, m.sender_id, m.recipient_id, m.subject, m.body, m.is_read, m.created_at,
         s.first_name AS sender_first_name, s.last_name AS sender_last_name,
         s.customer_id AS sender_customer_id, s.role AS sender_role,
         r.first_name AS recipient_first_name, r.last_name AS recipient_last_name,
         r.customer_id AS recipient_customer_id, r.role AS recipient_role
  FROM messages m
  JOIN users s ON s.id = m.sender_id
  JOIN users r ON r.id = m.recipient_id
`;

// Resolve recipient: accept recipient_id or customer_id (QR scan friendly)
async function resolveRecipient(req, res) {
  const { recipient_id, customer_id } = req.body;
  if (recipient_id) {
    const [[row]] = await pool.query('SELECT id, role, status FROM users WHERE id = ?', [recipient_id]);
    return row;
  }
  if (customer_id) {
    const [[row]] = await pool.query('SELECT id, role, status FROM users WHERE customer_id = ?', [String(customer_id).toUpperCase()]);
    return row;
  }
  return null;
}

// Send a message to another user
async function send(req, res) {
  const { subject, body } = req.body;
  if (!body || !String(body).trim()) {
    return res.status(400).json({ success: false, message: 'Message body is required' });
  }

  try {
    const recipient = await resolveRecipient(req, res);
    if (!recipient) {
      return res.status(400).json({ success: false, message: 'Recipient not found. Provide a valid user ID or customer ID.' });
    }
    if (recipient.id === req.user.id) {
      return res.status(400).json({ success: false, message: 'You cannot send a message to yourself' });
    }

    const [result] = await pool.query(
      `INSERT INTO messages (sender_id, recipient_id, subject, body)
       VALUES (?, ?, ?, ?)`,
      [req.user.id, recipient.id, String(subject || '').trim() || 'Message', String(body).trim()]
    );

    const [[msg]] = await pool.query(
      `${MESSAGE_QUERY} WHERE m.id = ?`, [result.insertId]
    );

    // Live socket ping to the recipient + persisted bell notification
    emitToUser(recipient.id, 'new_message', {
      id: msg.id,
      sender_id: msg.sender_id,
      subject: msg.subject,
      body: msg.body,
      from: `${msg.sender_first_name} ${msg.sender_last_name}`,
      sender_customer_id: msg.sender_customer_id
    });
    await createNotification({
      userId: recipient.id,
      type: 'NEW_MESSAGE',
      title: `New message from ${msg.sender_first_name} ${msg.sender_last_name}`,
      message: `${msg.body.length > 120 ? msg.body.slice(0, 120) + '…' : msg.body}`,
      emitEvent: null,
      payload: null
    });

    res.status(201).json({ success: true, data: msg, message: 'Message sent' });
  } catch (err) {
    console.error('Send message error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

// List messages sent to me (inbox)
async function inbox(req, res) {
  try {
    const [rows] = await pool.query(
      `${MESSAGE_QUERY} WHERE m.recipient_id = ? AND m.recipient_deleted = 0
       ORDER BY m.created_at DESC LIMIT 200`,
      [req.user.id]
    );
    const [[unreadRow]] = await pool.query(
      `SELECT COUNT(*) AS unread FROM messages WHERE recipient_id = ? AND is_read = 0 AND recipient_deleted = 0`, [req.user.id]
    );
    res.json({ success: true, data: rows, unread: unreadRow?.unread || 0 });
  } catch (err) {
    console.error('Get inbox error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

// List messages I sent
async function sent(req, res) {
  try {
    const [rows] = await pool.query(
      `${MESSAGE_QUERY} WHERE m.sender_id = ? AND m.sender_deleted = 0
       ORDER BY m.created_at DESC LIMIT 200`,
      [req.user.id]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('Get sent error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

// Mark a single inbox message as read
async function markRead(req, res) {
  try {
    const { id } = req.params;
    await pool.query(
      `UPDATE messages SET is_read = 1 WHERE id = ? AND recipient_id = ?`,
      [id, req.user.id]
    );
    res.json({ success: true, message: 'Message marked as read' });
  } catch (err) {
    console.error('Mark message read error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

// Mark all inbox messages as read
async function markAllRead(req, res) {
  try {
    await pool.query(
      `UPDATE messages SET is_read = 1 WHERE recipient_id = ? AND is_read = 0 AND recipient_deleted = 0`,
      [req.user.id]
    );
    res.json({ success: true, message: 'All messages marked as read' });
  } catch (err) {
    console.error('Mark all messages read error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

// Delete a message (soft delete per side, hard delete when both sides deleted)
async function remove(req, res) {
  try {
    const { id } = req.params;
    const [[msg]] = await pool.query(
      `SELECT sender_id, recipient_id FROM messages WHERE id = ?`, [id]
    );
    if (!msg) return res.status(404).json({ success: false, message: 'Message not found' });

    if (msg.sender_id === req.user.id) {
      await pool.query('UPDATE messages SET sender_deleted = 1 WHERE id = ?', [id]);
    } else if (msg.recipient_id === req.user.id) {
      await pool.query('UPDATE messages SET recipient_deleted = 1 WHERE id = ?', [id]);
    } else {
      return res.status(403).json({ success: false, message: 'Not allowed to delete this message' });
    }

    const [[after]] = await pool.query(
      `SELECT sender_deleted, recipient_deleted FROM messages WHERE id = ?`, [id]
    );
    if (after.sender_deleted && after.recipient_deleted) {
      await pool.query('DELETE FROM messages WHERE id = ?', [id]);
    }

    res.json({ success: true, message: 'Message deleted' });
  } catch (err) {
    console.error('Delete message error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

module.exports = { send, inbox, sent, markRead, markAllRead, remove };