const { pool } = require('../config/db');

// List the signed-in user's notifications
async function getMyNotifications(req, res) {
  try {
    const userId = req.user.id;
    const { search, status, limit = 500 } = req.query;

    let where = 'user_id = ?';
    let params = [userId];

    if (search) {
      where += ' AND (title LIKE ? OR message LIKE ? OR type LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s, s);
    }
    if (status === 'unread') where += ' AND is_read = 0';
    else if (status === 'read') where += ' AND is_read = 1';

    const [rows] = await pool.query(
      `SELECT id, type, title, message, data, is_read, created_at
       FROM notifications
       WHERE ${where}
       ORDER BY created_at DESC
       LIMIT ?`,
      [...params, parseInt(limit) || 500]
    );
    const [[unreadRow]] = await pool.query(
      `SELECT COUNT(*) AS unread FROM notifications WHERE user_id = ? AND is_read = 0`, [userId]
    );
    res.json({ success: true, data: rows, unread: unreadRow?.unread || 0 });
  } catch (err) {
    console.error('Get notifications error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

// Mark one notification as read
async function markRead(req, res) {
  try {
    const { id } = req.params;
    await pool.query(
      `UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?`,
      [id, req.user.id]
    );
    res.json({ success: true, message: 'Notification marked as read' });
  } catch (err) {
    console.error('Mark notification read error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

// Mark all notifications as read
async function markAllRead(req, res) {
  try {
    await pool.query(
      `UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0`,
      [req.user.id]
    );
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (err) {
    console.error('Mark all notifications read error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

// Helper used by other controllers (cron, borrow, etc.) to persist + notify
async function createNotification({ userId, type, title, message, data, emitEvent, payload }) {
  try {
    const [result] = await pool.query(
      `INSERT INTO notifications (user_id, type, title, message, data)
       VALUES (?, ?, ?, ?, ?)`,
      [userId, type, title, message, data ? JSON.stringify(data) : null]
    );
    if (emitEvent) {
      const { emitToUser } = require('../utils/socket');
      emitToUser(userId, emitEvent, payload || { title, message });
    }
    return result.insertId;
  } catch (err) {
    console.error('Create notification error:', err);
    return null;
  }
}

module.exports = { getMyNotifications, markRead, markAllRead, createNotification };