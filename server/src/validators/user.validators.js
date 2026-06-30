'use strict';
const { body } = require('express-validator');

const updateProfileValidator = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 }).withMessage('Name must be 1–100 characters'),

  body('college')
    .optional()
    .trim()
    .isLength({ max: 150 }).withMessage('College name too long'),

  body('department')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Department name too long'),

  body('phone')
    .optional()
    .trim()
    .matches(/^\+?[0-9\s\-]{7,15}$/).withMessage('Please provide a valid phone number'),
];

module.exports = { updateProfileValidator };
