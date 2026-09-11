const express = require('express');
const router = express.Router();
const fineController = require('../controllers/fineController');
const { auth, requireRole } = require('../middleware/auth');

router.get('/settings', auth, requireRole('LIBRARIAN'), fineController.getSettings);

// Own fines (any role)
router.get('/mine', auth, fineController.myFines);
router.post('/mine/pay-all', auth, fineController.payAllMyFines);

// Admin
router.use(auth, requireRole('LIBRARIAN'));
router.get('/', fineController.listFines);
router.post('/:fine_id/pay', fineController.payFine);
router.put('/:fine_id/waive', fineController.waiveFine);
router.get('/payments/all', fineController.listPayments);

module.exports = router;
