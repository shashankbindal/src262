'use strict';
const Registration   = require('../models/Registration');
const Submission     = require('../models/Submission');
const Event          = require('../models/Event');
const User           = require('../models/User');
const Team           = require('../models/Team');
const ApiError       = require('../utils/ApiError');
const emailService   = require('./email.service');
const storageService = require('./storage.service');
const { env }        = require('../config/env');
const logger         = require('../utils/logger');
const { Parser }     = require('json2csv');
const ExcelJS        = require('exceljs');

const DASHBOARD_URL = `${env.CLIENT_URL}/dashboard`;

/* ─── Registration Management ─────────────────────────────────────────────── */

/**
 * Returns registrations for a specific event, filtered by status.
 * Supports pagination and optional status filter.
 */
async function getRegistrationsByEvent(eventId, { status, page = 1, limit = 50 } = {}) {
  const filter = { eventId };
  if (status) filter.status = status;

  const options = {
    page,
    limit,
    populate: [
      { path: 'userId', select: 'name email college phone' },
      { path: 'teamId', select: 'teamName members' },
    ],
    sort:     { createdAt: -1 },
    lean:     true,
  };

  return Registration.paginate(filter, options);
}

/**
 * Admin approves or rejects a payment.
 */
async function decidePayment(adminId, registrationId, { action, reason }) {
  const reg = await Registration.findById(registrationId)
    .populate('userId', 'name email')
    .populate('eventId', 'name fileUploadRequired');

  if (!reg) throw ApiError.notFound('Registration not found');
  if (reg.status !== 'payment_submitted') {
    throw ApiError.badRequest('Registration is not in "payment_submitted" state');
  }

  if (action === 'approve') {
    reg.status   = reg.eventId.fileUploadRequired ? 'waiting_submission' : 'payment_approved';
    reg.isLocked = true;
    await reg.save();

    logger.info(`Admin ${adminId} approved registration ${registrationId}`);

    emailService.sendPaymentApproved({
      name:         reg.userId.name,
      email:        reg.userId.email,
      eventName:    reg.eventId.name,
      dashboardUrl: DASHBOARD_URL,
    }).catch(() => {});

    if (!reg.eventId.fileUploadRequired) {
      /* Immediately confirm participation if no submission needed */
      emailService.sendParticipationConfirmation({
        name:      reg.userId.name,
        email:     reg.userId.email,
        eventName: reg.eventId.name,
      }).catch(() => {});
    }
  } else {
    reg.status                = 'payment_rejected';
    reg.paymentRejectedReason = reason;
    await reg.save();

    logger.info(`Admin ${adminId} rejected registration ${registrationId}: ${reason}`);

    emailService.sendPaymentRejected({
      name:         reg.userId.name,
      email:        reg.userId.email,
      eventName:    reg.eventId.name,
      reason,
      dashboardUrl: DASHBOARD_URL,
    }).catch(() => {});
  }

  return reg;
}

/**
 * Admin marks a submission as completed (after review).
 */
async function markSubmissionComplete(adminId, submissionId, { reviewNotes = '' } = {}) {
  const sub = await Submission.findById(submissionId)
    .populate('userId', 'name email')
    .populate('eventId', 'name');

  if (!sub) throw ApiError.notFound('Submission not found');

  sub.status      = 'completed';
  sub.reviewNotes = reviewNotes;
  await sub.save();

  /* Also update registration status */
  await Registration.findByIdAndUpdate(sub.registrationId, { status: 'completed' });

  logger.info(`Admin ${adminId} marked submission ${submissionId} as completed`);

  emailService.sendParticipationConfirmation({
    name:      sub.userId.name,
    email:     sub.userId.email,
    eventName: sub.eventId.name,
  }).catch(() => {});

  return sub;
}

/**
 * Returns all submissions for an event with signed download URLs.
 */
async function getSubmissionsByEvent(eventId, { status, page = 1, limit = 50 } = {}) {
  const filter = { eventId };
  if (status) filter.status = status;

  const options = {
    page,
    limit,
    populate: [{ path: 'userId', select: 'name email college' }],
    sort:     { createdAt: -1 },
    lean:     true,
  };

  const result = await Submission.paginate(filter, options);

  /* Attach signed URLs */
  result.docs = await Promise.all(
    result.docs.map(async (sub) => ({
      ...sub,
      signedUrl: await storageService.getSignedDownloadUrl(sub.fileKey),
    }))
  );

  return result;
}

