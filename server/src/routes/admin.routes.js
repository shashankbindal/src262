'use strict';
const express  = require('express');
const ctrl     = require('../controllers/admin.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { requireAdmin } = require('../middleware/admin.middleware');
const validate = require('../middleware/validate');
const {
  adminConfRegDecisionValidator,
} = require('../validators/registration.validators');

const router = express.Router();

/* All admin routes require authentication AND admin role */
router.use(authenticate, requireAdmin);

/* ─── Dashboard Overview ─────────────────────────────────────────────────── */
router.get('/overview', ctrl.getOverview);

/* ─── Conference Registration ────────────────────────────────────────────── */
router.get('/conference-registrations',          ctrl.getConferenceRegistrations);
router.patch('/conference-registrations/:confRegId/decision',
  adminConfRegDecisionValidator, validate,
  ctrl.decideConferenceRegistration
);
router.get('/conference-registrations/:confRegId/screenshot', ctrl.getConfPaymentScreenshot);
router.get('/conference-registrations/:confRegId/id-card',    ctrl.getConfIdCard);

/* ─── Event Registrations ────────────────────────────────────────────────── */
router.get('/events/:eventId/registrations',     ctrl.getRegistrations);
router.get('/registrations/:registrationId/submission-file', ctrl.getSubmissionFile);

/* ─── Submissions ────────────────────────────────────────────────────────── */
router.get('/events/:eventId/submissions',             ctrl.getSubmissions);
router.patch('/submissions/:submissionId/complete',    ctrl.markSubmissionComplete);

/* ─── Exports ────────────────────────────────────────────────────────────── */
router.get('/events/:eventId/export/csv',   ctrl.exportCSV);
router.get('/events/:eventId/export/excel', ctrl.exportExcel);

module.exports = router;
