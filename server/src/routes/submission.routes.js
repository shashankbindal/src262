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
  submissionUpload.any(),
  ctrl.uploadSubmission
);

router.put('/:registrationId/replace-file',
  uploadLimiter,
  submissionUpload.single('file'),
  ctrl.replaceSubmissionFile
);

router.post('/:registrationId/add-file',
  uploadLimiter,
  submissionUpload.single('file'),
  ctrl.addSubmissionFile
);

router.get('/:registrationId', ctrl.getMySubmission);

module.exports = router;
