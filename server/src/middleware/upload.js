'use strict';
const multer = require('multer');
const multerS3 = require('multer-s3');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const s3 = require('../config/spaces');
const { env } = require('../config/env');
const ApiError = require('../utils/ApiError');

const ALLOWED_PAYMENT_MIMES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
const ALLOWED_SUBMISSION_MIMES = ['application/pdf'];
const MAX_PAYMENT_MB = 5;
const MAX_SUBMISSION_MB = 20;

function buildUpload({ folder, allowedMimes, maxMB }) {
  const storage = multerS3({
    s3,
    bucket: env.DO_SPACES_BUCKET,
    acl: 'private',
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      const filename = `${folder}/${uuidv4()}${ext}`;
      cb(null, filename);
    },
  });

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
  folder: 'payments',
  allowedMimes: ALLOWED_PAYMENT_MIMES,
  maxMB: MAX_PAYMENT_MB,
});

const submissionUpload = buildUpload({
  folder: 'submissions',
  allowedMimes: ALLOWED_SUBMISSION_MIMES,
  maxMB: MAX_SUBMISSION_MB,
});

module.exports = { paymentUpload, submissionUpload };
