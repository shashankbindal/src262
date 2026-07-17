'use strict';
const { body, param } = require('express-validator');

const createRegistrationValidator = [
  param('eventId')
    .isMongoId().withMessage('Invalid event ID'),

  body('teamName')
    .optional()
    .trim()
    .isLength({ max: 80 }).withMessage('Team name cannot exceed 80 characters'),

  body('memberSrcIds')
    .optional()
    .isArray().withMessage('memberSrcIds must be an array of strings'),

  body('memberSrcIds.*')
    .trim()
    .notEmpty().withMessage('All member SRC IDs are required')
    .isLength({ max: 50 }).withMessage('SRC ID too long')
    .customSanitizer((val) => val.toUpperCase()),
];

const updateRegistrationValidator = [
  body('teamName')
    .optional()
    .trim()
    .isLength({ max: 80 }).withMessage('Team name cannot exceed 80 characters'),

  body('memberSrcIds')
    .optional()
    .isArray().withMessage('memberSrcIds must be an array of strings'),

  body('memberSrcIds.*')
    .trim()
    .notEmpty().withMessage('All member SRC IDs are required')
    .isLength({ max: 50 }).withMessage('SRC ID too long')
    .customSanitizer((val) => val.toUpperCase()),
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

  body('phoneCountryCode')
    .trim().notEmpty().withMessage('Country code is required')
    .matches(/^\+[0-9]{1,4}$/).withMessage('Invalid country code'),

  body('phone')
    .trim().notEmpty().withMessage('Contact number is required')
    .custom((val, { req }) => {
      const isIndia = req.body.phoneCountryCode === '+91';
      const re = isIndia ? /^[0-9]{10}$/ : /^[0-9]{6,15}$/;
      if (!re.test(val.trim())) {
        throw new Error(isIndia ? 'Contact number must be exactly 10 digits' : 'Contact number must be 6–15 digits');
      }
      return true;
    }),

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

  body('studentChapterName')
    .trim().notEmpty().withMessage('Student chapter name is required')
    .isLength({ max: 150 }).withMessage('Student chapter name too long'),

  body('facultyAdvisorName')
    .trim().notEmpty().withMessage('Faculty advisor name is required')
    .isLength({ max: 100 }).withMessage('Faculty advisor name too long'),

  body('facultyAdvisorEmail')
    .trim().notEmpty().withMessage('Faculty advisor email is required')
    .isEmail().withMessage('Please provide a valid faculty advisor email'),

  /* ── Identity ── */
  body('idType')
    .trim().notEmpty().withMessage('Identity document type is required')
    .isIn(['aadhaar', 'passport']).withMessage('Invalid identity document type'),

  body('idNumber')
    .trim().notEmpty().withMessage('Identity document number is required')
    .custom((val, { req }) => {
      if (req.body.idType === 'passport') {
        if (!/^[A-Za-z0-9]{6,15}$/.test(val.trim())) {
          throw new Error('Passport number must be 6–15 letters/digits');
        }
      } else if (!/^[0-9]{12}$/.test(val.replace(/\s/g, ''))) {
        throw new Error('Aadhaar must be exactly 12 digits');
      }
      return true;
    }),

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

  body('registrationTier')
    .trim().notEmpty().withMessage('Registration tier is required')
    .isIn(['base', 'fooding', 'accommodation']).withMessage('Please select a valid registration tier'),

  body('merchSize')
    .trim().notEmpty().withMessage('Merch size is required')
    .isIn(['S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'XXXXL']).withMessage('Please select a valid merch size'),
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
