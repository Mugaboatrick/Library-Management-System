const express = require('express');
const router = express.Router();
const bookController = require('../controllers/bookController');
const { auth, requireRole } = require('../middleware/auth');

// Public reads for authenticated users
router.get('/', auth, bookController.listBooks);
router.get('/categories', auth, bookController.getCategories);
router.get('/sections', auth, bookController.getSections);
router.get('/retired', auth, requireRole('LIBRARIAN'), bookController.listRetired);
// Must stay above /:id or "resolve-scan" is parsed as a book id.
router.get('/resolve-scan', auth, bookController.resolveScan);
router.get('/:id', auth, bookController.getBook);

// Admin-only mutations
router.post('/', auth, requireRole('LIBRARIAN'), bookController.addBook);
router.put('/:id', auth, requireRole('LIBRARIAN'), bookController.updateBook);
router.post('/:id/copies', auth, requireRole('LIBRARIAN'), bookController.addCopies);
// Librarian re-labels one copy from the barcode printed on the book itself.
// Declared above the PUT routes below so "copies" is not read as a copy id.
router.put(
  '/copies/:copyId/code',
  auth,
  requireRole('LIBRARIAN'),
  bookController.setCopyCode
);
router.delete('/:id', auth, requireRole('LIBRARIAN'), bookController.deleteBook);
// Declared before /retire/:id so "retire-all" is not read as a copy id.
router.put('/retire-all/:id', auth, requireRole('LIBRARIAN'), bookController.retireAllCopies);
router.put('/retire/:id', auth, requireRole('LIBRARIAN'), bookController.retireBook);

module.exports = router;
