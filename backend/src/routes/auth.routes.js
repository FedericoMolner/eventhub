// backend/src/routes/auth.routes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { auth } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validation.middleware');
const { registerValidator, loginValidator, changePasswordValidator } = require('../validators/auth.validator');

router.post('/register', validate(registerValidator), authController.register);
router.post('/login', validate(loginValidator), authController.login);
router.post('/logout', auth, authController.logout);
router.get('/me', auth, authController.getCurrentUser);
router.post('/refresh-token', authController.refreshToken);
router.put('/change-password', auth, validate(changePasswordValidator), authController.changePassword);

// OAuth routes
router.get('/oauth/:provider/url', authController.getOAuthUrl);
router.post('/oauth/google', authController.handleGoogleAuth);
router.post('/oauth/github', authController.handleGithubAuth);

module.exports = router;