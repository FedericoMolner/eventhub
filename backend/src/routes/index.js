const express = require('express');
const router = express.Router();

// Import delle routes
const authRoutes = require('./auth.routes');
const eventRoutes = require('./events.routes');
const userRoutes = require('./users.routes');
const ticketRoutes = require('./tickets.routes');

// Definizione dei prefissi per le routes
router.use('/api/auth', authRoutes);
router.use('/api/events', eventRoutes);
router.use('/api/users', userRoutes);
router.use('/api/tickets', ticketRoutes);

module.exports = router;