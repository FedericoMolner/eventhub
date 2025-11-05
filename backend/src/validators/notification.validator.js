const { body, query } = require('express-validator');

const getNotificationsValidator = [
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Numero pagina non valido'),
    
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limite per pagina non valido'),
    
    query('unreadOnly')
        .optional()
        .isBoolean()
        .withMessage('Il parametro unreadOnly deve essere un booleano'),
    
    query('type')
        .optional()
        .isIn([
            'event-registration',
            'event-cancelled',
            'event-updated',
            'event-reminder',
            'chat-mention',
            'event-reported',
            'registration-approved',
            'registration-rejected'
        ])
        .withMessage('Tipo di notifica non valido')
];

const markNotificationsReadValidator = [
    body('notificationIds')
        .isArray()
        .withMessage('notificationIds deve essere un array')
        .notEmpty()
        .withMessage('Devi specificare almeno una notifica'),
    
    body('notificationIds.*')
        .isUUID(4)
        .withMessage('ID notifica non valido')
];

const createNotificationValidator = [
    body('userId')
        .notEmpty()
        .withMessage('L\'ID dell\'utente è obbligatorio')
        .isUUID(4)
        .withMessage('ID utente non valido'),
    
    body('type')
        .notEmpty()
        .withMessage('Il tipo di notifica è obbligatorio')
        .isIn([
            'event-registration',
            'event-cancelled',
            'event-updated',
            'event-reminder',
            'chat-mention',
            'event-reported',
            'registration-approved',
            'registration-rejected'
        ])
        .withMessage('Tipo di notifica non valido'),
    
    body('data')
        .notEmpty()
        .withMessage('I dati della notifica sono obbligatori')
        .isObject()
        .withMessage('I dati della notifica devono essere un oggetto'),
    
    body('eventId')
        .optional()
        .isUUID(4)
        .withMessage('ID evento non valido')
];

const deleteNotificationsValidator = [
    body('notificationIds')
        .isArray()
        .withMessage('notificationIds deve essere un array')
        .notEmpty()
        .withMessage('Devi specificare almeno una notifica'),
    
    body('notificationIds.*')
        .isUUID(4)
        .withMessage('ID notifica non valido')
];

module.exports = {
    getNotificationsValidator,
    markNotificationsReadValidator,
    createNotificationValidator,
    deleteNotificationsValidator
};