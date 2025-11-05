// backend/src/routes/events.routes.js
const express = require('express');
const router = express.Router();
const eventsController = require('../controllers/events.controller');
const { auth } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validation.middleware');
const { createEventValidator, updateEventValidator } = require('../validators/event.validator');

// Route pubbliche
router.get('/', eventsController.getAllEvents);
router.get('/categories', eventsController.getCategories);
router.get('/:id', eventsController.getEventById);

// Route protette
router.use(auth);

router.post('/', validate(createEventValidator), eventsController.createEvent);
router.put('/:id', validate(updateEventValidator), eventsController.updateEvent);
router.delete('/:id', eventsController.deleteEvent);
router.get('/my/events', eventsController.getMyEvents);

module.exports = router;