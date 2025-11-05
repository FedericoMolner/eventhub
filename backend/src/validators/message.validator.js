// backend/src/validators/message.validator.js
const { body } = require('express-validator');

const sendMessageValidator = [
  body('content')
    .trim()
    .notEmpty()
    .withMessage('Il contenuto è obbligatorio')
    .isLength({ min: 1, max: 1000 })
    .withMessage('Il messaggio deve essere tra 1 e 1000 caratteri')
];

module.exports = {
  sendMessageValidator
};