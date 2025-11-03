const express = require('express');
const router = express.Router();
const eventsController = require('../controllers/events.controller');
const { auth, checkRole } = require('../middlewares/auth.middleware');

// Route pubbliche
router.get('/', eventsController.getAllEvents);
router.get('/search', eventsController.searchEvents);
router.get('/categories', eventsController.getCategories);
router.get('/:id', eventsController.getEventById);

// Route protette
router.use(auth); // Tutte le route successive richiedono autenticazione

// Route per organizzatori
router.post('/', checkRole(['organizer', 'admin']), eventsController.createEvent);
router.put('/:id', checkRole(['organizer', 'admin']), eventsController.updateEvent);
router.delete('/:id', checkRole(['organizer', 'admin']), eventsController.deleteEvent);
router.get('/my-events', checkRole(['organizer']), eventsController.getMyEvents);
router.post('/:id/publish', checkRole(['organizer', 'admin']), eventsController.publishEvent);
router.post('/:id/cancel', checkRole(['organizer', 'admin']), eventsController.cancelEvent);

module.exports = router;