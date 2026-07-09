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

const submitConferenceRegistration = asyncHandler(async (req, res) => {
  const screenshotFile = req.files?.screenshot?.[0];
  const idCardFile     = req.files?.universityIdCard?.[0];

  if (!screenshotFile) throw ApiError.badRequest('Payment screenshot is required');

  const {
    name, phoneCountryCode, phone, dateOfBirth, gender,
    institute, course, yearOfStudy,
    studentChapterName, facultyAdvisorName, facultyAdvisorEmail,
    idType, idNumber, aicheId,
    city, state, country,
    transactionId, needsAccommodation,
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

  const reg = await confRegService.submitConferenceRegistration(req.user._id, {
    name, phoneCountryCode, phone, dateOfBirth, gender,
    institute, course, yearOfStudy,
    studentChapterName, facultyAdvisorName, facultyAdvisorEmail,
    idType, idNumber, aicheId,
    city, state, country,
    idCardFileUrl: idCardUpload?.secure_url  || null,
    idCardFileKey: idCardUpload?.public_id   || null,
    transactionId,
    needsAccommodation,
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
