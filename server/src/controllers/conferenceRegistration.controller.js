'use strict';
const asyncHandler   = require('../utils/asyncHandler');
const ApiResponse    = require('../utils/ApiResponse');
const ApiError       = require('../utils/ApiError');
const confRegService = require('../services/conferenceRegistration.service');
const cloudinaryService = require('../services/cloudinary.service');

/* ─── Config (public, optionally authenticated) ───────────────────────────── */

const getConfig = asyncHandler(async (req, res) => {
  let user = null;
  let token = req.cookies?.accessToken;

  if (!token) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.slice(7);
    }
  }

  if (token) {
    try {
      const { verifyAccessToken } = require('../utils/generateToken');
      const User = require('../models/User');
      const payload = verifyAccessToken(token);
      user = await User.findById(payload.sub).lean();
    } catch (e) {
      // Ignore token errors for public config
    }
  }

  const config = confRegService.getRegistrationConfig(user);
  ApiResponse.ok(res, 'Conference registration config', config);
});

/* Public verification of a conference pass by its SRC ID (QR-code target). */
const verifyRegistration = asyncHandler(async (req, res) => {
  const result = await confRegService.verifyBySrcId(req.params.srcId);
  ApiResponse.ok(res, 'Registration verified', result);
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
    transactionId, registrationTier, merchSize,
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
    registrationTier,
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

/* Render the logged-in approved attendee's conference ID card. */
const getMyConferenceIdCard = asyncHandler(async (req, res) => {
  const pdf = await confRegService.getMyConferenceIdCard(req.user._id);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'inline; filename="VIPLAV-2026-ID-Card.pdf"');
  res.send(pdf);
});

const getMyCertificate = asyncHandler(async (req, res) => {
  const url = await confRegService.getMyCertificate(req.user._id);
  if (!url) return res.status(404).json({ message: 'Certificate has not been issued yet' });
  res.redirect(url);
});

/* Resend the conference registration email (with ID card PDF, if approved). */
const resendMyConfRegEmail = asyncHandler(async (req, res) => {
  const result = await confRegService.resendConfRegEmail(req.user._id);
  ApiResponse.ok(res, `Email sent to ${result.email}. Please check your inbox (and spam folder).`, result);
});

module.exports = {
  getConfig,
  verifyRegistration,
  submitConferenceRegistration,
  getMyConferenceRegistration,
  getMyConferenceIdCard,
  getMyCertificate,
  resendMyConfRegEmail,
};
