'use strict';
const Announcement = require('../models/Announcement');

async function getAnnouncements({ page = 1, limit = 20 } = {}) {
  const safeLimit = Math.min(parseInt(limit, 10) || 20, 50);
  const safePage  = Math.max(parseInt(page, 10) || 1, 1);

  return Announcement.paginate(
    {},
    {
      sort:  { createdAt: -1 },
      page:  safePage,
      limit: safeLimit,
      lean:  true,
    }
  );
}

/**
 * Returns the single most-recently-created announcement, regardless of
 * pin status — pinning an old announcement must never re-trigger the
 * "new update" navbar badge, only genuinely new content should.
 */
async function getLatestAnnouncement() {
  return Announcement.findOne({}, '_id title content url urlLabel createdAt')
    .sort({ createdAt: -1 })
    .lean();
}

module.exports = { getAnnouncements, getLatestAnnouncement };
