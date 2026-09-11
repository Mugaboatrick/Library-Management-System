const cron = require('node-cron');
const { pool } = require('../config/db');
const { getOverdueDays, updateUserBlockStatus, DAILY_RATE, BLOCK_THRESHOLD } = require('../utils/fineUtils');

// Daily cron job: automatically calculate/update fines for overdue borrowings
// Runs every day at 00:00 (midnight)
async function calculateDailyFines() {
  try {
    // Find all active (BORROWED / OVERDUE) borrowings whose due date has passed
    const [loans] = await pool.query(
      `SELECT id, user_id, due_date FROM borrowings
       WHERE status IN ('BORROWED','OVERDUE')
         AND due_date < NOW()`
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

      const [existing] = await pool.query(
        `SELECT id FROM fines WHERE borrowing_id = ? AND status = 'UNPAID'`,
        [loan.id]
      );

      if (existing.length > 0) {
        await pool.query(
          `UPDATE fines SET amount = ?, days_overdue = ? WHERE id = ?`,
          [amount, daysOverdue, existing[0].id]
        );
      } else {
        await pool.query(
          `INSERT INTO fines (user_id, borrowing_id, amount, days_overdue, status)
           VALUES (?, ?, ?, ?, 'UNPAID')`,
          [loan.user_id, loan.id, amount, daysOverdue]
        );
      }

      overdueUserIds.add(loan.user_id);
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
