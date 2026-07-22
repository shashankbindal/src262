'use strict';
const Registration   = require('../models/Registration');
const Submission     = require('../models/Submission');
const Event          = require('../models/Event');
const Team           = require('../models/Team');
const User           = require('../models/User');
const ApiError       = require('../utils/ApiError');
const cloudinaryService = require('./cloudinary.service');
const logger         = require('../utils/logger');

async function uploadSubmission(userId, registrationId, { fileUrl, fileKey, fileName, fileMimeType, fileSizeBytes }) {
  const teams   = await Team.find({ 'members.userId': userId }).select('_id').lean();
  const teamIds = teams.map(t => t._id);

  const reg = await Registration.findOne({
    _id: registrationId,
    $or: [{ userId }, { teamId: { $in: teamIds } }],
  }).populate('eventId');

  if (!reg) throw ApiError.notFound('Registration not found');

  const event = reg.eventId;

  if (!['registered', 'waiting_submission', 'submitted'].includes(reg.status)) {
    throw ApiError.badRequest('Submission is not allowed at this stage');
  }

  if (!event.fileUploadRequired) {
    throw ApiError.badRequest('This event does not require file submission');
  }

  if (event.submissionDeadline && new Date() > event.submissionDeadline) {
    throw ApiError.badRequest('Submission deadline has passed');
  }

  /* Validate MIME type against event config */
  if (!event.allowedFileTypes.includes(fileMimeType)) {
    await cloudinaryService.deleteFile(fileKey).catch(() => {});
    throw ApiError.badRequest(`File type not allowed. Allowed: ${event.allowedFileTypes.join(', ')}`);
  }

  /* Replace previous submission if one already exists */
  const existing = await Submission.findOne({ registrationId });
  if (existing) {
    await cloudinaryService.deleteFile(existing.fileKey).catch(() => {});
    existing.fileUrl       = fileUrl;
    existing.fileKey       = fileKey;
    existing.fileName      = fileName;
    existing.fileMimeType  = fileMimeType;
    existing.fileSizeBytes = fileSizeBytes;
    existing.status        = 'submitted';
    await existing.save();

    reg.status = 'submitted';
    await reg.save();
    return existing;
  }

  const submission = await Submission.create({
    registrationId,
    userId,
    eventId:       event._id,
    fileUrl,
    fileKey,
    fileName,
    fileMimeType,
    fileSizeBytes,
  });

  reg.status = 'submitted';
  await reg.save();

  logger.info(`Submission uploaded: registration=${registrationId} file=${fileKey}`);
  return submission;
}

async function getMySubmission(userId, registrationId) {
  const teams   = await Team.find({ 'members.userId': userId }).select('_id').lean();
  const teamIds = teams.map(t => t._id);

  const reg = await Registration.findOne({
    _id: registrationId,
    $or: [{ userId }, { teamId: { $in: teamIds } }],
  });
  if (!reg) throw ApiError.notFound('Registration not found');

  const submission = await Submission.findOne({ registrationId }).lean();
  if (!submission) throw ApiError.notFound('No submission found');

  submission.signedFileUrl = await cloudinaryService.getSignedDownloadUrl(submission.fileKey, submission.fileUrl, submission.fileName);
  return submission;
}

module.exports = { uploadSubmission, getMySubmission };
