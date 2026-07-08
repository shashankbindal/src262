'use strict';
const crypto               = require('crypto');
const ConferenceRegistration = require('../models/ConferenceRegistration');
const User                   = require('../models/User');
const ApiError               = require('../utils/ApiError');
const cloudinaryService      = require('./cloudinary.service');
const conferenceConfig       = require('../config/conferenceConfig');
const logger                 = require('../utils/logger');

/* ── Reference number: VPL2026-XXXXXXXX ── */
function generateReferenceNumber() {
  return `VPL2026-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
}

/* ─── User-facing ─────────────────────────────────────────────────────────── */

/**
 * Submit or re-submit conference registration.
 * Also updates the user's profile with all personal / academic / address data.
 */
async function submitConferenceRegistration(userId, {
  /* Profile fields */
  name, phone, dateOfBirth, gender,
  institute, course, yearOfStudy,
  aadhaarNumber, aicheId,
  city, state, country,
  /* University ID card */
  idCardFileUrl, idCardFileKey,
  /* Payment */
  transactionId, screenshotUrl, screenshotKey, needsAccommodation,
}) {
  const accommodation = needsAccommodation === true || needsAccommodation === 'true';
  const registrationFee = accommodation ? conferenceConfig.feeWithAccommodation : conferenceConfig.feeBase;

  const user = await User.findById(userId);
  if (!user) throw ApiError.notFound('User not found');

  /* ── Update user profile ── */
  const profileUpdate = {};
  if (name)           profileUpdate.name = name;
  if (phone)          profileUpdate.phone = phone;
  if (dateOfBirth)    profileUpdate.dateOfBirth = new Date(dateOfBirth);
  if (gender)         profileUpdate.gender = gender;
  if (institute)      profileUpdate.college = institute;
  if (course)         profileUpdate.course = course;
  if (yearOfStudy)    profileUpdate.yearOfStudy = yearOfStudy;
  if (aadhaarNumber)  profileUpdate.aadhaarNumber = aadhaarNumber;
  if (aicheId !== undefined && aicheId !== null) profileUpdate.aicheId = aicheId;
  if (city)           profileUpdate.city = city;
  if (state)          profileUpdate.state = state;
  if (country)        profileUpdate.country = country;

  if (idCardFileUrl) {
    /* Delete old ID card if replacing */
    if (user.universityIdCardKey) {
      await cloudinaryService.deleteFile(user.universityIdCardKey).catch(() => {});
    }
    profileUpdate.universityIdCardUrl = idCardFileUrl;
    profileUpdate.universityIdCardKey = idCardFileKey;
  }

  await User.findByIdAndUpdate(userId, { $set: profileUpdate }, { runValidators: true });

  /* ── Conference registration ── */
  const existing = await ConferenceRegistration.findOne({ userId });

  if (existing) {
    if (existing.isLocked) {
      throw ApiError.forbidden('Conference registration is approved and locked');
    }
    if (existing.status === 'pending') {
      throw ApiError.badRequest('Your registration is already under review');
    }

    /* status === 'rejected' — allow re-submission */
    if (existing.paymentScreenshotKey) {
      await cloudinaryService.deleteFile(existing.paymentScreenshotKey).catch(() => {});
    }

    existing.paymentScreenshotUrl  = screenshotUrl;
    existing.paymentScreenshotKey  = screenshotKey;
    existing.transactionId         = transactionId;
    existing.paymentTimestamp      = new Date();
    existing.needsAccommodation    = accommodation;
    existing.registrationFee       = registrationFee;
    existing.qrVersion             = conferenceConfig.qrVersion;
    existing.status                = 'pending';
    existing.rejectionReason       = '';
    await existing.save();

    logger.info(`Conference registration re-submitted: user=${userId}`);
    return existing;
  }

  /* ── First submission ── */
  const reg = await ConferenceRegistration.create({
    userId,
    transactionId,
    paymentScreenshotUrl: screenshotUrl,
    paymentScreenshotKey: screenshotKey,
    paymentTimestamp:     new Date(),
    needsAccommodation:   accommodation,
    registrationFee,
    qrVersion:            conferenceConfig.qrVersion,
    referenceNumber:      generateReferenceNumber(),
  });

  logger.info(`Conference registration submitted: user=${userId}, ref=${reg.referenceNumber}`);
  return reg;
}

/**
 * Get the user's own conference registration status.
 */
async function getMyConferenceRegistration(userId) {
  const reg = await ConferenceRegistration.findOne({ userId }).lean();
  if (!reg) return null;

  if (reg.paymentScreenshotKey) {
    reg.paymentScreenshotSignedUrl =
      await cloudinaryService.getSignedDownloadUrl(reg.paymentScreenshotKey, reg.paymentScreenshotUrl);
  }

  return reg;
}

/**
 * Public config for the registration form (fee, UPI, options lists).
 */
function getRegistrationConfig() {
  return {
    feeBase:                conferenceConfig.feeBase,
    feeWithAccommodation:   conferenceConfig.feeWithAccommodation,
    upiId:                  conferenceConfig.upiId,
    qrVersion:              conferenceConfig.qrVersion,
    yearOfStudyOptions:     conferenceConfig.yearOfStudyOptions,
    genderOptions:          conferenceConfig.genderOptions,
  };
}

/* ─── Admin-facing ────────────────────────────────────────────────────────── */

async function getConferenceRegistrations({ status, page = 1, limit = 50 } = {}) {
  const filter = {};
  if (status) filter.status = status;

  const options = {
    page,
    limit,
    populate: [{
      path: 'userId',
      select: 'name email college phone dateOfBirth gender course yearOfStudy city state country universityIdCardKey',
    }],
    sort: { createdAt: -1 },
    lean: true,
  };

  return ConferenceRegistration.paginate(filter, options);
}

async function approveConferenceRegistration(adminId, confRegId, { srcId }) {
  if (!srcId || !srcId.trim()) {
    throw ApiError.badRequest('SRC ID is required for approval');
  }

  const trimmedSrcId = srcId.trim().toUpperCase();

  const duplicate = await ConferenceRegistration.findOne({ srcId: trimmedSrcId });
  if (duplicate) {
    throw ApiError.conflict(`SRC ID "${trimmedSrcId}" is already assigned to another participant`);
  }

  const reg = await ConferenceRegistration.findById(confRegId)
    .populate('userId', 'name email');
  if (!reg) throw ApiError.notFound('Conference registration not found');
  if (reg.status === 'approved') throw ApiError.badRequest('Already approved');

  reg.status            = 'approved';
  reg.srcId             = trimmedSrcId;
  reg.approvalTimestamp = new Date();
  reg.approvedBy        = adminId;
  reg.isLocked          = true;
  reg.rejectionReason   = '';
  await reg.save();

  logger.info(`Admin ${adminId} approved conf reg ${confRegId} → SRC ID ${trimmedSrcId}`);
  return reg;
}

async function rejectConferenceRegistration(adminId, confRegId, { reason }) {
  if (!reason || !reason.trim()) {
    throw ApiError.badRequest('Rejection reason is required');
  }

  const reg = await ConferenceRegistration.findById(confRegId)
    .populate('userId', 'name email');
  if (!reg) throw ApiError.notFound('Conference registration not found');
  if (reg.status === 'approved') throw ApiError.badRequest('Cannot reject an already approved registration');

  reg.status          = 'rejected';
  reg.rejectionReason = reason.trim();
  await reg.save();

  logger.info(`Admin ${adminId} rejected conf reg ${confRegId}`);
  return reg;
}

async function getPaymentScreenshot(confRegId) {
  const reg = await ConferenceRegistration.findById(confRegId)
    .populate('userId', 'name email')
    .lean();
  if (!reg) throw ApiError.notFound('Conference registration not found');
  if (!reg.paymentScreenshotKey) throw ApiError.notFound('No payment screenshot uploaded');

  const signedUrl = await cloudinaryService.getSignedDownloadUrl(reg.paymentScreenshotKey, reg.paymentScreenshotUrl);
  return { ...reg, signedUrl };
}

async function getIdCardSignedUrl(confRegId) {
  const reg = await ConferenceRegistration.findById(confRegId)
    .populate('userId', 'universityIdCardKey')
    .lean();
  if (!reg) throw ApiError.notFound('Conference registration not found');

  const key = reg.userId?.universityIdCardKey;
  if (!key) throw ApiError.notFound('No university ID card uploaded');

  const signedUrl = await cloudinaryService.getSignedDownloadUrl(key, reg.userId?.universityIdCardUrl);
  return { signedUrl };
}

async function getConferenceRegistrationOverview() {
  const counts = await ConferenceRegistration.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);

  const map = {};
  for (const c of counts) map[c._id] = c.count;

  return {
    pending:  map.pending  || 0,
    approved: map.approved || 0,
    rejected: map.rejected || 0,
    total:    (map.pending || 0) + (map.approved || 0) + (map.rejected || 0),
  };
}

module.exports = {
  submitConferenceRegistration,
  getMyConferenceRegistration,
  getRegistrationConfig,
  getConferenceRegistrations,
  approveConferenceRegistration,
  rejectConferenceRegistration,
  getPaymentScreenshot,
  getIdCardSignedUrl,
  getConferenceRegistrationOverview,
};
