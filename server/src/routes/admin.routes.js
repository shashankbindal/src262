'use strict';
const express  = require('express');
const ctrl     = require('../controllers/admin.controller');
const { authenticate }   = require('../middleware/auth.middleware');
const { requireAdmin }   = require('../middleware/admin.middleware');
const validate = require('../middleware/validate');
const { adminDecisionValidator } = require('../validators/registration.validators');

const router = express.Router();

/* All admin routes require authentication AND admin role */
router.use(authenticate, requireAdmin);

/* ─── Dashboard Overview ─────────────────────────────────────────────────── */
router.get('/overview', ctrl.getOverview);

/* ─── Registrations per event ────────────────────────────────────────────── */
router.get('/events/:eventId/registrations', ctrl.getRegistrations);

/* ─── Payment workflow ───────────────────────────────────────────────────── */
router.patch('/registrations/:registrationId/payment-decision',
  adminDecisionValidator, validate,
  ctrl.decidePayment
);

router.get('/registrations/:registrationId/payment-screenshot',
  ctrl.getPaymentScreenshot
);

router.get('/registrations/:registrationId/submission-file',
  ctrl.getSubmissionFile
);

/* ─── Submissions per event ──────────────────────────────────────────────── */
router.get('/events/:eventId/submissions',    ctrl.getSubmissions);
router.patch('/submissions/:submissionId/complete', ctrl.markSubmissionComplete);

/* ─── Exports ────────────────────────────────────────────────────────────── */
router.get('/events/:eventId/export/csv',   ctrl.exportCSV);
router.get('/events/:eventId/export/excel', ctrl.exportExcel);

module.exports = router;
