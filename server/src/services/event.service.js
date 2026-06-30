'use strict';
const Event    = require('../models/Event');
const ApiError = require('../utils/ApiError');

async function getAllEvents() {
  return Event.find().sort({ createdAt: 1 }).lean();
}

async function getEventById(eventId) {
  const event = await Event.findById(eventId).lean();
  if (!event) throw ApiError.notFound('Event not found');
  return event;
}

async function getEventBySlug(slug) {
  const event = await Event.findOne({ slug }).lean();
  if (!event) throw ApiError.notFound('Event not found');
  return event;
}

module.exports = { getAllEvents, getEventById, getEventBySlug };
