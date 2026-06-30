'use strict';
const asyncHandler  = require('../utils/asyncHandler');
const ApiResponse   = require('../utils/ApiResponse');
const eventService  = require('../services/event.service');

const getAllEvents = asyncHandler(async (_req, res) => {
  const events = await eventService.getAllEvents();
  ApiResponse.ok(res, 'Events fetched', events);
});

const getEventById = asyncHandler(async (req, res) => {
  const event = await eventService.getEventById(req.params.eventId);
  ApiResponse.ok(res, 'Event fetched', event);
});

const getEventBySlug = asyncHandler(async (req, res) => {
  const event = await eventService.getEventBySlug(req.params.slug);
  ApiResponse.ok(res, 'Event fetched', event);
});

module.exports = { getAllEvents, getEventById, getEventBySlug };
