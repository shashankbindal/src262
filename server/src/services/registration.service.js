'use strict';
const mongoose               = require('mongoose');
const Registration           = require('../models/Registration');
const ConferenceRegistration = require('../models/ConferenceRegistration');
const Event                  = require('../models/Event');
const Team                   = require('../models/Team');
const User                   = require('../models/User');
const ApiError               = require('../utils/ApiError');
const emailService           = require('./email.service');
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
async function createRegistration(userId, eventId, { teamName, memberSrcIds = [] } = {}) {
  const event = await Event.findById(eventId);
  if (!event)                 throw ApiError.notFound('Event not found');
  if (!event.registrationEnabled) throw ApiError.badRequest('Registrations are closed for this event');
  if (new Date() > event.registrationDeadline) throw ApiError.badRequest('Registration deadline has passed');

  /* Prevent duplicate registration */
  const existing = await Registration.findOne({ userId, eventId });
  if (existing) throw ApiError.conflict('You have already registered for this event');

  /* A user already added as a member of someone else's team for this event
   * (who therefore has no Registration row of their own yet) must not also
   * be able to register solo or lead a separate team for the same event. */
  const existingTeamMembership = await Team.findOne({ eventId, 'members.userId': userId });
  if (existingTeamMembership) {
    throw ApiError.conflict('You are already part of another team for this event');
  }

  const user = await User.findById(userId).lean();
  if (!user) throw ApiError.notFound('User not found');


  /* Verify leader's conference registration */
  const leaderConfReg = await assertConferenceApproved(userId);

  /* ── Team event validation ────────────────────────────────────────────── */
  let teamDoc = null;

  if (event.type === 'team') {
    if (!teamName || !teamName.trim()) {
      throw ApiError.badRequest('Team name is required');
    }
    if (event.minTeamSize && memberSrcIds.length + 1 < event.minTeamSize) {
      throw ApiError.badRequest(`Team must have at least ${event.minTeamSize} members`);
    }
    if (event.maxTeamSize && memberSrcIds.length + 1 > event.maxTeamSize) {
      throw ApiError.badRequest(`Team cannot exceed ${event.maxTeamSize} members`);
    }

    /* Validated concurrently — each member's checks are independent, so
     * running them in parallel turns N*4 sequential round-trips into ~2. */
    const members = await Promise.all(memberSrcIds.map(async (rawSrcId) => {
      const srcId = rawSrcId.trim().toUpperCase();
      if (srcId === leaderConfReg.srcId) {
        throw ApiError.badRequest('You cannot add yourself as a team member');
      }

      const memberConfReg = await ConferenceRegistration.findOne({ srcId }).lean();
      if (!memberConfReg || memberConfReg.status !== 'approved') {
        throw ApiError.badRequest(
          `SRC ID ${srcId} does not have an approved Conference Registration. All team members must be approved.`
        );
      }

      const [member, memberReg, inAnotherTeam] = await Promise.all([
        User.findById(memberConfReg.userId).lean(),
        Registration.findOne({ userId: memberConfReg.userId, eventId }),
        Team.findOne({ eventId, 'members.userId': memberConfReg.userId }),
      ]);

      if (memberReg) throw ApiError.conflict(`SRC ID ${srcId} is already registered for this event`);
      if (inAnotherTeam) throw ApiError.conflict(`SRC ID ${srcId} is already in a team for this event`);

      return {
        userId:  member._id,
        name:    member.name,
        email:   member.email,
        srcId,
        college: member.college || '',
        phone:   member.phone   || '',
      };
    }));

    teamDoc = await Team.create({
      eventId,
      leaderId: userId,
      teamName: teamName.trim(),
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

  // If no file submission is required, registration is immediately complete. Send emails.
  if (!event.fileUploadRequired) {
    const eventName = event.name || 'Event';
    const whatsappGroupLink = event.whatsappGroupLink || '';
    const teamName = teamDoc?.teamName || '';

    // Collect recipient list
    const recipients = [];

    // 1. Add the main registrant (leader/solo)
    if (user.email) {
      recipients.push({
        name: user.name,
        email: user.email,
      });
    }

    // 2. Add other team members if applicable
    if (teamDoc && Array.isArray(teamDoc.members)) {
      for (const member of teamDoc.members) {
        if (member.email) {
          recipients.push({
            name: member.name,
            email: member.email,
          });
        }
      }
    }

    // 3. Send emails concurrently
    Promise.all(
      recipients.map((recipient) =>
        emailService.sendEventRegistrationComplete({
          name: recipient.name,
          email: recipient.email,
          eventName,
          teamName,
          whatsappGroupLink,
          hasSubmission: false,
        }).catch((err) => {
          logger.error(`Error triggering instant completion email to ${recipient.email}: ${err.message}`);
        })
      )
    ).catch((err) => {
      logger.error(`Uncaught promise error in instant completion email loop: ${err.message}`);
    });
  }

  return registration;
}

/**
 * Updates a team registration (team name / members) before event starts.
 * Validates conference registration for all new members.
 */
async function updateRegistration(userId, registrationId, { teamName, memberSrcIds = [] }) {
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

  if (!teamName || !teamName.trim()) {
    throw ApiError.badRequest('Team name is required');
  }

  const leaderConfReg = await ConferenceRegistration.findOne({ userId: reg.userId }).lean();

  if (event.minTeamSize && memberSrcIds.length + 1 < event.minTeamSize) {
    throw ApiError.badRequest(`Team must have at least ${event.minTeamSize} members`);
  }
  if (event.maxTeamSize && memberSrcIds.length + 1 > event.maxTeamSize) {
    throw ApiError.badRequest(`Team cannot exceed ${event.maxTeamSize} members`);
  }

  /* Validated concurrently — see createRegistration for why. */
  const members = await Promise.all(memberSrcIds.map(async (rawSrcId) => {
    const srcId = rawSrcId.trim().toUpperCase();
    if (srcId === leaderConfReg?.srcId) {
      throw ApiError.badRequest('The leader cannot be added to the members list');
    }

    const memberConfReg = await ConferenceRegistration.findOne({ srcId }).lean();
    if (!memberConfReg || memberConfReg.status !== 'approved') {
      throw ApiError.badRequest(`SRC ID ${srcId} does not have an approved Conference Registration`);
    }

    const [member, memberReg, inAnotherTeam] = await Promise.all([
      User.findById(memberConfReg.userId).lean(),
      Registration.findOne({ userId: memberConfReg.userId, eventId: event._id }),
      Team.findOne({
        eventId: event._id,
        'members.userId': memberConfReg.userId,
        _id: { $ne: reg.teamId._id },
      }),
    ]);

    if (memberReg && memberReg._id.toString() !== reg._id.toString()) {
      throw ApiError.conflict(`SRC ID ${srcId} is already registered for this event`);
    }
    if (inAnotherTeam) {
      throw ApiError.conflict(`SRC ID ${srcId} is already in another team for this event`);
    }

    return {
      userId:  member._id,
      name:    member.name,
      email:   member.email,
      srcId,
      college: member.college || '',
      phone:   member.phone   || '',
    };
  }));

  const teamDoc = await Team.findById(reg.teamId._id);
  teamDoc.teamName = teamName.trim();
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
