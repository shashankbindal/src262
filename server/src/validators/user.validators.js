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

  body('phoneCountryCode')
    .optional()
    .trim()
    .matches(/^\+[0-9]{1,4}$/).withMessage('Please provide a valid country code'),

  body('phone')
    .optional()
    .trim()
    .matches(/^\+?[0-9\s\-]{7,15}$/).withMessage('Please provide a valid phone number'),

  body('studentChapterName')
    .optional()
    .trim()
    .isLength({ max: 150 }).withMessage('Student chapter name too long'),

  body('facultyAdvisorName')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Faculty advisor name too long'),

  body('facultyAdvisorEmail')
    .optional()
    .trim()
    .isEmail().withMessage('Please provide a valid faculty advisor email'),

  body('merchSize')
    .optional({ values: 'falsy' })
    .isIn(['S', 'M', 'L', 'XL', 'XXL']).withMessage('Please select a valid merch size'),
];

module.exports = { updateProfileValidator };
