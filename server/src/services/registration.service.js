'use strict';
const mongoose     = require('mongoose');
const Registration = require('../models/Registration');
const Event        = require('../models/Event');
const Team         = require('../models/Team');
const User         = require('../models/User');
const Submission   = require('../models/Submission');
const ApiError     = require('../utils/ApiError');
const emailService = require('./email.service');
const storageService = require('./storage.service');
const { env }      = require('../config/env');
const logger       = require('../utils/logger');

const DASHBOARD_URL = `${env.CLIENT_URL}/dashboard`;

/**
 * Creates a registration for a solo or team event.
 */
async function createRegistration(userId, eventId, { teamName, memberEmails = [] } = {}) {
  const event = await Event.findById(eventId);
  if (!event)                throw ApiError.notFound('Event not found');
  if (!event.registrationEnabled) throw ApiError.badRequest('Registrations are closed for this event');
  if (new Date() > event.registrationDeadline) throw ApiError.badRequest('Registration deadline has passed');

  /* Prevent duplicate solo registration */
  const existing = await Registration.findOne({ userId, eventId });
  if (existing) throw ApiError.conflict('You have already registered for this event');

  const user = await User.findById(userId).lean();
  if (!user) throw ApiError.notFound('User not found');

  /* ── Team event validation ──────────────────────────────────────────────── */
  let teamDoc = null;

  if (event.type === 'team') {
    if (event.minTeamSize && memberEmails.length + 1 < event.minTeamSize) {
      throw ApiError.badRequest(`Team must have at least ${event.minTeamSize} members`);
    }
    if (event.maxTeamSize && memberEmails.length + 1 > event.maxTeamSize) {
      throw ApiError.badRequest(`Team cannot exceed ${event.maxTeamSize} members`);
    }

    /* Resolve and validate member accounts */
    const members = [];
    for (const email of memberEmails) {
      if (email.toLowerCase() === user.email.toLowerCase()) {
        throw ApiError.badRequest('You cannot add yourself as a team member');
      }

      const member = await User.findOne({ email: email.toLowerCase() }).lean();
      if (!member) throw ApiError.badRequest(`No account found for ${email}. All members must be registered.`);

      /* Ensure member isn't already in another team for this event */
      const memberReg = await Registration.findOne({ userId: member._id, eventId });
      if (memberReg) throw ApiError.conflict(`${email} is already registered for this event`);

      /* Check they aren't a member of any other team for this event */
      const inAnotherTeam = await Team.findOne({
        eventId,
        'members.userId': member._id,
      });
      if (inAnotherTeam) {
        throw ApiError.conflict(`${email} is already in a team for this event`);
      }

      members.push({
        userId:  member._id,
        name:    member.name,
        email:   member.email,
        college: member.college || '',
      });
    }

    teamDoc = await Team.create({
      eventId,
      leaderId: userId,
      teamName: teamName || `${user.name}'s Team`,
      members,
    });
  }

  const registration = await Registration.create({
    userId,
    eventId,
    teamId: teamDoc?._id,
    participantSnapshot: {
      name:    user.name,
      email:   user.email,
      college: user.college || '',
      phone:   user.phone   || '',
    },
  });

  logger.info(`Registration created: user=${userId} event=${eventId}`);
  return registration;
}

/**
 * Updates a team registration before payment is submitted.
 */
