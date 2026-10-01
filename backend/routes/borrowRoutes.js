const express = require('express');
const router = express.Router();
const borrowController = require('../controllers/borrowController');
const { auth, requireRole } = require('../middleware/auth');

// Borrow - any authenticated user (librarians keep the scan workflow, users borrow for themselves)
router.post('/borrow', auth, borrowController.borrowBook);
router.post('/return', auth, requireRole('LIBRARIAN'), borrowController.returnBook);
router.post('/return-my', auth, borrowController.returnMyBook);
router.get('/', auth, requireRole('LIBRARIAN'), borrowController.listBorrowings);
router.post('/:id/approve', auth, requireRole('LIBRARIAN'), borrowController.approveBorrow);
router.post('/:id/reject', auth, requireRole('LIBRARIAN'), borrowController.rejectBorrow);

// User's own history
router.get('/mine', auth, borrowController.myBorrowings);

module.exports = router;
