'use strict';
const { body, param } = require('express-validator');

const createRegistrationValidator = [
  param('eventId')
    .isMongoId().withMessage('Invalid event ID'),

  body('teamName')
    .optional()
    .trim()
    .isLength({ max: 80 }).withMessage('Team name cannot exceed 80 characters'),

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
    .isLength({ max: 80 }).withMessage('Team name cannot exceed 80 characters'),

  body('memberEmails')
    .optional()
    .isArray().withMessage('memberEmails must be an array of strings'),

  body('memberEmails.*')
    .isEmail().withMessage('All member emails must be valid'),
];

const YEAR_OPTIONS = [
  'First Year', 'Second Year', 'Third Year', 'Fourth Year', 'Fifth Year',
  'Postgraduate', 'PhD', 'Faculty', 'Professional',
];
const GENDER_OPTIONS = ['Male', 'Female', 'Other', 'Prefer not to say'];

const submitConferenceRegistrationValidator = [
  /* ── Personal ── */
  body('name')
    .trim().notEmpty().withMessage('Full name is required')
    .matches(/^[A-Za-z\s]+$/).withMessage('Name must contain only letters and spaces')
    .isLength({ max: 100 }).withMessage('Name too long'),

  body('phone')
    .trim().notEmpty().withMessage('Contact number is required')
    .matches(/^[0-9]{10}$/).withMessage('Contact number must be exactly 10 digits'),

  body('dateOfBirth')
    .notEmpty().withMessage('Date of birth is required')
    .isISO8601().withMessage('Invalid date format')
    .custom((val) => {
      if (new Date(val) > new Date()) throw new Error('Date of birth cannot be in the future');
      return true;
    }),

  body('gender')
    .notEmpty().withMessage('Gender is required')
    .isIn(GENDER_OPTIONS).withMessage('Invalid gender selection'),

  /* ── Academic ── */
  body('institute')
    .trim().notEmpty().withMessage('Institute name is required')
    .isLength({ max: 150 }).withMessage('Institute name too long'),

  body('course')
    .trim().notEmpty().withMessage('Course / programme name is required')
    .isLength({ max: 150 }).withMessage('Course name too long'),

  body('yearOfStudy')
    .notEmpty().withMessage('Year of study is required')
    .isIn(YEAR_OPTIONS).withMessage('Invalid year of study'),

  /* ── Identity ── */
  body('aadhaarNumber')
    .trim().notEmpty().withMessage('Aadhaar number is required')
    .matches(/^[0-9]{12}$/).withMessage('Aadhaar must be exactly 12 digits'),

  body('aicheId')
    .trim().notEmpty().withMessage('AIChE membership ID is required')
    .isLength({ max: 50 }).withMessage('AIChE ID too long'),

  /* ── Address ── */
  body('city')
    .trim().notEmpty().withMessage('City is required')
    .isLength({ max: 100 }).withMessage('City name too long'),

  body('state')
    .trim().notEmpty().withMessage('State is required')
    .isLength({ max: 100 }).withMessage('State name too long'),

  body('country')
    .trim().notEmpty().withMessage('Country is required')
    .isLength({ max: 100 }).withMessage('Country name too long'),

  /* ── Payment ── */
  body('transactionId')
    .trim().notEmpty().withMessage('Transaction ID (UTR) is required')
    .isLength({ min: 6, max: 100 }).withMessage('Transaction ID must be 6–100 characters')
    .matches(/^[A-Za-z0-9\-_\/]+$/).withMessage('Transaction ID must be alphanumeric'),
];

const adminConfRegDecisionValidator = [
  param('confRegId')
    .isMongoId().withMessage('Invalid conference registration ID'),

  body('action')
    .isIn(['approve', 'reject']).withMessage('Action must be "approve" or "reject"'),

  body('srcId')
    .if(body('action').equals('approve'))
    .trim()
    .notEmpty().withMessage('SRC ID is required for approval')
    .isLength({ max: 50 }).withMessage('SRC ID too long'),

  body('reason')
    .if(body('action').equals('reject'))
    .trim()
    .notEmpty().withMessage('Rejection reason is required')
    .isLength({ max: 500 }).withMessage('Reason too long'),
];

module.exports = {
  createRegistrationValidator,
  updateRegistrationValidator,
  submitConferenceRegistrationValidator,
  adminConfRegDecisionValidator,
};
