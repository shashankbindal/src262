'use strict';
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const ContactMessage = require('../models/ContactMessage');
const logger = require('../utils/logger');

const submitContactMessage = asyncHandler(async (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    throw ApiError.badRequest('Name, email, and message are required');
  }

  const contactMessage = await ContactMessage.create({
    name,
    email,
    message,
  });

  logger.info(`New contact message from ${email}`);
  ApiResponse.created(res, 'Message sent successfully', contactMessage);
});

module.exports = {
  submitContactMessage,
};
