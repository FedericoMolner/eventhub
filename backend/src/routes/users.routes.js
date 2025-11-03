const express = require('express');
const router = express.Router();
const usersController = require('../controllers/users.controller');
const auth = require('../middlewares/auth');

// Users routes
router.get('/profile', auth, usersController.getProfile);
router.put('/profile', auth, usersController.updateProfile);
router.get('/:id/events', auth, usersController.getUserEvents);
router.get('/:id/tickets', auth, usersController.getUserTickets);

module.exports = router;