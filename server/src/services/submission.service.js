'use strict';
const Registration   = require('../models/Registration');
const Submission     = require('../models/Submission');
const Event          = require('../models/Event');
const Team           = require('../models/Team');
const User           = require('../models/User');
const ApiError       = require('../utils/ApiError');
const cloudinaryService = require('./cloudinary.service');
const logger         = require('../utils/logger');

async function uploadSubmission(userId, registrationId, fileInfos) {
  const teams   = await Team.find({ 'members.userId': userId }).select('_id').lean();
  const teamIds = teams.map(t => t._id);

  const reg = await Registration.findOne({
    _id: registrationId,
    $or: [{ userId }, { teamId: { $in: teamIds } }],
  }).populate('eventId');

  if (!reg) throw ApiError.notFound('Registration not found');

  const event = reg.eventId;

  if (!['registered', 'waiting_submission', 'submitted'].includes(reg.status)) {
    await Promise.all(fileInfos.map(f => cloudinaryService.deleteFile(f.fileKey).catch(() => {})));
    throw ApiError.badRequest('Submission is not allowed at this stage');
  }

  if (!event.fileUploadRequired) {
    await Promise.all(fileInfos.map(f => cloudinaryService.deleteFile(f.fileKey).catch(() => {})));
    throw ApiError.badRequest('This event does not require file submission');
  }

  const isMultiple = event.pdfUploadMode === 'multiple';
  if (!isMultiple && fileInfos.length > 1) {
    await Promise.all(fileInfos.map(f => cloudinaryService.deleteFile(f.fileKey).catch(() => {})));
    throw ApiError.badRequest('Only a single file submission is allowed for this event');
  }

  if (event.submissionDeadline && new Date() > event.submissionDeadline) {
    await Promise.all(fileInfos.map(f => cloudinaryService.deleteFile(f.fileKey).catch(() => {})));
    throw ApiError.badRequest('Submission deadline has passed');
  }

  /* Validate MIME type against event config */
  for (const file of fileInfos) {
    if (!event.allowedFileTypes.includes(file.fileMimeType)) {
      await Promise.all(fileInfos.map(f => cloudinaryService.deleteFile(f.fileKey).catch(() => {})));
      throw ApiError.badRequest(`File type not allowed. Allowed: ${event.allowedFileTypes.join(', ')}`);
    }
  }

  const primaryFile = fileInfos[0];

  /* Replace previous submission if one already exists */
  const existing = await Submission.findOne({ registrationId });
  if (existing) {
    if (existing.files && existing.files.length > 0) {
      await Promise.all(existing.files.map(f => cloudinaryService.deleteFile(f.fileKey).catch(() => {})));
    } else if (existing.fileKey) {
      await cloudinaryService.deleteFile(existing.fileKey).catch(() => {});
    }

    existing.files            = fileInfos;
    existing.fileUrl          = primaryFile.fileUrl;
    existing.fileKey          = primaryFile.fileKey;
    existing.fileName         = primaryFile.fileName;
    existing.originalFileName = primaryFile.originalFileName;
    existing.fileMimeType     = primaryFile.fileMimeType;
    existing.fileSizeBytes    = primaryFile.fileSizeBytes;
    existing.status           = 'submitted';
    await existing.save();

    reg.status = 'submitted';
    await reg.save();
    return existing;
  }

  const submission = await Submission.create({
    registrationId,
    userId,
    eventId:          event._id,
    files:            fileInfos,
    fileUrl:          primaryFile.fileUrl,
    fileKey:          primaryFile.fileKey,
    fileName:         primaryFile.fileName,
    originalFileName: primaryFile.originalFileName,
    fileMimeType:     primaryFile.fileMimeType,
    fileSizeBytes:    primaryFile.fileSizeBytes,
    status:           'submitted',
  });

  reg.status = 'submitted';
  await reg.save();

  logger.info(`Submission uploaded: registration=${registrationId} filesCount=${fileInfos.length}`);
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

  if (submission.files && submission.files.length > 0) {
    const signedFiles = await Promise.all(
      submission.files.map(async (file) => ({
        ...file,
        signedFileUrl: await cloudinaryService.getSignedDownloadUrl(
          file.fileKey,
          file.fileUrl,
          file.originalFileName || file.fileName
        ),
      }))
    );
    submission.files = signedFiles;
    submission.signedFileUrl = signedFiles[0].signedFileUrl;
  } else if (submission.fileKey) {
    submission.signedFileUrl = await cloudinaryService.getSignedDownloadUrl(submission.fileKey, submission.fileUrl, submission.originalFileName || submission.fileName);
  }

  return submission;
}

