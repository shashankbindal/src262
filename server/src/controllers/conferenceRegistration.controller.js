'use strict';
const asyncHandler   = require('../utils/asyncHandler');
const ApiResponse    = require('../utils/ApiResponse');
const ApiError       = require('../utils/ApiError');
const confRegService = require('../services/conferenceRegistration.service');
const cloudinaryService = require('../services/cloudinary.service');

/* ─── Config (public) ─────────────────────────────────────────────────────── */

const getConfig = asyncHandler(async (_req, res) => {
  const config = confRegService.getRegistrationConfig();
  ApiResponse.ok(res, 'Conference registration config', config);
});

/* ─── User endpoints ─────────────────────────────────────────────────────── */

const MAX_PHOTO_BYTES = 200 * 1024; // 200KB
const ALLOWED_PHOTO_MIMES = ['image/jpeg', 'image/png', 'image/webp'];

const submitConferenceRegistration = asyncHandler(async (req, res) => {
  const screenshotFile = req.files?.screenshot?.[0];
  const idCardFile     = req.files?.universityIdCard?.[0];
  const photoFile      = req.files?.photo?.[0];

  if (!screenshotFile) throw ApiError.badRequest('Payment screenshot is required');

  if (photoFile) {
    if (!ALLOWED_PHOTO_MIMES.includes(photoFile.mimetype)) {
      throw ApiError.badRequest('Profile photo must be a JPEG, PNG, or WebP image');
    }
    if (photoFile.size > MAX_PHOTO_BYTES) {
      throw ApiError.badRequest('Profile photo must be under 200KB');
    }
  }

  const {
    name, phoneCountryCode, phone, dateOfBirth, gender,
    institute, course, yearOfStudy,
    studentChapterName, facultyAdvisorName, facultyAdvisorEmail,
    idType, idNumber, aicheId,
    city, state, country,
    transactionId, needsAccommodation, merchSize,
  } = req.body;

  const screenshotUpload = await cloudinaryService.uploadFile(
    screenshotFile.buffer,
    'payment_proofs',
    screenshotFile.originalname
  );

  let idCardUpload = null;
  if (idCardFile) {
    idCardUpload = await cloudinaryService.uploadFile(
      idCardFile.buffer,
      'id_cards',
      idCardFile.originalname
    );
  }

  let photoUpload = null;
  if (photoFile) {
    photoUpload = await cloudinaryService.uploadFile(
      photoFile.buffer,
      'profile_photos',
      photoFile.originalname
    );
  }

  const reg = await confRegService.submitConferenceRegistration(req.user._id, {
    name, phoneCountryCode, phone, dateOfBirth, gender,
    institute, course, yearOfStudy,
    studentChapterName, facultyAdvisorName, facultyAdvisorEmail,
    idType, idNumber, aicheId,
    city, state, country,
    idCardFileUrl: idCardUpload?.secure_url  || null,
    idCardFileKey: idCardUpload?.public_id   || null,
    photoFileUrl: photoUpload?.secure_url || null,
    photoFileKey: photoUpload?.public_id   || null,
    transactionId,
    needsAccommodation,
    merchSize,
    screenshotUrl: screenshotUpload.secure_url,
    screenshotKey: screenshotUpload.public_id,
  });

  ApiResponse.created(res, 'Conference registration submitted. Pending verification.', reg);
});

const getMyConferenceRegistration = asyncHandler(async (req, res) => {
  const reg = await confRegService.getMyConferenceRegistration(req.user._id);
  ApiResponse.ok(res, 'Conference registration fetched', reg);
});

module.exports = {
  getConfig,
  submitConferenceRegistration,
  getMyConferenceRegistration,
};
