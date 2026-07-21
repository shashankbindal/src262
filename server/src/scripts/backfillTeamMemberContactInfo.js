'use strict';
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const connectDB              = require('../config/db');
const Team                   = require('../models/Team');
const User                   = require('../models/User');
const ConferenceRegistration = require('../models/ConferenceRegistration');
const logger                 = require('../utils/logger');

/**
 * One-off backfill: `phone` and `srcId` were added to Team.members after
 * many teams were already created, so those existing member subdocuments
 * are missing the fields (they only get populated going forward, at
 * create/update time). This fills in whatever is still blank from the
 * member's current User + ConferenceRegistration records, without
 * touching fields that already have a value.
 */
(async () => {
  try {
    await connectDB();

    const teams = await Team.find({});
    let teamsUpdated = 0;
    let membersUpdated = 0;

    for (const team of teams) {
      let teamChanged = false;

      for (const member of team.members) {
        if (member.phone && member.srcId) continue;

        const [user, confReg] = await Promise.all([
          member.phone ? null : User.findById(member.userId).select('phone').lean(),
          member.srcId ? null : ConferenceRegistration.findOne({ userId: member.userId }).select('srcId').lean(),
        ]);

        let memberChanged = false;
        if (user?.phone && !member.phone) {
          member.phone = user.phone;
          memberChanged = true;
        }
        if (confReg?.srcId && !member.srcId) {
          member.srcId = confReg.srcId;
          memberChanged = true;
        }
        if (memberChanged) {
          membersUpdated++;
          teamChanged = true;
        }
      }

      if (teamChanged) {
        await team.save();
        teamsUpdated++;
      }
    }

    logger.info(`Backfill complete: ${membersUpdated} member(s) updated across ${teamsUpdated} team(s)`);
    process.exit(0);
  } catch (err) {
    logger.error(`Backfill failed: ${err.message}`);
    process.exit(1);
  }
})();
