// backend/src/routes/index.js
const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
const eventRoutes = require('./events.routes');
const participantRoutes = require('./participants.routes');
const messageRoutes = require('./messages.routes');
const notificationRoutes = require('./notifications.routes');
const reportRoutes = require('./reports.routes');
const adminRoutes = require('./admin.routes');

router.use('/auth', authRoutes);
router.use('/events', eventRoutes);
router.use('/participants', participantRoutes);
router.use('/messages', messageRoutes);
router.use('/notifications', notificationRoutes);
router.use('/reports', reportRoutes);
router.use('/admin', adminRoutes);

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

module.exports = router;