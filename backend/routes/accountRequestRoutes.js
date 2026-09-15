const express = require('express');
const router = express.Router();
const accountRequestController = require('../controllers/accountRequestController');
const { auth, requireRole } = require('../middleware/auth');

// Public — students, teachers and guests ask the librarian for an account
router.post('/', accountRequestController.createRequest);

// Librarian-only — view and manage the requests
router.get('/', auth, requireRole('LIBRARIAN'), accountRequestController.listRequests);
router.put('/:id', auth, requireRole('LIBRARIAN'), accountRequestController.updateRequestStatus);
router.delete('/:id', auth, requireRole('LIBRARIAN'), accountRequestController.deleteRequest);

module.exports = router;