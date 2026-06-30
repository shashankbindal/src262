'use strict';

/**
 * Wraps an async route handler so that unhandled promise rejections
 * are forwarded to Express's centralized error middleware.
 */
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

module.exports = asyncHandler;
