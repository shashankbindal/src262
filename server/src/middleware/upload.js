'use strict';
const multer = require('multer');
const ApiError = require('../utils/ApiError');

const ALLOWED_PAYMENT_MIMES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
const ALLOWED_SUBMISSION_MIMES = ['application/pdf'];
const MAX_PAYMENT_MB = 5;
const MAX_SUBMISSION_MB = 10;

function buildUpload({ allowedMimes, maxMB }) {
  const storage = multer.memoryStorage();

  return multer({
    storage,
    limits: { fileSize: maxMB * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      if (!allowedMimes.includes(file.mimetype)) {
        return cb(
          ApiError.badRequest(
            `Invalid file type. Allowed: ${allowedMimes.join(', ')}`
          )
        );
      }
      cb(null, true);
    },
  });
}

const paymentUpload = buildUpload({
  allowedMimes: ALLOWED_PAYMENT_MIMES,
  maxMB: MAX_PAYMENT_MB,
});

const submissionUpload = buildUpload({
  allowedMimes: ALLOWED_SUBMISSION_MIMES,
  maxMB: MAX_SUBMISSION_MB,
});

/**
 * Multi-file uploader for conference registration
 */
const confRegUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_PAYMENT_MB * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_PAYMENT_MIMES.includes(file.mimetype)) {
      return cb(ApiError.badRequest(
        `Invalid file type. Allowed: ${ALLOWED_PAYMENT_MIMES.join(', ')}`
      ));
    }
    cb(null, true);
  },
});

module.exports = { paymentUpload, submissionUpload, confRegUpload };
