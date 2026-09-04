'use strict';
const crypto               = require('crypto');
const ConferenceRegistration = require('../models/ConferenceRegistration');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const path = require('path');
const User                   = require('../models/User');
const ApiError               = require('../utils/ApiError');
const cloudinaryService      = require('./cloudinary.service');
const emailService           = require('./email.service');
const idCardService          = require('./idCard.service');
const conferenceConfig       = require('../config/conferenceConfig');
const logger                 = require('../utils/logger');
const { Parser }             = require('json2csv');

/* ── Reference number: VPL2026-XXXXXXXX ── */
function generateReferenceNumber() {
  return `VPL2026-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
}

/* Human-readable label for each registration tier. */
const TIER_LABELS = {
  base:          'Registration Only',
  fooding:       'Registration + Fooding',
  accommodation: 'Registration + Accommodation & Fooding',
  rgipt_events:  'Conference Events (RGIPT Student)',
  rgipt_kit:     'Conference Events + Registration Kit (RGIPT Student)',
  rgipt_fooding: 'Conference Events + Registration Kit + Fooding (RGIPT Student)',
};

function tierLabel(reg) {
  return TIER_LABELS[reg?.registrationTier]
    || (reg?.needsAccommodation ? TIER_LABELS.accommodation : TIER_LABELS.base);
}

/* ─── User-facing ─────────────────────────────────────────────────────────── */

/**
 * Submit or re-submit conference registration.
 * Also updates the user's profile with all personal / academic / address data.
 */
async function submitConferenceRegistration(userId, {
  /* Profile fields */
  name, phoneCountryCode, phone, dateOfBirth, gender,
  institute, course, yearOfStudy,
  studentChapterName, facultyAdvisorName, facultyAdvisorEmail,
  idType, idNumber, aicheId,
  city, state, country,
  /* University ID card */
  idCardFileUrl, idCardFileKey,
  /* Conference pass photo */
  photoFileUrl, photoFileKey,
  /* Payment */
  transactionId, screenshotUrl, screenshotKey, registrationTier,
  /* Merch */
  merchSize,
}) {
  const user = await User.findById(userId);
  if (!user) throw ApiError.notFound('User not found');

  const isRgipt = user.email && user.email.toLowerCase().endsWith('@rgipt.ac.in');
  const participantType = isRgipt ? 'internal' : 'external';

  // Strict validation on requested registrationTier matching participantType
  if (isRgipt) {
    if (!['rgipt_events', 'rgipt_kit', 'rgipt_fooding'].includes(registrationTier)) {
      throw ApiError.badRequest('RGIPT students must select one of the allowed host-college registration packages.');
    }
  } else {
    if (!['base', 'fooding', 'accommodation'].includes(registrationTier)) {
      throw ApiError.badRequest('External students must select one of the standard conference tiers.');
    }
  }

  const tier = registrationTier;
  const accommodation = tier === 'accommodation';
  const FEE_BY_TIER = {
    base:             conferenceConfig.feeBase,
    fooding:          conferenceConfig.feeFooding,
    accommodation:    conferenceConfig.feeWithAccommodation,
    rgipt_events:     conferenceConfig.feeRgiptEvents || 500,
    rgipt_kit:        conferenceConfig.feeRgiptKit || 1500,
    rgipt_fooding:    conferenceConfig.feeRgiptFooding || 3500,
  };
  const registrationFee = FEE_BY_TIER[tier];

  /* ── Update user profile ── */
  const profileUpdate = {};
  if (name)             profileUpdate.name = name;
  if (phoneCountryCode) profileUpdate.phoneCountryCode = phoneCountryCode;
  if (phone)            profileUpdate.phone = phone;
  if (dateOfBirth)      profileUpdate.dateOfBirth = new Date(dateOfBirth);
  if (gender)           profileUpdate.gender = gender;
  if (institute)        profileUpdate.college = institute;
  if (course)           profileUpdate.course = course;
  if (yearOfStudy)      profileUpdate.yearOfStudy = yearOfStudy;
  if (studentChapterName)  profileUpdate.studentChapterName = studentChapterName;
  if (facultyAdvisorName)  profileUpdate.facultyAdvisorName = facultyAdvisorName;
  if (facultyAdvisorEmail) profileUpdate.facultyAdvisorEmail = facultyAdvisorEmail;
  if (idType)         profileUpdate.idType = idType;
  if (idNumber)       profileUpdate.idNumber = idNumber;
  if (aicheId !== undefined && aicheId !== null) profileUpdate.aicheId = aicheId;
  if (city)           profileUpdate.city = city;
  if (state)          profileUpdate.state = state;
  if (country)        profileUpdate.country = country;
  if (merchSize)      profileUpdate.merchSize = merchSize;

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
  }

  /* Photo is mandatory — a fresh submission must include one; a
   * re-submission may keep the previously uploaded photo. */
  if (!photoFileUrl && !existing?.photoKey) {
    throw ApiError.badRequest('Profile photo is required');
  }

  if (existing) {
    /* status === 'rejected' — allow re-submission */
    if (existing.paymentScreenshotKey) {
      await cloudinaryService.deleteFile(existing.paymentScreenshotKey).catch(() => {});
    }
    if (photoFileUrl && existing.photoKey) {
      await cloudinaryService.deleteFile(existing.photoKey).catch(() => {});
    }

    existing.paymentScreenshotUrl  = screenshotUrl;
    existing.paymentScreenshotKey  = screenshotKey;
    existing.transactionId         = transactionId;
    existing.paymentTimestamp      = new Date();
    existing.registrationTier      = tier;
    existing.needsAccommodation    = accommodation;
    existing.registrationFee       = registrationFee;
    existing.qrVersion             = conferenceConfig.qrVersion;
    existing.status                = 'pending';
    existing.rejectionReason       = '';
    existing.participantType       = participantType;
    if (photoFileUrl) {
      existing.photoUrl = photoFileUrl;
      existing.photoKey = photoFileKey;
    }
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
    registrationTier:     tier,
    needsAccommodation:   accommodation,
    registrationFee,
    qrVersion:            conferenceConfig.qrVersion,
    referenceNumber:      generateReferenceNumber(),
    photoUrl:             photoFileUrl,
    photoKey:             photoFileKey,
    participantType:      participantType,
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

async function getMyCertificate(userId) {
  const reg = await ConferenceRegistration.findOne({ userId }).lean();
  return reg?.certificateIssued ? reg.certificateUrl : '';
}

async function issueCertificate(adminId, confRegId) {
  const reg = await ConferenceRegistration.findById(confRegId);
  if (!reg) throw ApiError.notFound('Conference registration not found');
  if (reg.status !== 'approved') throw ApiError.badRequest('Only approved participants can receive certificates');
  const user = await require('../models/User').findById(reg.userId).lean();
  const buffer = await generateCertificatePdf(reg, user);
  const result = await cloudinaryService.uploadFile(buffer, 'certificates', `${reg.srcId || reg._id}.pdf`);
  reg.certificateIssued = true; reg.certificateUrl = result.secure_url; reg.certificateKey = result.public_id; reg.certificateIssuedAt = new Date(); reg.certificateIssuedBy = adminId; await reg.save();
  return { certificateUrl: reg.certificateUrl, certificateIssued: true };
}

async function generateCertificatePdf(reg, user) {
  const template = path.join(__dirname, '..', '..', '..', 'client', 'Of Participation.pdf');
  const fs = require('fs');
  const text = String([reg.institute, reg.studentChapterName, user?.college].filter(Boolean).join(' ')).toUpperCase();
  const aliases = [['NIT ROURKELA','NATIONAL INSTITUTE OF TECHNOLOGY'],['BVRIT','B V RAJU','B.V RAJU'],['BMSCE','B.M.S','BMS COLLEGE'],['MIT WPU','MIT WORLD'],['BITS','BIRLA INSTITUTE'],['ICT MUMBAI','ICT'],['VIT','VELLORE INSTITUTE'],['SVNIT','SARDAR VALLABHBHAI']];
  let page = aliases.findIndex(a => a.some(k => text.includes(k))); if (page < 0) page = 0;
  const source = await PDFDocument.load(fs.readFileSync(template));
  const pdf = await PDFDocument.create();
  const [target] = await pdf.copyPages(source, [page]);
  pdf.addPage(target);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const name = String(reg.name || user?.name || '');
  const size = Math.min(20, Math.max(15, 330 / Math.max(1, name.length * .52)));
  const width = font.widthOfTextAtSize(name, size);
  target.drawText(name, { x: (target.getWidth() - width) / 2, y: 320, size, font, color: rgb(0, 0, 0) });
  const src = String(reg.srcId || '');
  target.drawText(src, { x: (target.getWidth() - font.widthOfTextAtSize(src, 10)) / 2, y: 112, size: 10, font, color: rgb(0, 0, 0) });
  return Buffer.from(await pdf.save());
}

async function previewCertificate(confRegId) {
  const reg = await ConferenceRegistration.findById(confRegId).lean();
  if (!reg) throw ApiError.notFound('Conference registration not found');
  if (reg.status !== 'approved') throw ApiError.badRequest('Only approved participants can preview certificates');
  const user = await require('../models/User').findById(reg.userId).lean();
  return generateCertificatePdf(reg, user);
}

async function getCertificate(confRegId) {
  const reg = await ConferenceRegistration.findById(confRegId).lean();
  return reg?.certificateIssued ? reg.certificateUrl : '';
}

async function withdrawCertificate(adminId, confRegId) {
  const reg = await ConferenceRegistration.findById(confRegId);
  if (!reg) throw ApiError.notFound('Conference registration not found');
  if (reg.certificateKey) await cloudinaryService.deleteFile(reg.certificateKey);
  reg.certificateIssued = false;
  reg.certificateUrl = '';
  reg.certificateKey = '';
  reg.certificateIssuedAt = undefined;
  reg.certificateIssuedBy = undefined;
  await reg.save();
  logger.info(`Certificate withdrawn by admin ${adminId} for registration ${confRegId}`);
  return { certificateIssued: false };
}

/**
 * Generates the logged-in attendee's own conference ID card.  The card is
 * available only after the registration has been approved and an SRC ID has
 * been assigned.
 */
async function getMyConferenceIdCard(userId) {
  const reg = await ConferenceRegistration.findOne({ userId })
    .populate('userId', 'name college');

  if (!reg) throw ApiError.notFound('No conference registration found for your account');
  if (reg.status !== 'approved' || !reg.srcId) {
    throw ApiError.forbidden('Your conference ID card will be available once your registration is approved');
  }

  return idCardService.generateIdCardPdf({
    name:     reg.userId?.name || '',
    srcId:    reg.srcId,
    college:  reg.userId?.college || '',
    photoUrl: reg.photoUrl || '',
  });
}

/**
 * Public config for the registration form (fee, UPI, options lists).
 */
function getRegistrationConfig(user) {
  const isRgipt = user && user.email && user.email.toLowerCase().endsWith('@rgipt.ac.in');
  
  const tiers = [];
  if (isRgipt) {
    tiers.push({
      key: 'rgipt_events',
      title: 'Conference Events',
      amount: conferenceConfig.feeRgiptEvents || 500,
      description: 'This fee (₹500) covers your participation in conference events.'
    });
    tiers.push({
      key: 'rgipt_kit',
      title: 'Conference Events + Registration Kit',
      amount: conferenceConfig.feeRgiptKit || 1500,
      description: 'This fee (₹1500) covers your participation in conference events and includes a registration kit.'
    });
    tiers.push({
      key: 'rgipt_fooding',
      title: 'Conference Events + Kit + Fooding',
      amount: conferenceConfig.feeRgiptFooding || 3500,
      description: 'This fee (₹3500) covers your participation in conference events, and includes a registration kit and fooding.'
    });
  } else {
    tiers.push({
      key: 'base',
      title: 'Conference Registration Only',
      amount: conferenceConfig.feeBase,
      description: 'This fee covers your participation in all conference events. No additional event-level fees apply.'
    });
    tiers.push({
      key: 'fooding',
      title: 'Conference Registration + Fooding',
      amount: conferenceConfig.feeFooding,
      description: 'This fee covers your participation in all conference events and campus dining. No additional event-level fees apply.'
    });
    tiers.push({
      key: 'accommodation',
      title: 'Conference Registration + Accommodation & Fooding',
      amount: conferenceConfig.feeWithAccommodation,
      description: 'This fee covers your participation in all conference events, campus dining, and campus accommodation. No additional event-level fees apply.'
    });
  }

  return {
    feeBase:                conferenceConfig.feeBase,
    feeFooding:             conferenceConfig.feeFooding,
    feeWithAccommodation:   conferenceConfig.feeWithAccommodation,
    feeRgiptEvents:         conferenceConfig.feeRgiptEvents || 500,
    feeRgiptKit:            conferenceConfig.feeRgiptKit || 1500,
    feeRgiptFooding:        conferenceConfig.feeRgiptFooding || 3500,
    upiId:                  conferenceConfig.upiId,
    qrVersion:              conferenceConfig.qrVersion,
    yearOfStudyOptions:     conferenceConfig.yearOfStudyOptions,
    genderOptions:          conferenceConfig.genderOptions,
    tiers:                  tiers,
    isRgipt:                isRgipt,
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
      select: 'name email college phoneCountryCode phone dateOfBirth gender course yearOfStudy studentChapterName facultyAdvisorName facultyAdvisorEmail city state country universityIdCardKey',
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
    .populate('userId', 'name email college');
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

  /* Non-blocking: generate the ID card and email it. A failure here must
   * never undo or block the approval itself. */
  (async () => {
    let idCardPdf = null;
    try {
      idCardPdf = await idCardService.generateIdCardPdf({
        name:     reg.userId.name,
        srcId:    trimmedSrcId,
        college:  reg.userId.college,
        photoUrl: reg.photoUrl,
      });
    } catch (err) {
      logger.error(`ID card generation failed for conf reg ${confRegId}: ${err.message}`);
    }
    await emailService.sendConfRegApproved({
      name:   reg.userId.name,
      email:  reg.userId.email,
      srcId:  trimmedSrcId,
      idCardPdf,
    });
  })().catch((err) => logger.error(`Approval email flow failed for conf reg ${confRegId}: ${err.message}`));

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

  emailService.sendConfRegRejected({
    name:   reg.userId.name,
    email:  reg.userId.email,
    reason: reason.trim(),
  }).catch((err) => logger.error(`Rejection email failed for conf reg ${confRegId}: ${err.message}`));

  return reg;
}

/**
 * Sends the status email for one (populated) conference registration:
 * approved → approval email with a freshly generated ID card PDF; rejected →
 * rejection email; pending → nothing (returns 'skipped'). The reg's userId
 * must be populated with name/email/college.
 */
async function sendConfRegStatusEmail(reg) {
  if (reg.status === 'approved') {
    /* Regenerate the ID card so the resent email carries the same PDF pass
     * the participant received on approval. */
    let idCardPdf = null;
    try {
      idCardPdf = await idCardService.generateIdCardPdf({
        name:     reg.userId.name,
        srcId:    reg.srcId,
        college:  reg.userId.college,
        photoUrl: reg.photoUrl,
      });
    } catch (err) {
      logger.error(`ID card regeneration failed on resend for reg ${reg._id}: ${err.message}`);
    }
    await emailService.sendConfRegApproved({
      name:  reg.userId.name,
      email: reg.userId.email,
      srcId: reg.srcId,
      idCardPdf,
      via:   'smtp', // resend buttons deliver over SMTP
    });
    return 'approved';
  }

  if (reg.status === 'rejected') {
    await emailService.sendConfRegRejected({
      name:   reg.userId.name,
      email:  reg.userId.email,
      reason: reg.rejectionReason,
      via:    'smtp',
    });
    return 'rejected';
  }

  return 'skipped'; // pending — no confirmation email exists yet
}

/**
 * Re-sends the conference registration email to the logged-in user for their
 * own registration.
 */
async function resendConfRegEmail(userId) {
  const reg = await ConferenceRegistration.findOne({ userId })
    .populate('userId', 'name email college');
  if (!reg) throw ApiError.notFound('No conference registration found for your account');

  const result = await sendConfRegStatusEmail(reg);
  if (result === 'skipped') {
    throw ApiError.badRequest('Your registration is still under review. The confirmation email will be available once it is approved.');
  }
  logger.info(`Resent ${result} email for conf reg of user ${userId}`);
  return { status: result, email: reg.userId.email };
}

/**
 * Admin bulk resend: re-sends the status email for each selected conference
 * registration id. Pending registrations are skipped (no email to send).
 * Best-effort — one failure never aborts the batch.
 */
async function bulkResendConfRegEmails(ids) {
  if (!Array.isArray(ids) || ids.length === 0) {
    throw ApiError.badRequest('No conference registrations selected');
  }
  const regs = await ConferenceRegistration.find({ _id: { $in: ids } })
    .populate('userId', 'name email college');

  let sent = 0, skipped = 0, failed = 0;
  for (const reg of regs) {
    try {
      const result = await sendConfRegStatusEmail(reg);
      if (result === 'skipped') skipped++; else sent++;
    } catch (err) {
      failed++;
      logger.error(`Bulk conf resend failed for reg ${reg._id}: ${err.message}`);
    }
  }
  logger.info(`Admin bulk conf resend: ${sent} sent, ${skipped} skipped (pending), ${failed} failed`);
  return { total: regs.length, sent, skipped, failed };
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

const DETAIL_FIELDS = '+idType +idNumber name email college phoneCountryCode phone dateOfBirth '
  + 'gender course yearOfStudy studentChapterName facultyAdvisorName facultyAdvisorEmail '
  + 'aicheId city state country universityIdCardKey universityIdCardUrl merchSize';

/**
 * Renders the conference ID card PDF on demand so an admin can preview it
 * any time (not just at the moment of approval). Uses "PENDING" in place
 * of the SRC ID for registrations not yet approved.
 */
async function getIdCardPreview(confRegId) {
  const reg = await ConferenceRegistration.findById(confRegId)
    .populate('userId', 'name college')
    .lean();
  if (!reg) throw ApiError.notFound('Conference registration not found');
  if (!reg.photoUrl) throw ApiError.notFound('No profile photo uploaded for this registration');

  return idCardService.generateIdCardPdf({
    name:     reg.userId?.name || '',
    srcId:    reg.srcId || 'PENDING',
    college:  reg.userId?.college || '',
    photoUrl: reg.photoUrl,
  });
}

/**
 * Full detail for a single conference registration — includes the
 * identity document number (Aadhaar/passport), which is select:false
 * everywhere else. Admin-only.
 */
async function getConferenceRegistrationDetail(confRegId) {
  const reg = await ConferenceRegistration.findById(confRegId)
    .populate('userId', DETAIL_FIELDS)
    .lean();
  if (!reg) throw ApiError.notFound('Conference registration not found');

  if (reg.paymentScreenshotKey) {
    reg.paymentScreenshotSignedUrl =
      await cloudinaryService.getSignedDownloadUrl(reg.paymentScreenshotKey, reg.paymentScreenshotUrl);
  }
  if (reg.userId?.universityIdCardKey) {
    reg.userId.universityIdCardSignedUrl =
      await cloudinaryService.getSignedDownloadUrl(reg.userId.universityIdCardKey, reg.userId.universityIdCardUrl);
  }

  return reg;
}

/**
 * CSV export of every conference registration (optionally filtered by
 * status) with the full participant detail — for admin record-keeping.
 */
async function exportConferenceRegistrationsCSV(status) {
  const filter = {};
  if (status) filter.status = status;

  const regs = await ConferenceRegistration.find(filter)
    .populate('userId', DETAIL_FIELDS)
    .sort({ createdAt: -1 })
    .lean();

  const rows = regs.map((r) => {
    const u = r.userId || {};
    return {
      name:                u.name || '',
      email:               u.email || '',
      phone:               u.phone ? `${u.phoneCountryCode || ''}${u.phone}` : '',
      dateOfBirth:         u.dateOfBirth ? new Date(u.dateOfBirth).toISOString().split('T')[0] : '',
      gender:              u.gender || '',
      institute:           u.college || '',
      course:              u.course || '',
      yearOfStudy:         u.yearOfStudy || '',
      studentChapterName:  u.studentChapterName || '',
      facultyAdvisorName:  u.facultyAdvisorName || '',
      facultyAdvisorEmail: u.facultyAdvisorEmail || '',
      idType:              u.idType || '',
      idNumber:            u.idNumber || '',
      aicheId:             u.aicheId || '',
      city:                u.city || '',
      state:               u.state || '',
      country:             u.country || '',
      merchSize:           u.merchSize || '',
      participantType:     r.participantType || 'external',
      registrationTier:    r.registrationTier || 'base',
      needsAccommodation:  r.needsAccommodation ? 'Yes' : 'No',
      registrationFee:     r.registrationFee ?? '',
      transactionId:       r.transactionId || '',
      status:              r.status,
      srcId:               r.srcId || '',
      referenceNumber:     r.referenceNumber || '',
      rejectionReason:     r.rejectionReason || '',
      submittedAt:         r.paymentTimestamp ? new Date(r.paymentTimestamp).toISOString() : '',
      approvedAt:          r.approvalTimestamp ? new Date(r.approvalTimestamp).toISOString() : '',
    };
  });

  const parser = new Parser();
  return parser.parse(rows);
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

/**
 * Public verification lookup used by the QR code on the conference ID card.
 * Returns only non-sensitive confirmation data, and only for an approved
 * registration — an unknown or not-yet-approved SRC ID is treated as invalid.
 */
async function verifyBySrcId(srcId) {
  if (!srcId || !srcId.trim()) throw ApiError.badRequest('SRC ID is required');
  const normalized = srcId.trim().toUpperCase();

  const reg = await ConferenceRegistration.findOne({ srcId: normalized, status: 'approved' })
    .populate('userId', 'name college')
    .lean();

  if (!reg) throw ApiError.notFound('No approved registration found for this SRC ID');

  return {
    valid:            true,
    srcId:            reg.srcId,
    name:             reg.userId?.name || '',
    institute:        reg.userId?.college || '',
    photoUrl:         reg.photoUrl || '',
    registrationType: tierLabel(reg),
    approvedOn:       reg.approvalTimestamp || null,
  };
}

module.exports = {
  submitConferenceRegistration,
  getMyConferenceRegistration,
  getMyCertificate,
  issueCertificate,
  previewCertificate,
  getCertificate,
  withdrawCertificate,
  getMyConferenceIdCard,
  resendConfRegEmail,
  bulkResendConfRegEmails,
  getRegistrationConfig,
  verifyBySrcId,
  getConferenceRegistrations,
  getConferenceRegistrationDetail,
  getIdCardPreview,
  exportConferenceRegistrationsCSV,
  approveConferenceRegistration,
  rejectConferenceRegistration,
  getPaymentScreenshot,
  getIdCardSignedUrl,
  getConferenceRegistrationOverview,
};
