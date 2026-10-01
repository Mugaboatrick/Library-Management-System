const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { auth, requireRole } = require('../middleware/auth');

// Public reads for authenticated users
router.get('/', auth, categoryController.listCategories);
router.get('/list', auth, categoryController.getCategoryList);

// Admin-only mutations
router.post('/', auth, requireRole('LIBRARIAN'), categoryController.addCategory);
router.put('/:id', auth, requireRole('LIBRARIAN'), categoryController.updateCategory);
router.delete('/:id', auth, requireRole('LIBRARIAN'), categoryController.deleteCategory);

// Subjects (under a category)
router.get('/:categoryId/subjects', auth, categoryController.getSubjects);
router.post('/:categoryId/subjects', auth, requireRole('LIBRARIAN'), categoryController.addSubject);
router.put('/:categoryId/subjects/:subjectId', auth, requireRole('LIBRARIAN'), categoryController.updateSubject);
router.delete('/:categoryId/subjects/:subjectId', auth, requireRole('LIBRARIAN'), categoryController.deleteSubject);

module.exports = router;