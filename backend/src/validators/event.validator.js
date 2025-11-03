const { body } = require('express-validator');

const createEventValidator = [
    body('title')
        .trim()
        .notEmpty()
        .withMessage('Il titolo è obbligatorio')
        .isLength({ max: 100 })
        .withMessage('Il titolo non può superare i 100 caratteri'),
    body('description')
        .trim()
        .notEmpty()
        .withMessage('La descrizione è obbligatoria'),
    body('date')
        .isISO8601()
        .withMessage('Data non valida')
        .custom(value => {
            if (new Date(value) < new Date()) {
                throw new Error('La data non può essere nel passato');
            }
            return true;
        }),
    body('locationName')
        .trim()
        .notEmpty()
        .withMessage('Il nome della location è obbligatorio'),
    body('address')
        .trim()
        .notEmpty()
        .withMessage('L\'indirizzo è obbligatorio'),
    body('city')
        .trim()
        .notEmpty()
        .withMessage('La città è obbligatoria'),
    body('category')
        .isIn(['music', 'sports', 'theater', 'conference', 'exhibition', 'other'])
        .withMessage('Categoria non valida'),
    body('capacity')
        .isInt({ min: 1 })
        .withMessage('La capacità deve essere un numero positivo'),
    body('ticketTypes')
        .isArray()
        .withMessage('I tipi di biglietto devono essere un array')
        .custom(value => {
            if (!value.length) {
                throw new Error('Deve essere presente almeno un tipo di biglietto');
            }
            return true;
        }),
    body('ticketTypes.*.name')
        .trim()
        .notEmpty()
        .withMessage('Il nome del tipo di biglietto è obbligatorio'),
    body('ticketTypes.*.price')
        .isFloat({ min: 0 })
        .withMessage('Il prezzo deve essere un numero positivo'),
    body('ticketTypes.*.quantity')
        .isInt({ min: 1 })
        .withMessage('La quantità deve essere un numero positivo')
];

module.exports = {
    createEventValidator
};