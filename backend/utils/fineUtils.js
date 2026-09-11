const { pool } = require('../config/db');

const DAILY_RATE = parseFloat(process.env.DAILY_FINE_RATE) || 500;
const BLOCK_THRESHOLD = parseFloat(process.env.FINE_BLOCK_THRESHOLD) || 5000;
const DAMAGE_RATE = parseFloat(process.env.DAMAGE_FINE_RATE) || 10000;
const LOSS_RATE = parseFloat(process.env.LOSS_FINE_RATE) || 25000;
const OVERDUE_DAYS_THRESHOLD = parseInt(process.env.OVERDUE_DAYS_THRESHOLD) || 30;

// Get the maximum number of books a role can borrow
function getBorrowLimit(role) {
  switch (String(role).toUpperCase()) {
    case 'STUDENT': return 3;
    case 'TEACHER': return 10;
    case 'GUEST': return 1;
    default: return 1;
  }
}

// Calculate fine for a given loan
function calculateFine(borrowDate, dueDate, returnDate = new Date()) {
  const due = new Date(dueDate);
  const ret = new Date(returnDate);
  const borrow = new Date(borrowDate);

  // Overdue only if returned after due date
  if (ret <= due) {
    return { amount: 0, daysOverdue: 0 };
  }

  // Calculate full days overdue
  const diffMs = ret.getTime() - due.getTime();
  const daysOverdue = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  const amount = daysOverdue * DAILY_RATE;

  return { amount, daysOverdue };
}

// Calculate condition-based fine (damage/loss flat rate)
function calculateConditionFine(condition) {
  switch (String(condition).toUpperCase()) {
    case 'DAMAGED': return DAMAGE_RATE;
    case 'LOST': return LOSS_RATE;
    default: return 0;
  }
}

// Compute current overdue days for an active borrowing
function getOverdueDays(dueDate) {
  const due = new Date(dueDate);
  const now = new Date();
  if (now <= due) return 0;
  const diffMs = now.getTime() - due.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

// Check and update user blocked status based on total unpaid fines OR overdue days
async function updateUserBlockStatus(userId) {
  const [[agg]] = await pool.query(
    `SELECT COALESCE(SUM(amount), 0) AS total
     FROM fines WHERE user_id = ? AND status = 'UNPAID'`,
    [userId]
  );

  const total = parseFloat(agg?.total || 0);

  // Check overdue days on active borrows
  const [[overdueCheck]] = await pool.query(
    `SELECT COUNT(*) AS overdue_count FROM borrowings
     WHERE user_id = ? AND status IN ('BORROWED','OVERDUE')
     AND due_date < DATE_SUB(NOW(), INTERVAL ? DAY)`,
    [userId, OVERDUE_DAYS_THRESHOLD]
  );

  const hasOverdueExceeded = (overdueCheck?.overdue_count || 0) > 0;

  if (total >= BLOCK_THRESHOLD || hasOverdueExceeded) {
    const reason = hasOverdueExceeded
      ? `Overdue items exceed ${OVERDUE_DAYS_THRESHOLD} days`
      : `Outstanding fines exceeded threshold (${BLOCK_THRESHOLD} RWF)`;
    await pool.query(
      `UPDATE users SET status = 'BLOCKED', blocked_reason = ?
       WHERE id = ? AND status != 'BLOCKED'`,
      [reason, userId]
    );
    return { blocked: true, total };
  }

  return { blocked: total >= BLOCK_THRESHOLD || hasOverdueExceeded, total };
}

module.exports = {
  getBorrowLimit,
  calculateFine,
  calculateConditionFine,
  getOverdueDays,
  updateUserBlockStatus,
  DAILY_RATE,
  BLOCK_THRESHOLD,
  DAMAGE_RATE,
  LOSS_RATE,
  OVERDUE_DAYS_THRESHOLD
};
