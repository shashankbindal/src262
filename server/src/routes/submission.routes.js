'use strict';
const express  = require('express');
const ctrl     = require('../controllers/submission.controller');
const { authenticate, requireVerifiedEmail } = require('../middleware/auth.middleware');
const { submissionUpload } = require('../middleware/upload');
const { uploadLimiter }    = require('../middleware/rateLimiter');

const router = express.Router();

router.use(authenticate, requireVerifiedEmail);

router.post('/:registrationId',
  uploadLimiter,
  submissionUpload.single('file'),
  ctrl.uploadSubmission
);

router.get('/:registrationId', ctrl.getMySubmission);

module.exports = router;
