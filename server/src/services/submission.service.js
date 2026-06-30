'use strict';
const Registration   = require('../models/Registration');
const Submission     = require('../models/Submission');
const Event          = require('../models/Event');
const Team           = require('../models/Team');
const ApiError       = require('../utils/ApiError');
const storageService = require('./storage.service');
const emailService   = require('./email.service');
const User           = require('../models/User');
const { env }        = require('../config/env');
const logger         = require('../utils/logger');

async function uploadSubmission(userId, registrationId, { fileUrl, fileKey, fileName, fileMimeType, fileSizeBytes }) {
  const teams = await Team.find({ 'members.userId': userId }).select('_id').lean();
  const teamIds = teams.map(t => t._id);

  const reg = await Registration.findOne({
    _id: registrationId,
    $or: [{ userId }, { teamId: { $in: teamIds } }]
  }).populate('eventId');
  if (!reg) throw ApiError.notFound('Registration not found');

  const event = reg.eventId;

  if (reg.status !== 'payment_approved' && reg.status !== 'waiting_submission') {
    throw ApiError.badRequest('Submission is only allowed after payment approval');
  }

  if (!event.fileUploadRequired) {
    throw ApiError.badRequest('This event does not require file submission');
  }

  if (event.submissionDeadline && new Date() > event.submissionDeadline) {
    throw ApiError.badRequest('Submission deadline has passed');
  }

  /* Validate MIME type against event config */
  if (!event.allowedFileTypes.includes(fileMimeType)) {
    await storageService.deleteFile(fileKey);
    throw ApiError.badRequest(`File type not allowed. Allowed: ${event.allowedFileTypes.join(', ')}`);
  }

  /* Replace previous submission file if one already exists */
  const existing = await Submission.findOne({ registrationId });
  if (existing) {
    await storageService.deleteFile(existing.fileKey);
    existing.fileUrl       = fileUrl;
    existing.fileKey       = fileKey;
    existing.fileName      = fileName;
    existing.fileMimeType  = fileMimeType;
    existing.fileSizeBytes = fileSizeBytes;
    existing.status        = 'submitted';
    existing.updatedAt     = new Date();
    await existing.save();

    reg.status = 'submitted';
    await reg.save();
    return existing;
  }

  /* First submission */
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

  const user = await User.findById(userId).lean();
  const dashboardUrl = `${env.CLIENT_URL}/dashboard`;

  emailService.sendSubmissionReceived({
    name:      user?.name || 'Participant',
    email:     user?.email,
    eventName: event.name,
    fileName,
    dashboardUrl,
  }).catch(() => {});

  logger.info(`Submission uploaded: registration=${registrationId} file=${fileKey}`);
  return submission;
}

async function getMySubmission(userId, registrationId) {
  const teams = await Team.find({ 'members.userId': userId }).select('_id').lean();
  const teamIds = teams.map(t => t._id);

  const reg = await Registration.findOne({
    _id: registrationId,
    $or: [{ userId }, { teamId: { $in: teamIds } }]
  });
  if (!reg) throw ApiError.notFound('Registration not found');

  const submission = await Submission.findOne({ registrationId }).lean();
  if (!submission) throw ApiError.notFound('No submission found');

  /* Generate signed URL for download */
  submission.signedUrl = await storageService.getSignedDownloadUrl(submission.fileKey);
  return submission;
}

module.exports = { uploadSubmission, getMySubmission };
