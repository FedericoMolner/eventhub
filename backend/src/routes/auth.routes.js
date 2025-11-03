const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { auth } = require('../middlewares/auth.middleware');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', auth, authController.logout);
router.get('/me', auth, authController.getCurrentUser);
router.post('/refresh-token', authController.refreshToken);
router.put('/change-password', auth, authController.changePassword);

module.exports = router;