'use strict';
const { validationResult } = require('express-validator');
const ApiError             = require('../utils/ApiError');

/**
 * Runs after express-validator chains.
 * Collects all validation errors and sends a 400 with the error list.
 */
const validate = (req, _res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();

  const formatted = errors.array().map((e) => ({
    field:   e.path,
    message: e.msg,
  }));

  return next(ApiError.badRequest('Validation failed', formatted));
};

module.exports = validate;
