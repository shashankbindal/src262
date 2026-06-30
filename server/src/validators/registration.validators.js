'use strict';
const { body, param } = require('express-validator');

const createRegistrationValidator = [
  param('eventId')
    .isMongoId().withMessage('Invalid event ID'),

  body('teamName')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('Team name cannot exceed 50 characters'),

  body('memberEmails')
    .optional()
    .isArray().withMessage('memberEmails must be an array of strings'),

  body('memberEmails.*')
    .isEmail().withMessage('All member emails must be valid'),
];

const updateRegistrationValidator = [
  body('teamName')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('Team name cannot exceed 50 characters'),

  body('memberEmails')
    .optional()
    .isArray().withMessage('memberEmails must be an array of strings'),

  body('memberEmails.*')
    .isEmail().withMessage('All member emails must be valid'),
];

const submitPaymentValidator = [
  param('registrationId')
    .isMongoId().withMessage('Invalid registration ID'),

  body('transactionId')
    .trim()
    .notEmpty().withMessage('Transaction ID is required')
    .isLength({ max: 100 }).withMessage('Transaction ID too long'),
];

const adminDecisionValidator = [
  param('registrationId')
    .isMongoId().withMessage('Invalid registration ID'),

  body('action')
    .isIn(['approve', 'reject']).withMessage('Action must be "approve" or "reject"'),

  body('reason')
    .if(body('action').equals('reject'))
    .trim()
    .notEmpty().withMessage('Rejection reason is required')
    .isLength({ max: 500 }).withMessage('Reason too long'),
];

module.exports = {
  createRegistrationValidator,
  updateRegistrationValidator,
  submitPaymentValidator,
  adminDecisionValidator,
};
