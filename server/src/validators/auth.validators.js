'use strict';
const { body } = require('express-validator');

const registerValidator = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ max: 100 }).withMessage('Name cannot exceed 100 characters'),

  body('email')
    .trim()
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),

  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
    .matches(/[0-9]/).withMessage('Password must contain at least one number'),
];

const loginValidator = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required'),

  body('password')
    .notEmpty().withMessage('Password is required'),
];

const forgotPasswordValidator = [
  body('email')
    .trim()
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),
];

const resetPasswordValidator = [
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
    .matches(/[0-9]/).withMessage('Password must contain at least one number'),
];

module.exports = {
  registerValidator,
  loginValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
};