async function updateRegistration(userId, registrationId, { teamName, memberEmails = [] }) {
  const teams = await Team.find({ 'members.userId': userId }).select('_id').lean();
  const teamIds = teams.map(t => t._id);

  const reg = await Registration.findOne({
    _id: registrationId,
    $or: [{ userId }, { teamId: { $in: teamIds } }]
  }).populate('eventId').populate('teamId');

  if (!reg) throw ApiError.notFound('Registration not found');

  if (!['pending_payment', 'payment_rejected'].includes(reg.status)) {
    throw ApiError.badRequest('Cannot edit registration after payment is submitted');
  }

  const event = reg.eventId;
  if (event.type !== 'team') {
    throw ApiError.badRequest('Only team registrations can be edited');
  }

  const leaderUser = await User.findById(reg.userId).lean();

  if (event.minTeamSize && memberEmails.length + 1 < event.minTeamSize) {
    throw ApiError.badRequest(`Team must have at least ${event.minTeamSize} members`);
  }
  if (event.maxTeamSize && memberEmails.length + 1 > event.maxTeamSize) {
    throw ApiError.badRequest(`Team cannot exceed ${event.maxTeamSize} members`);
  }

  const members = [];
  for (const email of memberEmails) {
    if (email.toLowerCase() === leaderUser.email.toLowerCase()) {
      throw ApiError.badRequest('The leader cannot be added to the members list');
    }

    const member = await User.findOne({ email: email.toLowerCase() }).lean();
    if (!member) throw ApiError.badRequest(`No account found for ${email}.`);

    const memberReg = await Registration.findOne({ userId: member._id, eventId: event._id });
    if (memberReg && memberReg._id.toString() !== reg._id.toString()) {
      throw ApiError.conflict(`${email} is already registered for this event`);
    }

    const inAnotherTeam = await Team.findOne({
      eventId: event._id,
      'members.userId': member._id,
      _id: { $ne: reg.teamId._id }
    });
    if (inAnotherTeam) {
      throw ApiError.conflict(`${email} is already in another team for this event`);
    }

    members.push({
      userId:  member._id,
      name:    member.name,
      email:   member.email,
      college: member.college || '',
    });
  }

  const teamDoc = await Team.findById(reg.teamId._id);
  if (teamName) teamDoc.teamName = teamName;
  teamDoc.members = members;
  await teamDoc.save();

  logger.info(`Registration updated: user=${userId} reg=${registrationId}`);
  return reg;
}

/**
 * Submits payment proof for a registration.
 * The file has already been uploaded to Spaces by multer-s3.
 */
async function submitPayment(userId, registrationId, { transactionId, fileUrl, fileKey }) {
  const teams = await Team.find({ 'members.userId': userId }).select('_id').lean();
  const teamIds = teams.map(t => t._id);

  const reg = await Registration.findOne({
    _id: registrationId,
    $or: [{ userId }, { teamId: { $in: teamIds } }]
  });
  if (!reg) throw ApiError.notFound('Registration not found');

  if (reg.isLocked) throw ApiError.badRequest('Registration is locked and cannot be modified');

  if (!['pending_payment', 'payment_rejected'].includes(reg.status)) {
    throw ApiError.badRequest('Payment has already been submitted or approved');
  }

  /* Delete previous screenshot if re-submitting after rejection */
  if (reg.paymentScreenshotKey) {
    await storageService.deleteFile(reg.paymentScreenshotKey).catch(() => {});
  }

  reg.paymentScreenshotUrl = fileUrl;
  reg.paymentScreenshotKey = fileKey;
  reg.transactionId        = transactionId;
  reg.status               = 'payment_submitted';
  reg.paymentRejectedReason = '';
  await reg.save();

  logger.info(`Payment submitted: registration=${registrationId}`);
  return reg;
}

/**
 * Returns all registrations for a user, populated with event info.
 */
async function getUserRegistrations(userId) {
  const teams = await Team.find({ 'members.userId': userId }).select('_id').lean();
  const teamIds = teams.map(t => t._id);

  const regs = await Registration.find({
    $or: [{ userId }, { teamId: { $in: teamIds } }]
  })
    .populate('eventId', 'name slug type fee fileUploadRequired')
    .populate('teamId', 'teamName members')
    .sort({ createdAt: -1 })
    .lean();

  return regs;
}

/**
 * Returns a single registration owned by the user.
 */
async function getRegistrationById(userId, registrationId) {
  const teams = await Team.find({ 'members.userId': userId }).select('_id').lean();
  const teamIds = teams.map(t => t._id);

  const reg = await Registration.findOne({
    _id: registrationId,
    $or: [{ userId }, { teamId: { $in: teamIds } }]
  })
    .populate('eventId', 'name slug type fee registrationDeadline submissionDeadline fileUploadRequired')
    .populate('teamId', 'teamName members')
    .lean();

  if (!reg) throw ApiError.notFound('Registration not found');

  /* Generate a fresh signed URL for the payment screenshot if stored privately */
  if (reg.paymentScreenshotKey) {
    reg.paymentScreenshotSignedUrl = await storageService.getSignedDownloadUrl(reg.paymentScreenshotKey);
  }

  return reg;
}

module.exports = {
  createRegistration,
  updateRegistration,
  submitPayment,
  getUserRegistrations,
  getRegistrationById,
};
