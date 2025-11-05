const { body, param, query } = require('express-validator');

const getMessagesValidator = [
    param('eventId')
        .notEmpty()
        .withMessage('L\'ID dell\'evento è obbligatorio')
        .isUUID(4)
        .withMessage('ID evento non valido'),
    
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limite messaggi non valido'),
    
    query('before')
        .optional()
        .isISO8601()
        .withMessage('Data non valida')
];

const sendMessageValidator = [
    param('eventId')
        .notEmpty()
        .withMessage('L\'ID dell\'evento è obbligatorio')
        .isUUID(4)
        .withMessage('ID evento non valido'),
    
    body('content')
        .if(body('type').equals('text'))
        .notEmpty()
        .withMessage('Il contenuto del messaggio non può essere vuoto')
        .isLength({ max: 1000 })
        .withMessage('Il messaggio non può superare i 1000 caratteri'),
    
    body('type')
        .optional()
        .isIn(['text', 'image'])
        .withMessage('Tipo di messaggio non valido')
];

const editMessageValidator = [
    param('messageId')
        .notEmpty()
        .withMessage('L\'ID del messaggio è obbligatorio')
        .isUUID(4)
        .withMessage('ID messaggio non valido'),
    
    body('content')
        .notEmpty()
        .withMessage('Il contenuto del messaggio non può essere vuoto')
        .isLength({ max: 1000 })
        .withMessage('Il messaggio non può superare i 1000 caratteri')
];

const deleteMessageValidator = [
    param('messageId')
        .notEmpty()
        .withMessage('L\'ID del messaggio è obbligatorio')
        .isUUID(4)
        .withMessage('ID messaggio non valido')
];

const markMessagesReadValidator = [
    param('eventId')
        .notEmpty()
        .withMessage('L\'ID dell\'evento è obbligatorio')
        .isUUID(4)
        .withMessage('ID evento non valido'),
    
    body('messageIds')
        .isArray()
        .withMessage('messageIds deve essere un array')
        .notEmpty()
        .withMessage('Devi specificare almeno un messaggio'),
    
    body('messageIds.*')
        .isUUID(4)
        .withMessage('ID messaggio non valido')
];

const getReadStatusValidator = [
    param('eventId')
        .notEmpty()
        .withMessage('L\'ID dell\'evento è obbligatorio')
        .isUUID(4)
        .withMessage('ID evento non valido'),
    
    query('messageIds')
        .isArray()
        .withMessage('messageIds deve essere un array')
        .notEmpty()
        .withMessage('Devi specificare almeno un messaggio'),
    
    query('messageIds.*')
        .isUUID(4)
        .withMessage('ID messaggio non valido')
];

module.exports = {
    getMessagesValidator,
    sendMessageValidator,
    editMessageValidator,
    deleteMessageValidator,
    markMessagesReadValidator,
    getReadStatusValidator
};