const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chat.controller');
const { auth } = require('../middlewares/auth.middleware');
const uploadService = require('../services/upload.service');
const validate = require('../middlewares/validation.middleware');
const { 
    sendMessageValidator,
    editMessageValidator 
} = require('../validators/message.validator');

// Ottiene i messaggi di una chat di un evento
router.get('/events/:eventId/messages',
    auth,
    chatController.getEventMessages
);

// Invia un nuovo messaggio (supporta sia testo che immagini)
router.post('/events/:eventId/messages',
    auth,
    uploadService.getMulterMiddleware(),
    validate(sendMessageValidator),
    chatController.sendMessage
);

// Modifica un messaggio esistente
router.put('/messages/:messageId',
    auth,
    validate(editMessageValidator),
    chatController.editMessage
);

// Elimina un messaggio
router.delete('/messages/:messageId',
    auth,
    chatController.deleteMessage
);

// Marca i messaggi come letti
router.post('/events/:eventId/messages/read',
    auth,
    chatController.markMessagesAsRead
);

// Ottiene lo stato di lettura dei messaggi
router.get('/events/:eventId/messages/read-status',
    auth,
    chatController.getReadStatus
);

module.exports = router;