async function replaceSubmissionFile(userId, registrationId, oldFileKey, newFile) {
  const teams   = await Team.find({ 'members.userId': userId }).select('_id').lean();
  const teamIds = teams.map(t => t._id);

  const reg = await Registration.findOne({
    _id: registrationId,
    $or: [{ userId }, { teamId: { $in: teamIds } }],
  });
  if (!reg) throw ApiError.notFound('Registration not found');

  const submission = await Submission.findOne({ registrationId });
  if (!submission) throw ApiError.notFound('No submission found');

  let fileIndex = -1;
  if (submission.files && submission.files.length > 0) {
    fileIndex = submission.files.findIndex(f => f.fileKey === oldFileKey);
  } else if (submission.fileKey === oldFileKey) {
    fileIndex = 0;
  }

  if (fileIndex === -1) {
    throw ApiError.notFound('File to replace not found in this submission');
  }

  const uploadResult = await cloudinaryService.uploadFile(
    newFile.buffer,
    'submissions',
    newFile.originalname
  );

  await cloudinaryService.deleteFile(oldFileKey).catch(() => {});

  const newFileInfo = {
    fileUrl: uploadResult.secure_url,
    fileKey: uploadResult.public_id,
    fileName: newFile.originalname,
    originalFileName: newFile.originalname,
    fileMimeType: newFile.mimetype,
    fileSizeBytes: newFile.size,
  };

  if (submission.files && submission.files.length > 0) {
    submission.files[fileIndex] = newFileInfo;
    if (fileIndex === 0) {
      submission.fileUrl = newFileInfo.fileUrl;
      submission.fileKey = newFileInfo.fileKey;
      submission.fileName = newFileInfo.fileName;
      submission.originalFileName = newFileInfo.originalFileName;
      submission.fileMimeType = newFileInfo.fileMimeType;
      submission.fileSizeBytes = newFileInfo.fileSizeBytes;
    }
  } else {
    submission.fileUrl = newFileInfo.fileUrl;
    submission.fileKey = newFileInfo.fileKey;
    submission.fileName = newFileInfo.fileName;
    submission.originalFileName = newFileInfo.originalFileName;
    submission.fileMimeType = newFileInfo.fileMimeType;
    submission.fileSizeBytes = newFileInfo.fileSizeBytes;
  }

  submission.status = 'submitted';
  await submission.save();

  reg.status = 'submitted';
  await reg.save();

  logger.info(`Submission file replaced: registrationId=${registrationId} oldKey=${oldFileKey} newKey=${newFileInfo.fileKey}`);
  return submission;
}

async function addSubmissionFile(userId, registrationId, newFile) {
  const teams   = await Team.find({ 'members.userId': userId }).select('_id').lean();
  const teamIds = teams.map(t => t._id);

  const reg = await Registration.findOne({
    _id: registrationId,
    $or: [{ userId }, { teamId: { $in: teamIds } }],
  }).populate('eventId');
  if (!reg) throw ApiError.notFound('Registration not found');

  const event = reg.eventId;
  if (!event) throw ApiError.notFound('Event not found');

  if (event.pdfUploadMode !== 'multiple') {
    throw ApiError.badRequest('This event does not allow multiple file submissions');
  }

  const submission = await Submission.findOne({ registrationId });
  if (!submission) throw ApiError.notFound('No submission found. Please upload the first file through the standard upload form.');

  if (submission.files && submission.files.length >= 10) {
    throw ApiError.badRequest('Maximum limit of 10 files reached');
  }

  const uploadResult = await cloudinaryService.uploadFile(
    newFile.buffer,
    'submissions',
    newFile.originalname
  );

  const newFileInfo = {
    fileUrl: uploadResult.secure_url,
    fileKey: uploadResult.public_id,
    fileName: newFile.originalname,
    originalFileName: newFile.originalname,
    fileMimeType: newFile.mimetype,
    fileSizeBytes: newFile.size,
  };

  if (!submission.files || submission.files.length === 0) {
    submission.files = [
      {
        fileUrl: submission.fileUrl,
        fileKey: submission.fileKey,
        fileName: submission.fileName,
        originalFileName: submission.originalFileName,
        fileMimeType: submission.fileMimeType,
        fileSizeBytes: submission.fileSizeBytes,
      },
      newFileInfo
    ];
  } else {
    submission.files.push(newFileInfo);
  }

  submission.status = 'submitted';
  await submission.save();

  reg.status = 'submitted';
  await reg.save();

  logger.info(`Submission file added: registrationId=${registrationId} key=${newFileInfo.fileKey}`);
  return submission;
}

module.exports = { uploadSubmission, getMySubmission, replaceSubmissionFile, addSubmissionFile };
