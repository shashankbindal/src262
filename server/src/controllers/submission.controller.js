'use strict';
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const cloudinaryService = require('../services/cloudinary.service');
const submissionService = require('../services/submission.service');

const uploadSubmission = asyncHandler(async (req, res) => {
  if (!req.file) throw ApiError.badRequest('Submission file is required');

  const uploadResult = await cloudinaryService.uploadFile(
    req.file.buffer,
    'submissions',
    req.file.originalname
  );

  const submission = await submissionService.uploadSubmission(
    req.user._id,
    req.params.registrationId,
    {
      fileUrl: uploadResult.secure_url,
      fileKey: uploadResult.public_id,
      fileName: req.file.originalname,
      originalFileName: req.file.originalname,
      fileMimeType: req.file.mimetype,
      fileSizeBytes: req.file.size,
    }
  );

  ApiResponse.ok(res, 'Submission uploaded successfully', submission);
});

const getMySubmission = asyncHandler(async (req, res) => {
  const submission = await submissionService.getMySubmission(
    req.user._id,
    req.params.registrationId
  );
  ApiResponse.ok(res, 'Submission fetched', submission);
});

module.exports = { uploadSubmission, getMySubmission };
