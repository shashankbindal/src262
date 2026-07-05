'use strict';
const mongoose               = require('mongoose');
const Registration           = require('../models/Registration');
const ConferenceRegistration = require('../models/ConferenceRegistration');
const Event                  = require('../models/Event');
const Team                   = require('../models/Team');
const User                   = require('../models/User');
const ApiError               = require('../utils/ApiError');
const logger                 = require('../utils/logger');

/**
 * Verifies that a user has an approved conference registration with a valid SRC ID.
 * Throws if not eligible.
 */
async function assertConferenceApproved(userId) {
  const confReg = await ConferenceRegistration.findOne({ userId }).lean();

  if (!confReg) {
    throw ApiError.forbidden(
      'You must complete Conference Registration before registering for events'
    );
  }
  if (confReg.status !== 'approved') {
    throw ApiError.forbidden(
      'Your Conference Registration must be approved before you can register for events'
    );
  }
  if (!confReg.srcId) {
    throw ApiError.forbidden(
      'No SRC ID has been assigned to your account yet. Please wait for admin approval.'
    );
  }

  return confReg;
}

/**
 * Creates a registration for a solo or team event.
 * Requires an approved conference registration for the leader and all members.
 */
async function createRegistration(userId, eventId, { teamName, memberEmails = [] } = {}) {
  const event = await Event.findById(eventId);
  if (!event)                 throw ApiError.notFound('Event not found');
  if (!event.registrationEnabled) throw ApiError.badRequest('Registrations are closed for this event');
  if (new Date() > event.registrationDeadline) throw ApiError.badRequest('Registration deadline has passed');

  /* Prevent duplicate registration */
  const existing = await Registration.findOne({ userId, eventId });
  if (existing) throw ApiError.conflict('You have already registered for this event');

  const user = await User.findById(userId).lean();
  if (!user) throw ApiError.notFound('User not found');


  /* Verify leader's conference registration */
  const leaderConfReg = await assertConferenceApproved(userId);

  /* ── Team event validation ────────────────────────────────────────────── */
  let teamDoc = null;

  if (event.type === 'team') {
    if (event.minTeamSize && memberEmails.length + 1 < event.minTeamSize) {
      throw ApiError.badRequest(`Team must have at least ${event.minTeamSize} members`);
    }
    if (event.maxTeamSize && memberEmails.length + 1 > event.maxTeamSize) {
      throw ApiError.badRequest(`Team cannot exceed ${event.maxTeamSize} members`);
    }

    const members = [];
    for (const email of memberEmails) {
      if (email.toLowerCase() === user.email.toLowerCase()) {
        throw ApiError.badRequest('You cannot add yourself as a team member');
      }

      const member = await User.findOne({ email: email.toLowerCase() }).lean();
      if (!member) {
        throw ApiError.badRequest(`No account found for ${email}. All members must be registered.`);
      }

      /* Validate member's conference registration */
      const memberConfReg = await ConferenceRegistration.findOne({ userId: member._id }).lean();
      if (!memberConfReg || memberConfReg.status !== 'approved' || !memberConfReg.srcId) {
        throw ApiError.badRequest(
          `${email} does not have an approved Conference Registration. All team members must be approved.`
        );
      }

      /* Ensure member isn't already registered for this event */
      const memberReg = await Registration.findOne({ userId: member._id, eventId });
      if (memberReg) throw ApiError.conflict(`${email} is already registered for this event`);

      /* Ensure member isn't already in another team for this event */
      const inAnotherTeam = await Team.findOne({ eventId, 'members.userId': member._id });
      if (inAnotherTeam) throw ApiError.conflict(`${email} is already in a team for this event`);

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

  const initialStatus = event.fileUploadRequired ? 'waiting_submission' : 'registered';

  const registration = await Registration.create({
    userId,
    eventId,
    teamId: teamDoc?._id,
    status: initialStatus,
    srcId:  leaderConfReg.srcId,
    participantSnapshot: {
      name:    user.name,
      email:   user.email,
      college: user.college || '',
      phone:   user.phone   || '',
    },
  });

  logger.info(`Event registration created: user=${userId} event=${eventId}`);
  return registration;
}

/**
 * Updates a team registration (team name / members) before event starts.
 * Validates conference registration for all new members.
 */
async function updateRegistration(userId, registrationId, { teamName, memberEmails = [] }) {
  const teams   = await Team.find({ 'members.userId': userId }).select('_id').lean();
  const teamIds = teams.map(t => t._id);

  const reg = await Registration.findOne({
    _id: registrationId,
    $or: [{ userId }, { teamId: { $in: teamIds } }],
  }).populate('eventId').populate('teamId');

  if (!reg) throw ApiError.notFound('Registration not found');

  if (!['registered', 'waiting_submission'].includes(reg.status)) {
    throw ApiError.badRequest('Cannot edit registration after submission has started');
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


    /* Validate member's conference registration */
    const memberConfReg = await ConferenceRegistration.findOne({ userId: member._id }).lean();
    if (!memberConfReg || memberConfReg.status !== 'approved' || !memberConfReg.srcId) {
      throw ApiError.badRequest(
        `${email} does not have an approved Conference Registration`
      );
    }

    const memberReg = await Registration.findOne({ userId: member._id, eventId: event._id });
    if (memberReg && memberReg._id.toString() !== reg._id.toString()) {
      throw ApiError.conflict(`${email} is already registered for this event`);
    }

    const inAnotherTeam = await Team.findOne({
      eventId: event._id,
      'members.userId': member._id,
      _id: { $ne: reg.teamId._id },
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
 * Returns all registrations for a user, including events they joined as a team member.
 */
async function getUserRegistrations(userId) {
  const teams   = await Team.find({ 'members.userId': userId }).select('_id').lean();
  const teamIds = teams.map(t => t._id);

  const regs = await Registration.find({
    $or: [{ userId }, { teamId: { $in: teamIds } }],
  })
    .populate('eventId', 'name slug type fileUploadRequired')
    .populate('teamId', 'teamName members')
    .sort({ createdAt: -1 })
    .lean();

  return regs;
}

/**
 * Returns a single registration owned by (or including) the user.
 */
async function getRegistrationById(userId, registrationId) {
  const teams   = await Team.find({ 'members.userId': userId }).select('_id').lean();
  const teamIds = teams.map(t => t._id);

  const reg = await Registration.findOne({
    _id: registrationId,
    $or: [{ userId }, { teamId: { $in: teamIds } }],
  })
    .populate('eventId', 'name slug type registrationDeadline submissionDeadline fileUploadRequired')
    .populate('teamId', 'teamName members')
    .lean();

  if (!reg) throw ApiError.notFound('Registration not found');
  return reg;
}

module.exports = {
  createRegistration,
  updateRegistration,
  getUserRegistrations,
  getRegistrationById,
};
