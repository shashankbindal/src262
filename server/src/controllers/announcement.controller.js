'use strict';
const asyncHandler        = require('../utils/asyncHandler');
const ApiResponse         = require('../utils/ApiResponse');
const announcementService = require('../services/announcement.service');

const getAnnouncements = asyncHandler(async (req, res) => {
  const { page, limit } = req.query;
  const data = await announcementService.getAnnouncements({ page, limit });
  ApiResponse.ok(res, 'Announcements fetched', data);
});

const getLatestAnnouncement = asyncHandler(async (_req, res) => {
  const data = await announcementService.getLatestAnnouncement();
  ApiResponse.ok(res, 'Latest announcement fetched', data);
});

module.exports = { getAnnouncements, getLatestAnnouncement };
