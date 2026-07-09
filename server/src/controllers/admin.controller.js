'use strict';
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse  = require('../utils/ApiResponse');
const adminService = require('../services/admin.service');

/* ─── Overview ───────────────────────────────────────────────────────────── */

const getOverview = asyncHandler(async (_req, res) => {
  const data = await adminService.getFullOverview();
  ApiResponse.ok(res, 'Overview fetched', data);
});

/* ─── Conference Registration ────────────────────────────────────────────── */

const getConferenceRegistrations = asyncHandler(async (req, res) => {
  const { status, page, limit } = req.query;
  const data = await adminService.getConferenceRegistrations({
    status,
    page:  parseInt(page)  || 1,
    limit: parseInt(limit) || 50,
  });
  ApiResponse.ok(res, 'Conference registrations fetched', data);
});

const decideConferenceRegistration = asyncHandler(async (req, res) => {
  const { confRegId } = req.params;
  const { action, srcId, reason } = req.body;

  let result;
  if (action === 'approve') {
    result = await adminService.approveConferenceRegistration(req.user._id, confRegId, { srcId });
    ApiResponse.ok(res, 'Conference registration approved', result);
  } else if (action === 'reject') {
    result = await adminService.rejectConferenceRegistration(req.user._id, confRegId, { reason });
    ApiResponse.ok(res, 'Conference registration rejected', result);
  } else {
    const { ApiError } = require('../utils/ApiError');
    throw ApiError.badRequest('Action must be "approve" or "reject"');
  }
});

const getConfPaymentScreenshot = asyncHandler(async (req, res) => {
  const data = await adminService.getConfPaymentScreenshot(req.params.confRegId);
  ApiResponse.ok(res, 'Screenshot URL generated', data);
});

const getConfIdCard = asyncHandler(async (req, res) => {
  const data = await adminService.getConfIdCard(req.params.confRegId);
  ApiResponse.ok(res, 'ID card URL generated', data);
});

const getConferenceRegistrationDetail = asyncHandler(async (req, res) => {
  const data = await adminService.getConferenceRegistrationDetail(req.params.confRegId);
  ApiResponse.ok(res, 'Conference registration detail fetched', data);
});

const exportConferenceRegistrationsCSV = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const csv = await adminService.exportConferenceRegistrationsCSV(status);
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="conference-registrations.csv"');
  res.send(csv);
});

/* ─── Event Registrations ────────────────────────────────────────────────── */

const getRegistrations = asyncHandler(async (req, res) => {
  const { eventId } = req.params;
  const { status, page, limit } = req.query;
  const data = await adminService.getRegistrationsByEvent(eventId, {
    status,
    page:  parseInt(page)  || 1,
    limit: parseInt(limit) || 50,
  });
  ApiResponse.ok(res, 'Registrations fetched', data);
});

const getSubmissionFile = asyncHandler(async (req, res) => {
  const data = await adminService.getSubmissionFile(req.params.registrationId);
  ApiResponse.ok(res, 'Submission URL generated', data);
});

const getSubmissions = asyncHandler(async (req, res) => {
  const { eventId } = req.params;
  const { status, page, limit } = req.query;
  const data = await adminService.getSubmissionsByEvent(eventId, {
    status,
    page:  parseInt(page)  || 1,
    limit: parseInt(limit) || 50,
  });
  ApiResponse.ok(res, 'Submissions fetched', data);
});

const markSubmissionComplete = asyncHandler(async (req, res) => {
  const { submissionId } = req.params;
  const { reviewNotes }  = req.body;
  const sub = await adminService.markSubmissionComplete(req.user._id, submissionId, { reviewNotes });
  ApiResponse.ok(res, 'Submission marked as completed', sub);
});

/* ─── Exports ────────────────────────────────────────────────────────────── */

const exportCSV = asyncHandler(async (req, res) => {
  const { eventId } = req.params;
  const { status }  = req.query;
  const csv = await adminService.exportRegistrationsCSV(eventId, status);
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="registrations-${eventId}.csv"`);
  res.send(csv);
});

const exportExcel = asyncHandler(async (req, res) => {
  const { eventId } = req.params;
  const { status }  = req.query;
  const wb = await adminService.exportRegistrationsExcel(eventId, status);
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="registrations-${eventId}.xlsx"`);
  await wb.xlsx.write(res);
  res.end();
});

/* ─── Event Management ────────────────────────────────────────────────────── */

const createEvent = asyncHandler(async (req, res) => {
  const event = await adminService.createEvent(req.body);
  ApiResponse.created(res, 'Event created', event);
});

const updateEvent = asyncHandler(async (req, res) => {
  const event = await adminService.updateEvent(req.params.eventId, req.body);
  ApiResponse.ok(res, 'Event updated', event);
});

const deleteEvent = asyncHandler(async (req, res) => {
  await adminService.deleteEvent(req.params.eventId);
  ApiResponse.ok(res, 'Event deleted');
});

/* ─── User Management ────────────────────────────────────────────────────── */

const getUsers = asyncHandler(async (req, res) => {
  const { search, page, limit } = req.query;
  const data = await adminService.getUsers({
    search,
    page:  parseInt(page)  || 1,
    limit: parseInt(limit) || 50,
  });
  ApiResponse.ok(res, 'Users fetched', data);
});

const createUser = asyncHandler(async (req, res) => {
  const user = await adminService.createUser(req.body);
  ApiResponse.created(res, 'User created', user);
});

const deleteUser = asyncHandler(async (req, res) => {
  await adminService.deleteUser(req.user._id, req.params.userId);
  ApiResponse.ok(res, 'User deleted');
});

module.exports = {
  getOverview,
  getConferenceRegistrations,
  getConferenceRegistrationDetail,
  exportConferenceRegistrationsCSV,
  decideConferenceRegistration,
  getConfPaymentScreenshot,
  getConfIdCard,
  getRegistrations,
  getSubmissionFile,
  getSubmissions,
  markSubmissionComplete,
  exportCSV,
  exportExcel,
  createEvent,
  updateEvent,
  deleteEvent,
  getUsers,
  createUser,
  deleteUser,
};
