'use strict';
const express    = require('express');
const ctrl       = require('../controllers/conferenceRegistration.controller');
const { authenticate, requireVerifiedEmailUnlessRgipt } = require('../middleware/auth.middleware');
const { confRegUpload }  = require('../middleware/upload');
const { uploadLimiter, resendLimiter }  = require('../middleware/rateLimiter');
const validate   = require('../middleware/validate');
const {
  submitConferenceRegistrationValidator,
} = require('../validators/registration.validators');

const router = express.Router();

/* Public — no auth required */
router.get('/config', ctrl.getConfig);

/* Public — verify a conference pass by SRC ID (QR-code target) */
router.get('/verify/:srcId', ctrl.verifyRegistration);

/* All other routes require auth; verified email is required for external
 * participants, but exempted for @rgipt.ac.in accounts (see middleware). */
router.use(authenticate, requireVerifiedEmailUnlessRgipt);

/* Get my conference registration status */
router.get('/', ctrl.getMyConferenceRegistration);

/* View my conference ID card — available only after approval */
router.get('/id-card', ctrl.getMyConferenceIdCard);

/* Resend my conference registration email (approval email + ID card PDF) */
router.post('/resend-email', resendLimiter, ctrl.resendMyConfRegEmail);

/* Submit / re-submit conference registration */
router.post('/',
  uploadLimiter,
  confRegUpload.fields([
    { name: 'screenshot',      maxCount: 1 },
    { name: 'universityIdCard', maxCount: 1 },
    { name: 'photo',           maxCount: 1 },
  ]),
  submitConferenceRegistrationValidator, validate,
  ctrl.submitConferenceRegistration
);

module.exports = router;
