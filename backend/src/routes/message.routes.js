// backend/src/routes/messages.routes.js
const express = require('express');
const router = express.Router();
const messagesController = require('../controllers/messages.controller');
const { auth } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validation.middleware');
const { sendMessageValidator } = require('../validators/message.validator');

router.use(auth);

router.get('/events/:eventId', messagesController.getEventMessages);
router.post('/events/:eventId', validate(sendMessageValidator), messagesController.sendMessage);
router.put('/:messageId', validate(sendMessageValidator), messagesController.editMessage);
router.delete('/:messageId', messagesController.deleteMessage);
router.post('/:messageId/read', messagesController.markAsRead);

module.exports = router;