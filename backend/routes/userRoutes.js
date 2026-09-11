const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { auth, requireRole } = require('../middleware/auth');

router.get('/limits', auth, userController.getBorrowLimitInfo);

router.use(auth, requireRole('LIBRARIAN'));

router.get('/', userController.listUsers);
router.post('/', userController.createUser);
router.get('/:id', userController.getUser);
router.put('/:id', userController.updateUser);
router.put('/:id/block', userController.toggleBlock);
router.get('/:id/qrcards', userController.getQRCards);
router.post('/:user_id/qrcards/regenerate', userController.regenerateQR);
router.delete('/:id/qrcards/:cardId', userController.deleteCard);
router.put('/:id/qrcards/:cardId', userController.updateCard);

module.exports = router;
