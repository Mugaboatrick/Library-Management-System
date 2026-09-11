const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');

// Authentication middleware - verifies JWT and loads user
async function auth(req, res, next) {
  try {
    let token;
    const header = req.headers.authorization;
    if (header && header.startsWith('Bearer ')) {
      token = header.split(' ')[1];
    } else if (req.query && req.query.token) {
      token = req.query.token; // support token via query for protected file streaming
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }

    const [rows] = await pool.query(
      `SELECT id, first_name, last_name, email, phone, role, role_id, customer_id, status
       FROM users WHERE id = ?`,
      [decoded.id]
    );

    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    const user = rows[0];
    if (user.status === 'BLOCKED') {
      return res.status(403).json({
        success: false,
        message: 'Your account is blocked due to outstanding fines. Please contact the librarian.'
      });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}

// Role-based authorization middleware
// Usage: requireRole('LIBRARIAN') or requireRole('LIBRARIAN', 'STUDENT')
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }
    const userRole = String(req.user.role).toUpperCase();
    const allowed = roles.map(r => String(r).toUpperCase());
    if (!allowed.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${allowed.join(' or ')}`
      });
    }
    next();
  };
}

module.exports = { auth, requireRole };
