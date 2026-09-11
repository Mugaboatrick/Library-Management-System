const { pool } = require('../config/db');

// Public summary - accessible to any authenticated user (used by the Welcome page)
exports.publicSummary = async (req, res) => {
  try {
    const [userCounts] = await pool.query(
      `SELECT
        SUM(role='STUDENT') AS students,
        SUM(role='TEACHER') AS teachers,
        SUM(role='GUEST') AS guests
       FROM users WHERE status = 'ACTIVE'`
    );
    const [[bookCounts]] = await pool.query(
      `SELECT
        COUNT(*) AS total_books,
        SUM(b.available_copies) AS available
       FROM books b`
    );
    const [[ebookCount]] = await pool.query(`SELECT COUNT(*) AS total FROM ebooks WHERE status='ACTIVE'`);
    const [circulation] = await pool.query(
      `SELECT SUM(status IN ('BORROWED','OVERDUE')) AS active_loans FROM borrowings`
    );

    res.json({
      success: true,
      data: {
        users: {
          students: Number(userCounts[0]?.students || 0),
          teachers: Number(userCounts[0]?.teachers || 0),
          guests: Number(userCounts[0]?.guests || 0)
        },
        books: {
          total_books: Number(bookCounts?.total_books || 0),
          available: Number(bookCounts?.available || 0)
        },
        ebooks: Number(ebookCount?.total || 0),
        circulation: { active_loans: Number(circulation[0]?.active_loans || 0) }
      }
    });
  } catch (err) {
    console.error('Public summary error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Main dashboard summary
exports.dashboard = async (req, res) => {
  try {
    // Users
    const [userCounts] = await pool.query(
      `SELECT
        SUM(role='STUDENT') AS students,
        SUM(role='TEACHER') AS teachers,
        SUM(role='GUEST') AS guests
       FROM users`
    );

    // MySQL returns SUM() as strings; coerce to numbers
    const users = {
      students: Number(userCounts[0]?.students || 0),
      teachers: Number(userCounts[0]?.teachers || 0),
      guests: Number(userCounts[0]?.guests || 0)
    };

    // Books
    const [bookCounts] = await pool.query(
      `SELECT COUNT(*) AS total_books FROM books`
    );
    const [[copyCounts]] = await pool.query(
      `SELECT
        SUM(status='AVAILABLE') AS available,
        SUM(status='BORROWED') AS borrowed,
        SUM(status='RETIRED') AS retired
       FROM book_copies`
    );

    // Fines
    const [[fineTotals]] = await pool.query(
      `SELECT
        COALESCE(SUM(amount),0) AS total,
        COALESCE(SUM(CASE WHEN status='PAID' OR status='WAIVED' THEN amount ELSE 0 END),0) AS settled,
        COALESCE(SUM(CASE WHEN status='UNPAID' THEN amount ELSE 0 END),0) AS unpaid
       FROM fines`
    );

    // Active borrowings + overdue
    const [circulation] = await pool.query(
      `SELECT
        SUM(status IN ('BORROWED','OVERDUE')) AS active_loans,
        SUM(status='OVERDUE') AS overdue
       FROM borrowings`
    );

    // E-books
    const [[ebookCount]] = await pool.query(`SELECT COUNT(*) AS total FROM ebooks WHERE status='ACTIVE'`);

    res.json({
      success: true,
      data: {
        users,
        books: { total_books: bookCounts[0]?.total_books || 0, ...copyCounts },
        fines: fineTotals,
        circulation: circulation[0],
        ebooks: ebookCount?.total || 0
      }
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Most borrowed books
exports.mostBorrowedBooks = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const [rows] = await pool.query(
      `SELECT bk.id, bk.title, bk.author,
              COUNT(b.id) AS borrow_count
       FROM borrowings b
       JOIN book_copies bc ON bc.id = b.copy_id
       JOIN books bk ON bk.id = bc.book_id
       GROUP BY bk.id, bk.title, bk.author
       ORDER BY borrow_count DESC
       LIMIT ?`,
      [parseInt(limit)]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('Most borrowed error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Monthly borrowing trends (last 12 months)
exports.monthlyTrends = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT DATE_FORMAT(borrow_date, '%Y-%m') AS month,
              COUNT(*) AS borrow_count
       FROM borrowings
       WHERE borrow_date >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
       GROUP BY DATE_FORMAT(borrow_date, '%Y-%m')
       ORDER BY month ASC`
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('Monthly trends error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Detailed users report
exports.userReport = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT role, status, COUNT(*) AS count
       FROM users GROUP BY role, status ORDER BY role`
    );
    // Reshape
    const result = {};
    rows.forEach(r => {
      if (!result[r.role]) result[r.role] = {};
      result[r.role][r.status] = r.count;
    });
    res.json({ success: true, data: result });
  } catch (err) {
    console.error('User report error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Fines report aggregation by month
exports.fineReport = async (req, res) => {
  try {
    const [byStatus] = await pool.query(
      `SELECT status, COUNT(*) AS count, COALESCE(SUM(amount),0) AS total
       FROM fines GROUP BY status`
    );

    const [byMethod] = await pool.query(
      `SELECT method, COUNT(*) AS count, COALESCE(SUM(amount),0) AS total
       FROM payments GROUP BY method`
    );

    res.json({ success: true, data: { byStatus, byMethod } });
  } catch (err) {
    console.error('Fine report error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Audit logs
exports.auditLogs = async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    const [rows] = await pool.query(
      `SELECT al.*, u.email, u.customer_id
       FROM audit_logs al LEFT JOIN users u ON u.id = al.user_id
       ORDER BY al.created_at DESC LIMIT ?`,
      [parseInt(limit)]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('Audit logs error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
