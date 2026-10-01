const router = require('express').Router();
const { auth } = require('../middleware/auth');
const notificationController = require('../controllers/notificationController');

router.get('/', auth, notificationController.getMyNotifications);
router.post('/:id/read', auth, notificationController.markRead);
router.post('/read-all', auth, notificationController.markAllRead);

module.exports = router;