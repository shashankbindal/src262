'use strict';
const Registration           = require('../models/Registration');
const ConferenceRegistration = require('../models/ConferenceRegistration');
const Submission             = require('../models/Submission');
const Event                  = require('../models/Event');
const User                   = require('../models/User');
const Team                   = require('../models/Team');
const ApiError               = require('../utils/ApiError');
const cloudinaryService      = require('./cloudinary.service');
const confRegService         = require('./conferenceRegistration.service');
const logger                 = require('../utils/logger');
const { Parser }             = require('json2csv');
const ExcelJS                = require('exceljs');

/* ─── Conference Registration Management ──────────────────────────────────── */

const getConferenceRegistrations    = confRegService.getConferenceRegistrations;
const getConferenceRegistrationDetail = confRegService.getConferenceRegistrationDetail;
const getIdCardPreview              = confRegService.getIdCardPreview;
const exportConferenceRegistrationsCSV = confRegService.exportConferenceRegistrationsCSV;
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

/* ─── Event Management (create / update / delete) ─────────────────────────── */

function slugify(name) {
  return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

const EVENT_UPDATABLE_FIELDS = [
  'name', 'slug', 'description', 'type', 'registrationDeadline', 'submissionDeadline',
  'fileUploadRequired', 'allowedFileTypes', 'maxFileSizeMB', 'minTeamSize', 'maxTeamSize',
  'registrationEnabled',
];

async function createEvent(data) {
  const slug = data.slug || slugify(data.name);

  const existing = await Event.findOne({ slug });
  if (existing) throw ApiError.conflict(`An event with slug "${slug}" already exists`);

  const event = await Event.create({
    name:                 data.name,
    slug,
    description:          data.description || '',
    type:                 data.type,
    registrationDeadline: data.registrationDeadline,
    submissionDeadline:   data.submissionDeadline || undefined,
    fileUploadRequired:   Boolean(data.fileUploadRequired),
    allowedFileTypes:     data.allowedFileTypes || ['application/pdf'],
    maxFileSizeMB:        data.maxFileSizeMB || 10,
    minTeamSize:          data.minTeamSize,
    maxTeamSize:          data.maxTeamSize,
    registrationEnabled:  data.registrationEnabled !== undefined ? data.registrationEnabled : true,
  });

  logger.info(`Event created: ${event.name} (${event._id})`);
  return event;
}

async function updateEvent(eventId, data) {
  const update = {};
  for (const field of EVENT_UPDATABLE_FIELDS) {
    if (data[field] !== undefined) update[field] = data[field];
  }

  if (update.slug) {
    const existing = await Event.findOne({ slug: update.slug, _id: { $ne: eventId } });
    if (existing) throw ApiError.conflict(`An event with slug "${update.slug}" already exists`);
  }

  const event = await Event.findByIdAndUpdate(eventId, { $set: update }, { new: true, runValidators: true });
  if (!event) throw ApiError.notFound('Event not found');

  logger.info(`Event updated: ${event.name} (${event._id})`);
  return event;
}

/**
 * Deletes an event along with every registration, team, and submission
 * tied to it — an event with live registrations is not left half-orphaned.
 */
async function deleteEvent(eventId) {
  const event = await Event.findById(eventId);
  if (!event) throw ApiError.notFound('Event not found');

  const regs = await Registration.find({ eventId }).lean();
  const teamIds = regs.map((r) => r.teamId).filter(Boolean);

  await Submission.deleteMany({ eventId });
  if (teamIds.length) await Team.deleteMany({ _id: { $in: teamIds } });
  await Registration.deleteMany({ eventId });
  await event.deleteOne();

  logger.info(`Event deleted: ${event.name} (${eventId})`);
}

/* ─── User Management (list / create / delete) ────────────────────────────── */

async function getUsers({ search, page = 1, limit = 50 } = {}) {
  const filter = {};
  if (search) {
    const re = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [{ name: re }, { email: re }];
  }

  return User.paginate(filter, {
    page,
    limit,
    select: 'name email role isEmailVerified college createdAt',
    sort: { createdAt: -1 },
    lean: true,
  });
}

async function createUser({ name, email, password, role }) {
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) throw ApiError.conflict('Email is already taken');

  const user = await User.create({
    name,
    email: email.toLowerCase(),
    password,
    role: role || 'user',
    isEmailVerified: true, // admin-created accounts are considered pre-verified
  });

  logger.info(`Admin created user: ${user.email} (${user._id})`);
  return user.toSafeObject();
}

/**
 * Deletes a user along with every record that references them: their
 * conference registration, uploaded files, event registrations (and any
 * team + submissions tied to those), and membership in other teams.
 */
async function deleteUser(adminId, userId) {
  if (String(adminId) === String(userId)) {
    throw ApiError.badRequest('You cannot delete your own account');
  }

  const user = await User.findById(userId);
  if (!user) throw ApiError.notFound('User not found');

  const confReg = await ConferenceRegistration.findOne({ userId });
  if (confReg) {
    if (confReg.paymentScreenshotKey) {
      await cloudinaryService.deleteFile(confReg.paymentScreenshotKey).catch(() => {});
    }
    await confReg.deleteOne();
  }
  if (user.universityIdCardKey) {
    await cloudinaryService.deleteFile(user.universityIdCardKey).catch(() => {});
  }

  const ledRegs = await Registration.find({ userId }).lean();
  const teamIds = ledRegs.map((r) => r.teamId).filter(Boolean);

  await Submission.deleteMany({ userId });
  if (teamIds.length) await Team.deleteMany({ _id: { $in: teamIds } });
  await Registration.deleteMany({ userId });
  await Team.updateMany({ 'members.userId': userId }, { $pull: { members: { userId } } });

  await user.deleteOne();
  logger.info(`Admin ${adminId} deleted user ${userId}`);
}

module.exports = {
  /* Conference Registration */
  getConferenceRegistrations,
  getConferenceRegistrationDetail,
  getIdCardPreview,
  exportConferenceRegistrationsCSV,
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
  /* Event Management */
  createEvent,
  updateEvent,
  deleteEvent,
  /* User Management */
  getUsers,
  createUser,
  deleteUser,
};
