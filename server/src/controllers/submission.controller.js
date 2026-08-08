'use strict';
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const cloudinaryService = require('../services/cloudinary.service');
const submissionService = require('../services/submission.service');

const uploadSubmission = asyncHandler(async (req, res) => {
  let files = [];
  if (req.files && req.files.length > 0) {
    files = req.files;
  } else if (req.file) {
    files = [req.file];
  }

  if (files.length === 0) throw ApiError.badRequest('Submission file(s) are required');

  const uploadResults = await Promise.all(
    files.map(file => cloudinaryService.uploadFile(
      file.buffer,
      'submissions',
      file.originalname
    ))
  );

  const fileInfos = uploadResults.map((result, i) => ({
    fileUrl: result.secure_url,
    fileKey: result.public_id,
    fileName: files[i].originalname,
    originalFileName: files[i].originalname,
    fileMimeType: files[i].mimetype,
    fileSizeBytes: files[i].size,
  }));

  const submission = await submissionService.uploadSubmission(
    req.user._id,
    req.params.registrationId,
    fileInfos
  );

  ApiResponse.ok(res, 'Submission uploaded successfully', submission);
});

const replaceSubmissionFile = asyncHandler(async (req, res) => {
  if (!req.file) throw ApiError.badRequest('New file is required');
  const { fileKey } = req.body;
  if (!fileKey) throw ApiError.badRequest('fileKey to replace is required');
  const { registrationId } = req.params;

  const submission = await submissionService.replaceSubmissionFile(
    req.user._id,
    registrationId,
    fileKey,
    req.file
  );
  ApiResponse.ok(res, 'File replaced successfully', submission);
});

const addSubmissionFile = asyncHandler(async (req, res) => {
  if (!req.file) throw ApiError.badRequest('File is required');
  const { registrationId } = req.params;

  const submission = await submissionService.addSubmissionFile(
    req.user._id,
    registrationId,
    req.file
  );
  ApiResponse.ok(res, 'File added successfully', submission);
});

const getMySubmission = asyncHandler(async (req, res) => {
  const submission = await submissionService.getMySubmission(
    req.user._id,
    req.params.registrationId
  );
  ApiResponse.ok(res, 'Submission fetched', submission);
});

module.exports = { uploadSubmission, replaceSubmissionFile, addSubmissionFile, getMySubmission };
