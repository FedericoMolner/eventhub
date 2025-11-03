const { body } = require('express-validator');

const registerValidator = [
    body('email')
        .isEmail()
        .withMessage('Email non valida')
        .normalizeEmail(),
    body('password')
        .isLength({ min: 6 })
        .withMessage('La password deve essere di almeno 6 caratteri'),
    body('name')
        .trim()
        .notEmpty()
        .withMessage('Il nome è obbligatorio')
];

const loginValidator = [
    body('email')
        .isEmail()
        .withMessage('Email non valida')
        .normalizeEmail(),
    body('password')
        .notEmpty()
        .withMessage('Password obbligatoria')
];

const changePasswordValidator = [
    body('currentPassword')
        .notEmpty()
        .withMessage('Password attuale obbligatoria'),
    body('newPassword')
        .isLength({ min: 6 })
        .withMessage('La nuova password deve essere di almeno 6 caratteri')
        .custom((value, { req }) => {
            if (value === req.body.currentPassword) {
                throw new Error('La nuova password deve essere diversa da quella attuale');
            }
            return true;
        })
];

module.exports = {
    registerValidator,
    loginValidator,
    changePasswordValidator
};