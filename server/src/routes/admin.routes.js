'use strict';
const express  = require('express');
const ctrl     = require('../controllers/admin.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { requireAdmin } = require('../middleware/admin.middleware');
const validate = require('../middleware/validate');
const { announcementLimiter } = require('../middleware/rateLimiter');
const {
  adminConfRegDecisionValidator,
} = require('../validators/registration.validators');
const {
  createUserValidator,
  deleteUserValidator,
  createEventValidator,
  updateEventValidator,
  deleteEventValidator,
  createAnnouncementValidator,
  updateAnnouncementValidator,
  deleteAnnouncementValidator,
} = require('../validators/admin.validators');

const router = express.Router();

/* All admin routes require authentication AND admin role */
router.use(authenticate, requireAdmin);

/* ─── Dashboard Overview ─────────────────────────────────────────────────── */
router.get('/overview', ctrl.getOverview);

/* ─── Conference Registration ────────────────────────────────────────────── */
router.get('/conference-registrations',          ctrl.getConferenceRegistrations);
router.get('/conference-registrations/export/csv', ctrl.exportConferenceRegistrationsCSV);
router.post('/conference-registrations/resend-emails', ctrl.bulkResendConfRegEmails);
router.patch('/conference-registrations/:confRegId/decision',
  adminConfRegDecisionValidator, validate,
  ctrl.decideConferenceRegistration
);
router.get('/conference-registrations/:confRegId/screenshot', ctrl.getConfPaymentScreenshot);
router.get('/conference-registrations/:confRegId/id-card',    ctrl.getConfIdCard);
router.get('/conference-registrations/:confRegId/detail',     ctrl.getConferenceRegistrationDetail);
router.get('/conference-registrations/:confRegId/id-card-preview', ctrl.getIdCardPreview);
router.post('/conference-registrations/:confRegId/certificate/issue', ctrl.issueCertificate);
router.get('/conference-registrations/:confRegId/certificate', ctrl.getCertificate);

/* ─── Event Registrations ────────────────────────────────────────────────── */
router.get('/events/:eventId/registrations',     ctrl.getRegistrations);
router.post('/registrations/resend-emails',       ctrl.bulkResendEventEmails);
router.delete('/registrations/:registrationId',  ctrl.deleteRegistration);
router.get('/registrations/:registrationId/submission-file', ctrl.getSubmissionFile);

/* ─── Submissions ────────────────────────────────────────────────────────── */
router.get('/events/:eventId/submissions',             ctrl.getSubmissions);
router.patch('/submissions/:submissionId/complete',    ctrl.markSubmissionComplete);

/* ─── Exports ────────────────────────────────────────────────────────────── */
router.get('/events/:eventId/export/csv',   ctrl.exportCSV);
router.get('/events/:eventId/export/excel', ctrl.exportExcel);

/* ─── Event Management ───────────────────────────────────────────────────── */
router.post('/events',   createEventValidator, validate, ctrl.createEvent);
router.patch('/events/:eventId', updateEventValidator, validate, ctrl.updateEvent);
router.delete('/events/:eventId', deleteEventValidator, validate, ctrl.deleteEvent);

/* ─── User Management ────────────────────────────────────────────────────── */
router.get('/users',    ctrl.getUsers);
router.post('/users',   createUserValidator, validate, ctrl.createUser);
router.delete('/users/:userId', deleteUserValidator, validate, ctrl.deleteUser);

/* ─── Announcement Management ────────────────────────────────────────────── */
router.post('/announcements', announcementLimiter, createAnnouncementValidator, validate, ctrl.createAnnouncement);
router.put('/announcements/:id', updateAnnouncementValidator, validate, ctrl.updateAnnouncement);
router.delete('/announcements/:id', deleteAnnouncementValidator, validate, ctrl.deleteAnnouncement);

module.exports = router;
