'use strict';
const { body, param } = require('express-validator');

const createUserValidator = [
  body('name')
    .trim().notEmpty().withMessage('Name is required')
    .isLength({ max: 100 }).withMessage('Name cannot exceed 100 characters'),

  body('email')
    .trim().isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),

  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
    .matches(/[0-9]/).withMessage('Password must contain at least one number'),

  body('role')
    .optional()
    .isIn(['user', 'admin']).withMessage('Role must be "user" or "admin"'),
];

const createEventValidator = [
  body('name')
    .trim().notEmpty().withMessage('Event name is required')
    .isLength({ max: 150 }).withMessage('Event name too long'),

  body('slug')
    .optional()
    .trim().toLowerCase()
    .matches(/^[a-z0-9-]+$/).withMessage('Slug may only contain lowercase letters, numbers, and hyphens'),

  body('type')
    .isIn(['solo', 'team']).withMessage('Type must be "solo" or "team"'),

  body('registrationDeadline')
    .notEmpty().withMessage('Registration deadline is required')
    .isISO8601().withMessage('Invalid registration deadline'),

  body('submissionDeadline')
    .optional({ values: 'falsy' })
    .isISO8601().withMessage('Invalid submission deadline'),

  body('fileUploadRequired').optional().isBoolean().toBoolean(),
  body('registrationEnabled').optional().isBoolean().toBoolean(),
  body('maxFileSizeMB').optional().isInt({ min: 1, max: 100 }).toInt(),
  body('minTeamSize').optional().isInt({ min: 1 }).toInt(),
  body('maxTeamSize').optional().isInt({ min: 1 }).toInt(),
];

const updateEventValidator = [
  param('eventId').isMongoId().withMessage('Invalid event ID'),

  body('name').optional().trim().isLength({ max: 150 }).withMessage('Event name too long'),
  body('slug').optional().trim().toLowerCase()
    .matches(/^[a-z0-9-]+$/).withMessage('Slug may only contain lowercase letters, numbers, and hyphens'),
  body('type').optional().isIn(['solo', 'team']).withMessage('Type must be "solo" or "team"'),
  body('registrationDeadline').optional().isISO8601().withMessage('Invalid registration deadline'),
  body('submissionDeadline').optional({ values: 'falsy' }).isISO8601().withMessage('Invalid submission deadline'),
  body('fileUploadRequired').optional().isBoolean().toBoolean(),
  body('registrationEnabled').optional().isBoolean().toBoolean(),
  body('maxFileSizeMB').optional().isInt({ min: 1, max: 100 }).toInt(),
  body('minTeamSize').optional().isInt({ min: 1 }).toInt(),
  body('maxTeamSize').optional().isInt({ min: 1 }).toInt(),
];

const deleteEventValidator = [
  param('eventId').isMongoId().withMessage('Invalid event ID'),
];

const deleteUserValidator = [
  param('userId').isMongoId().withMessage('Invalid user ID'),
];

module.exports = {
  createUserValidator,
  deleteUserValidator,
  createEventValidator,
  updateEventValidator,
  deleteEventValidator,
};
