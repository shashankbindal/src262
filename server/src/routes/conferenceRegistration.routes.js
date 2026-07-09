'use strict';
const express    = require('express');
const ctrl       = require('../controllers/conferenceRegistration.controller');
const { authenticate, requireVerifiedEmail } = require('../middleware/auth.middleware');
const { confRegUpload }  = require('../middleware/upload');
const { uploadLimiter }  = require('../middleware/rateLimiter');
const validate   = require('../middleware/validate');
const {
  submitConferenceRegistrationValidator,
} = require('../validators/registration.validators');

const router = express.Router();

/* Public — no auth required */
router.get('/config', ctrl.getConfig);

/* All other routes require auth + verified email */
router.use(authenticate, requireVerifiedEmail);

/* Get my conference registration status */
router.get('/', ctrl.getMyConferenceRegistration);

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
