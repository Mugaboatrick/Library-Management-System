const express = require('express');
const router = express.Router();
const ebookController = require('../controllers/ebookController');
const { auth, requireRole } = require('../middleware/auth');
const { uploadEbook, uploadEbookBundle } = require('../middleware/upload');

// E-reader / reading - any authenticated user
router.get('/', auth, ebookController.listEbooks);

// Protected file streaming (serves file through auth API)
router.get('/:id/read', auth, ebookController.readEbook);

// Download a local copy to the device (works for borrowed books)
router.get('/:id/download', auth, ebookController.downloadEbook);

// Bookmarks
router.get('/bookmarks/mine', auth, ebookController.myBookmarks);
router.post('/bookmarks', auth, ebookController.addBookmark);
router.delete('/bookmarks/:id', auth, ebookController.deleteBookmark);

// Admin-only
router.post('/', auth, requireRole('LIBRARIAN'), uploadEbookBundle.fields([{ name: 'file', maxCount: 1 }, { name: 'cover', maxCount: 1 }]), ebookController.uploadEbook);
router.delete('/:id', auth, requireRole('LIBRARIAN'), ebookController.deleteEbook);

module.exports = router;
