// backend/src/routes/reports.routes.js
const express = require('express');
const router = express.Router();
const reportsController = require('../controllers/reports.controller');
const { auth, checkRole } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validation.middleware');
const { createReportValidator } = require('../validators/report.validator');

// Utenti possono segnalare eventi
router.post('/', auth, validate(createReportValidator), reportsController.createReport);

// Solo admin
router.get('/', auth, checkRole(['admin']), reportsController.getAllReports);
router.get('/:reportId', auth, checkRole(['admin']), reportsController.getReportById);
router.put('/:reportId/review', auth, checkRole(['admin']), reportsController.reviewReport);

module.exports = router;