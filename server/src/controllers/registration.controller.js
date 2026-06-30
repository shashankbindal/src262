'use strict';
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const registrationService = require('../services/registration.service');

const createRegistration = asyncHandler(async (req, res) => {
  const { eventId } = req.params;
  const { teamName, memberEmails } = req.body;

  const registration = await registrationService.createRegistration(
    req.user._id,
    eventId,
    { teamName, memberEmails }
  );

  ApiResponse.created(res, 'Registration created successfully', registration);
});

const updateRegistration = asyncHandler(async (req, res) => {
  const { registrationId } = req.params;
  const { teamName, memberEmails } = req.body;

  const registration = await registrationService.updateRegistration(
    req.user._id,
    registrationId,
    { teamName, memberEmails }
  );

  ApiResponse.ok(res, 'Registration updated successfully', registration);
});

const submitPayment = asyncHandler(async (req, res) => {
  if (!req.file) throw ApiError.badRequest('Payment screenshot is required');

  const { transactionId } = req.body;
  const fileUrl = req.file.location;
  const fileKey = req.file.key;

  const reg = await registrationService.submitPayment(
    req.user._id,
    req.params.registrationId,
    { transactionId, fileUrl, fileKey }
  );

  ApiResponse.ok(res, 'Payment submitted. Awaiting verification.', reg);
});

const getMyRegistrations = asyncHandler(async (req, res) => {
  const registrations = await registrationService.getUserRegistrations(req.user._id);
  ApiResponse.ok(res, 'Registrations fetched', registrations);
});

const getRegistrationById = asyncHandler(async (req, res) => {
  const reg = await registrationService.getRegistrationById(
    req.user._id,
    req.params.registrationId
  );
  ApiResponse.ok(res, 'Registration fetched', reg);
});

module.exports = { createRegistration, updateRegistration, submitPayment, getMyRegistrations, getRegistrationById };
