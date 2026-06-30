'use strict';
const express  = require('express');
const ctrl     = require('../controllers/registration.controller');
const { authenticate, requireVerifiedEmail } = require('../middleware/auth.middleware');
const { paymentUpload }  = require('../middleware/upload');
const { uploadLimiter }  = require('../middleware/rateLimiter');
const validate = require('../middleware/validate');
const {
  createRegistrationValidator,
  updateRegistrationValidator,
  submitPaymentValidator,
} = require('../validators/registration.validators');

const router = express.Router();

router.use(authenticate, requireVerifiedEmail);

/* Create registration for an event */
router.post('/event/:eventId',
  createRegistrationValidator, validate,
  ctrl.createRegistration
);

/* List all my registrations */
router.get('/', ctrl.getMyRegistrations);

/* Fetch a specific registration (with signed screenshot URL) */
router.get('/:registrationId', ctrl.getRegistrationById);

/* Update a pending registration */
router.patch('/:registrationId',
  updateRegistrationValidator, validate,
  ctrl.updateRegistration
);

/* Submit / re-submit payment */
router.post('/:registrationId/payment',
  uploadLimiter,
  paymentUpload.single('screenshot'),
  submitPaymentValidator, validate,
  ctrl.submitPayment
);

module.exports = router;
