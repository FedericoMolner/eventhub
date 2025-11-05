const { body, param, query } = require('express-validator');

const createTicketTypeValidator = [
    body('name')
        .notEmpty()
        .withMessage('Il nome del tipo di biglietto è obbligatorio')
        .isLength({ min: 3, max: 50 })
        .withMessage('Il nome deve essere tra 3 e 50 caratteri'),
    
    body('description')
        .optional()
        .isLength({ max: 200 })
        .withMessage('La descrizione non può superare i 200 caratteri'),
    
    body('price')
        .notEmpty()
        .withMessage('Il prezzo è obbligatorio')
        .isFloat({ min: 0 })
        .withMessage('Il prezzo deve essere un numero positivo'),
    
    body('quantity')
        .notEmpty()
        .withMessage('La quantità è obbligatoria')
        .isInt({ min: 1 })
        .withMessage('La quantità deve essere un numero intero positivo'),
    
    body('eventId')
        .notEmpty()
        .withMessage('L\'ID dell\'evento è obbligatorio')
        .isUUID(4)
        .withMessage('ID evento non valido'),

    body('salesStart')
        .optional()
        .isISO8601()
        .withMessage('La data di inizio vendita deve essere una data valida')
        .custom((value, { req }) => {
            if (new Date(value) < new Date()) {
                throw new Error('La data di inizio vendita non può essere nel passato');
            }
            return true;
        }),

    body('salesEnd')
        .optional()
        .isISO8601()
        .withMessage('La data di fine vendita deve essere una data valida')
        .custom((value, { req }) => {
            if (req.body.salesStart && new Date(value) <= new Date(req.body.salesStart)) {
                throw new Error('La data di fine vendita deve essere successiva alla data di inizio');
            }
            return true;
        })
];

const purchaseTicketValidator = [
    body('quantity')
        .notEmpty()
        .withMessage('La quantità è obbligatoria')
        .isInt({ min: 1 })
        .withMessage('La quantità deve essere un numero intero positivo'),
    
    body('ticketTypeId')
        .notEmpty()
        .withMessage('Il tipo di biglietto è obbligatorio')
        .isUUID(4)
        .withMessage('ID tipo biglietto non valido'),

    body('eventId')
        .notEmpty()
        .withMessage('L\'ID dell\'evento è obbligatorio')
        .isUUID(4)
        .withMessage('ID evento non valido')
];

const validateTicketTransferValidator = [
    body('ticketId')
        .notEmpty()
        .withMessage('L\'ID del biglietto è obbligatorio')
        .isUUID(4)
        .withMessage('ID biglietto non valido'),
    
    body('recipientEmail')
        .notEmpty()
        .withMessage('L\'email del destinatario è obbligatoria')
        .isEmail()
        .withMessage('Email non valida')
        .normalizeEmail()
];

const getTicketsValidator = [
    query('eventId')
        .optional()
        .isUUID(4)
        .withMessage('ID evento non valido'),
    
    query('status')
        .optional()
        .isIn(['valid', 'used', 'cancelled', 'transferred'])
        .withMessage('Stato biglietto non valido'),
    
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Numero pagina non valido'),
    
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limite per pagina non valido')
];

const validateTicketValidator = [
    param('ticketId')
        .notEmpty()
        .withMessage('L\'ID del biglietto è obbligatorio')
        .isUUID(4)
        .withMessage('ID biglietto non valido'),
    
    body('eventId')
        .notEmpty()
        .withMessage('L\'ID dell\'evento è obbligatorio')
        .isUUID(4)
        .withMessage('ID evento non valido')
];

module.exports = {
    createTicketTypeValidator,
    purchaseTicketValidator,
    validateTicketTransferValidator,
    getTicketsValidator,
    validateTicketValidator
};