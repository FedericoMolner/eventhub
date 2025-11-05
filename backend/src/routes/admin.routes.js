// backend/src/routes/admin.routes.js
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { auth, checkRole } = require('../middlewares/auth.middleware');

// Tutte le route admin richiedono autenticazione e ruolo admin
router.use(auth, checkRole(['admin']));

router.get('/dashboard/stats', adminController.getDashboardStats);

// Gestione utenti
router.get('/users', adminController.getAllUsers);
router.post('/users/:userId/block', adminController.blockUser);
router.post('/users/:userId/unblock', adminController.unblockUser);

// Gestione eventi
router.put('/events/:eventId/moderate', adminController.moderateEvent);
router.delete('/events/:eventId', adminController.deleteEvent);

module.exports = router;