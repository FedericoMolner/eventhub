const express = require('express');
const router = express.Router();
const ticketsController = require('../controllers/tickets.controller');
const { auth, checkRole } = require('../middlewares/auth.middleware');

router.use(auth); // Tutte le route dei biglietti richiedono autenticazione

// Route per utenti
router.get('/my-tickets', ticketsController.getMyTickets);
router.post('/purchase', ticketsController.purchaseTicket);
router.post('/:id/refund', ticketsController.refundTicket);
router.get('/:id', ticketsController.getTicketById);

// Route per organizzatori e staff
router.post('/:id/validate', checkRole(['organizer', 'admin']), ticketsController.validateTicket);
router.get('/event/:eventId', checkRole(['organizer', 'admin']), ticketsController.getEventTickets);
router.get('/stats/event/:eventId', checkRole(['organizer', 'admin']), ticketsController.getTicketStats);

module.exports = router;