/**
 * Returns a signed URL for a single payment screenshot (for admin review).
 */
async function getPaymentScreenshot(registrationId) {
  const reg = await Registration.findById(registrationId)
    .select('paymentScreenshotKey paymentScreenshotUrl userId eventId')
    .populate('userId', 'name email')
    .populate('eventId', 'name')
    .lean();

  if (!reg) throw ApiError.notFound('Registration not found');
  if (!reg.paymentScreenshotKey) throw ApiError.notFound('No payment screenshot uploaded');

  const signedUrl = await storageService.getSignedDownloadUrl(reg.paymentScreenshotKey);
  return { ...reg, signedUrl };
}

/**
 * Returns a signed URL for a single submission file (for admin download).
 */
async function getSubmissionFile(registrationId) {
  const sub = await Submission.findOne({ registrationId }).lean();
  if (!sub) throw ApiError.notFound('No submission found for this registration');
  
  const signedUrl = await storageService.getSignedDownloadUrl(sub.fileKey);
  return { ...sub, signedUrl };
}

/* ─── Export ──────────────────────────────────────────────────────────────── */

async function exportRegistrationsCSV(eventId, status) {
  const filter = { eventId };
  if (status) filter.status = status;

  const regs = await Registration.find(filter)
    .populate('userId', 'name email college phone')
    .populate('teamId', 'teamName members')
    .lean();

  const rows = regs.map((r) => ({
    name:         r.participantSnapshot?.name || r.userId?.name,
    email:        r.participantSnapshot?.email || r.userId?.email,
    college:      r.participantSnapshot?.college || r.userId?.college,
    phone:        r.participantSnapshot?.phone || r.userId?.phone,
    status:       r.status,
    transactionId: r.transactionId || '',
    teamName:     r.teamId?.teamName || '',
    registeredAt: r.createdAt,
  }));

  const parser = new Parser();
  return parser.parse(rows);
}

async function exportRegistrationsExcel(eventId, status) {
  const filter = { eventId };
  if (status) filter.status = status;

  const regs = await Registration.find(filter)
    .populate('userId', 'name email college phone')
    .populate('teamId', 'teamName members')
    .populate('eventId', 'name')
    .lean();

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Registrations');

  ws.columns = [
    { header: 'Name',          key: 'name',          width: 25 },
    { header: 'Email',         key: 'email',         width: 30 },
    { header: 'College',       key: 'college',       width: 30 },
    { header: 'Phone',         key: 'phone',         width: 15 },
    { header: 'Status',        key: 'status',        width: 20 },
    { header: 'Transaction ID',key: 'transactionId', width: 20 },
    { header: 'Team Name',     key: 'teamName',      width: 20 },
    { header: 'Registered At', key: 'registeredAt',  width: 22 },
  ];

  for (const r of regs) {
    ws.addRow({
      name:          r.participantSnapshot?.name || r.userId?.name || '',
      email:         r.participantSnapshot?.email || r.userId?.email || '',
      college:       r.participantSnapshot?.college || r.userId?.college || '',
      phone:         r.participantSnapshot?.phone || r.userId?.phone || '',
      status:        r.status,
      transactionId: r.transactionId || '',
      teamName:      r.teamId?.teamName || '',
      registeredAt:  r.createdAt?.toISOString() || '',
    });
  }

  return wb;
}

/* ─── Dashboard Overview ──────────────────────────────────────────────────── */

async function getEventOverview() {
  const events = await Event.find().lean();

  const overview = await Promise.all(
    events.map(async (evt) => {
      const counts = await Registration.aggregate([
        { $match: { eventId: evt._id } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]);

      const statusMap = {};
      for (const c of counts) statusMap[c._id] = c.count;

      return {
        event:  evt,
        counts: statusMap,
        total:  counts.reduce((s, c) => s + c.count, 0),
      };
    })
  );

  return overview;
}

module.exports = {
  getRegistrationsByEvent,
  decidePayment,
  markSubmissionComplete,
  getSubmissionsByEvent,
  getPaymentScreenshot,
  getSubmissionFile,
  exportRegistrationsCSV,
  exportRegistrationsExcel,
  getEventOverview,
};
