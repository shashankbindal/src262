'use strict';
const express  = require('express');
const ctrl     = require('../controllers/registration.controller');
const { authenticate, requireVerifiedEmail } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate');
const {
  createRegistrationValidator,
  updateRegistrationValidator,
} = require('../validators/registration.validators');

const router = express.Router();

router.use(authenticate, requireVerifiedEmail);

/* Create registration for an event (requires approved conference registration) */
router.post('/event/:eventId',
  createRegistrationValidator, validate,
  ctrl.createRegistration
);

/* List all my registrations */
router.get('/', ctrl.getMyRegistrations);

/* Fetch a specific registration */
router.get('/:registrationId', ctrl.getRegistrationById);

/* Update a team registration */
router.patch('/:registrationId',
  updateRegistrationValidator, validate,
  ctrl.updateRegistration
);

module.exports = router;
