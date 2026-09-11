const express = require('express');
const router = express.Router();
const bookController = require('../controllers/bookController');
const { auth, requireRole } = require('../middleware/auth');

// Public reads for authenticated users
router.get('/', auth, bookController.listBooks);
router.get('/categories', auth, bookController.getCategories);
router.get('/retired', auth, requireRole('LIBRARIAN'), bookController.listRetired);
router.get('/:id', auth, bookController.getBook);

// Admin-only mutations
router.post('/', auth, requireRole('LIBRARIAN'), bookController.addBook);
router.put('/:id', auth, requireRole('LIBRARIAN'), bookController.updateBook);
router.post('/:id/copies', auth, requireRole('LIBRARIAN'), bookController.addCopies);
router.put('/retire/:id', auth, requireRole('LIBRARIAN'), bookController.retireBook);

module.exports = router;
