// backend/src/validators/report.validator.js
const { body } = require('express-validator');

const createReportValidator = [
  body('eventId')
    .isUUID()
    .withMessage('ID evento non valido'),
  body('reason')
    .isIn([
      'inappropriate_content',
      'spam',
      'misleading_info',
      'dangerous_activity',
      'harassment',
      'copyright',
      'other'
    ])
    .withMessage('Motivo non valido'),
  body('description')
    .trim()
    .notEmpty()
    .withMessage('La descrizione è obbligatoria')
    .isLength({ min: 10, max: 500 })
    .withMessage('La descrizione deve essere tra 10 e 500 caratteri')
];

module.exports = {
  createReportValidator
};