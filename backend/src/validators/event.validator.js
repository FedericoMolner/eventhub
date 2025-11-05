// backend/src/validators/event.validator.js
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
    .withMessage('La descrizione è obbligatoria')
    .isLength({ max: 2000 })
    .withMessage('La descrizione non può superare 2000 caratteri'),
  body('category')
    .isIn(['sport', 'musica', 'arte', 'tecnologia', 'formazione', 'networking', 'beneficenza', 'festa', 'altro'])
    .withMessage('Categoria non valida'),
  body('date')
    .isISO8601()
    .withMessage('Data non valida')
    .custom(value => {
      if (new Date(value) < new Date()) {
        throw new Error('La data non può essere nel passato');
      }
      return true;
    }),
  body('address')
    .trim()
    .notEmpty()
    .withMessage('L\'indirizzo è obbligatorio'),
  body('city')
    .trim()
    .notEmpty()
    .withMessage('La città è obbligatoria'),
  body('capacity')
    .isInt({ min: 1, max: 10000 })
    .withMessage('La capacità deve essere tra 1 e 10000'),
  body('latitude')
    .optional()
    .isDecimal()
    .withMessage('Latitudine non valida'),
  body('longitude')
    .optional()
    .isDecimal()
    .withMessage('Longitudine non valida')
];

const updateEventValidator = [
  body('title')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Il titolo è obbligatorio')
    .isLength({ max: 100 })
    .withMessage('Il titolo non può superare i 100 caratteri'),
  body('description')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('La descrizione è obbligatoria')
    .isLength({ max: 2000 })
    .withMessage('La descrizione non può superare 2000 caratteri'),
  body('category')
    .optional()
    .isIn(['sport', 'musica', 'arte', 'tecnologia', 'formazione', 'networking', 'beneficenza', 'festa', 'altro'])
    .withMessage('Categoria non valida'),
  body('date')
    .optional()
    .isISO8601()
    .withMessage('Data non valida'),
  body('capacity')
    .optional()
    .isInt({ min: 1, max: 10000 })
    .withMessage('La capacità deve essere tra 1 e 10000')
];

module.exports = {
  createEventValidator,
  updateEventValidator
};