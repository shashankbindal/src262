'use strict';
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const submissionService = require('../services/submission.service');

const uploadSubmission = asyncHandler(async (req, res) => {
  if (!req.file) throw ApiError.badRequest('Submission file is required');

  const submission = await submissionService.uploadSubmission(
    req.user._id,
    req.params.registrationId,
    {
      fileUrl: req.file.location,
      fileKey: req.file.key,
      fileName: req.file.originalname,
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
