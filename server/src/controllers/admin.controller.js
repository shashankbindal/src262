'use strict';
const asyncHandler  = require('../utils/asyncHandler');
const ApiResponse   = require('../utils/ApiResponse');
const ApiError      = require('../utils/ApiError');
const adminService  = require('../services/admin.service');

const getOverview = asyncHandler(async (_req, res) => {
  const data = await adminService.getEventOverview();
  ApiResponse.ok(res, 'Overview fetched', data);
});

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

const decidePayment = asyncHandler(async (req, res) => {
  const { registrationId } = req.params;
  const { action, reason } = req.body;
  const reg = await adminService.decidePayment(req.user._id, registrationId, { action, reason });
  ApiResponse.ok(res, `Payment ${action}d successfully`, reg);
});

const getPaymentScreenshot = asyncHandler(async (req, res) => {
  const data = await adminService.getPaymentScreenshot(req.params.registrationId);
  ApiResponse.ok(res, 'Screenshot URL generated', data);
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

module.exports = {
  getOverview,
  getRegistrations,
  decidePayment,
  getPaymentScreenshot,
  getSubmissionFile,
  getSubmissions,
  markSubmissionComplete,
  exportCSV,
  exportExcel,
};
