const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { auth, requireRole } = require('../middleware/auth');
const { calculateDailyFines } = require('../cron/fineCron');

// Public summary (any authenticated user) - used by the Welcome page
router.get('/public-summary', auth, reportController.publicSummary);

router.use(auth, requireRole('LIBRARIAN'));

router.get('/dashboard', reportController.dashboard);
router.get('/most-borrowed', reportController.mostBorrowedBooks);
router.get('/monthly-trends', reportController.monthlyTrends);
router.get('/users', reportController.userReport);
router.get('/fines', reportController.fineReport);
router.get('/audit-logs', reportController.auditLogs);

// Manual cron run
router.post('/run-fine-cron', async (req, res) => {
  await calculateDailyFines();
  res.json({ success: true, message: 'Fine calculation run completed' });
});

module.exports = router;
