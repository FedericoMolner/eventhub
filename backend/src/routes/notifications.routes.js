// backend/src/routes/notifications.routes.js
const express = require('express');
const router = express.Router();
const notificationsController = require('../controllers/notifications.controller');
const { auth } = require('../middlewares/auth.middleware');

router.use(auth);

router.get('/', notificationsController.getMyNotifications);
router.get('/unread-count', notificationsController.getUnreadCount);
router.post('/mark-read', notificationsController.markAsRead);
router.post('/mark-all-read', notificationsController.markAllAsRead);
router.delete('/:notificationId', notificationsController.deleteNotification);

module.exports = router;