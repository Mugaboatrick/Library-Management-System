const cron = require('node-cron');
const { pool } = require('../config/db');
const { getOverdueDays, updateUserBlockStatus, DAILY_RATE, BLOCK_THRESHOLD } = require('../utils/fineUtils');
const { createNotification } = require('../controllers/notificationController');

// Daily cron job: automatically calculate/update fines for overdue borrowings
// Runs every day at 00:00 (midnight)
async function calculateDailyFines() {
  try {
    // Find all active (BORROWED / OVERDUE) borrowings whose due date has passed
    const [loans] = await pool.query(
      `SELECT b.id, b.user_id, b.due_date, bc.copy_code, bk.id AS book_id, bk.title,
              u.first_name, u.last_name
       FROM borrowings b
       JOIN book_copies bc ON bc.id = b.copy_id
       JOIN books bk ON bk.id = bc.book_id
       JOIN users u ON u.id = b.user_id
       WHERE b.status IN ('BORROWED','OVERDUE')
         AND b.due_date < NOW()`
    );

    if (loans.length === 0) {
      console.log(`[cron] ${new Date().toISOString()} - No overdue loans to process`);
      return;
    }

    const overdueUserIds = new Set();

    for (const loan of loans) {
      const daysOverdue = getOverdueDays(loan.due_date);
      if (daysOverdue <= 0) continue;

      // Mark borrowing as OVERDUE
      await pool.query(
        `UPDATE borrowings SET status = 'OVERDUE' WHERE id = ?`,
        [loan.id]
      );

      // Update or insert fine record
      const amount = daysOverdue * DAILY_RATE;

      // Scope to fine_type = 'OVERDUE': this job must never overwrite a
      // DAMAGE/LOSS fine, which is charged for a deteriorated book on return.
      const [existing] = await pool.query(
        `SELECT id FROM fines WHERE borrowing_id = ? AND status = 'UNPAID' AND fine_type = 'OVERDUE'`,
        [loan.id]
      );

      if (existing.length > 0) {
        await pool.query(
          `UPDATE fines SET amount = ?, days_overdue = ? WHERE id = ?`,
          [amount, daysOverdue, existing[0].id]
        );
      } else {
        await pool.query(
          `INSERT INTO fines (user_id, borrowing_id, amount, fine_type, days_overdue, status)
           VALUES (?, ?, ?, 'OVERDUE', ?, 'UNPAID')`,
          [loan.user_id, loan.id, amount, daysOverdue]
        );
      }

      overdueUserIds.add(loan.user_id);

      // Notify the borrower (student / teacher / guest) that the book is due
      const emoji = loan.copy_code && loan.copy_code.startsWith('EBK') ? '🖥️' : '📕';
      await createNotification({
        userId: loan.user_id,
        type: 'OVERDUE',
        title: 'Book overdue — please return it',
        message: `${emoji} "${loan.title}" was due on ${new Date(loan.due_date).toLocaleDateString()} (${daysOverdue} day${daysOverdue > 1 ? 's' : ''} overdue). Please return it to the library as soon as possible.`,
        data: { borrowing_id: loan.id, book_id: loan.book_id, copy_code: loan.copy_code, title: loan.title, days_overdue: daysOverdue, due_date: loan.due_date },
        emitEvent: 'borrow_overdue',
        payload: { borrowing_id: loan.id, title: loan.title, copy_code: loan.copy_code, days_overdue: daysOverdue, due_date: loan.due_date }
      });
    }

    // Update blocked status for affected users
    for (const userId of overdueUserIds) {
      await updateUserBlockStatus(userId);
    }

    await pool.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
       VALUES (NULL, 'CRON_FINE_CALC', 'SYSTEM', NULL, ?)`,
      [JSON.stringify({ processed: loans.length, users: overdueUserIds.size })]
    );

    console.log(`[cron] ${new Date().toISOString()} - Processed ${loans.length} overdue loans, ${overdueUserIds.size} users`);
  } catch (err) {
    console.error('[cron] Fine calculation error:', err.message);
  }
}

// Start cron job
function startCronJobs() {
  // Schedule daily at midnight
  cron.schedule('0 0 * * *', calculateDailyFines);

  // Also provide a route-triggered manual run (called from controller)
  console.log('✔ Cron jobs scheduled (daily fine calculation at 00:00)');
}

module.exports = { startCronJobs, calculateDailyFines };
