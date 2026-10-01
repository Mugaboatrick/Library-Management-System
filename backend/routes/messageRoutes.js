const router = require('express').Router();
const { auth } = require('../middleware/auth');
const messageController = require('../controllers/messageController');

router.get('/inbox', auth, messageController.inbox);
router.get('/sent', auth, messageController.sent);
router.post('/', auth, messageController.send);
router.post('/:id/read', auth, messageController.markRead);
router.post('/read-all', auth, messageController.markAllRead);
router.delete('/:id', auth, messageController.remove);

module.exports = router;