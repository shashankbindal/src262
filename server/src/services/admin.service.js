'use strict';
const Registration           = require('../models/Registration');
const ConferenceRegistration = require('../models/ConferenceRegistration');
const Submission             = require('../models/Submission');
const Event                  = require('../models/Event');
const User                   = require('../models/User');
const ApiError               = require('../utils/ApiError');
const cloudinaryService      = require('./cloudinary.service');
const confRegService         = require('./conferenceRegistration.service');
const logger                 = require('../utils/logger');
const { Parser }             = require('json2csv');
const ExcelJS                = require('exceljs');

/* ─── Conference Registration Management ──────────────────────────────────── */

const getConferenceRegistrations    = confRegService.getConferenceRegistrations;
const approveConferenceRegistration = confRegService.approveConferenceRegistration;
const rejectConferenceRegistration  = confRegService.rejectConferenceRegistration;
const getConfPaymentScreenshot      = confRegService.getPaymentScreenshot;
const getConfIdCard                 = confRegService.getIdCardSignedUrl;

/* ─── Event Registration Management ──────────────────────────────────────── */

/**
 * Returns registrations for a specific event, filtered by status.
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
    sort: { createdAt: -1 },
    lean: true,
  };

  return Registration.paginate(filter, options);
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

  await Registration.findByIdAndUpdate(sub.registrationId, { status: 'completed' });

  logger.info(`Admin ${adminId} marked submission ${submissionId} as completed`);
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

  result.docs = await Promise.all(
    result.docs.map(async (sub) => ({
      ...sub,
      signedUrl: await cloudinaryService.getSignedDownloadUrl(sub.fileKey, sub.fileUrl),
    }))
  );

  return result;
}

/**
 * Returns a signed URL for a single submission file.
 */
async function getSubmissionFile(registrationId) {
  const sub = await Submission.findOne({ registrationId }).lean();
  if (!sub) throw ApiError.notFound('No submission found for this registration');

  const signedUrl = await cloudinaryService.getSignedDownloadUrl(sub.fileKey, sub.fileUrl);
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
    name:        r.participantSnapshot?.name    || r.userId?.name,
    email:       r.participantSnapshot?.email   || r.userId?.email,
    college:     r.participantSnapshot?.college || r.userId?.college,
    phone:       r.participantSnapshot?.phone   || r.userId?.phone,
    srcId:       r.srcId || '',
    status:      r.status,
    teamName:    r.teamId?.teamName || '',
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
    { header: 'Name',         key: 'name',         width: 25 },
    { header: 'Email',        key: 'email',         width: 30 },
    { header: 'College',      key: 'college',       width: 30 },
    { header: 'Phone',        key: 'phone',         width: 15 },
    { header: 'SRC ID',       key: 'srcId',         width: 15 },
    { header: 'Status',       key: 'status',        width: 20 },
    { header: 'Team Name',    key: 'teamName',      width: 20 },
    { header: 'Registered At',key: 'registeredAt',  width: 22 },
  ];

  for (const r of regs) {
    ws.addRow({
      name:         r.participantSnapshot?.name    || r.userId?.name    || '',
      email:        r.participantSnapshot?.email   || r.userId?.email   || '',
      college:      r.participantSnapshot?.college || r.userId?.college || '',
      phone:        r.participantSnapshot?.phone   || r.userId?.phone   || '',
      srcId:        r.srcId || '',
      status:       r.status,
      teamName:     r.teamId?.teamName || '',
      registeredAt: r.createdAt?.toISOString() || '',
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

async function getFullOverview() {
  const [confRegOverview, eventOverview] = await Promise.all([
    confRegService.getConferenceRegistrationOverview(),
    getEventOverview(),
  ]);

  return { conferenceRegistrations: confRegOverview, events: eventOverview };
}

module.exports = {
  /* Conference Registration */
  getConferenceRegistrations,
  approveConferenceRegistration,
  rejectConferenceRegistration,
  getConfPaymentScreenshot,
  getConfIdCard,
  /* Event Registration */
  getRegistrationsByEvent,
  markSubmissionComplete,
  getSubmissionsByEvent,
  getSubmissionFile,
  /* Exports */
  exportRegistrationsCSV,
  exportRegistrationsExcel,
  /* Overview */
  getEventOverview,
  getFullOverview,
};
