'use strict';
const ApiError = require('../utils/ApiError');
const logger   = require('../utils/logger');
const { env }  = require('../config/env');

/**
 * Maps a thrown error to its HTTP status + response body. Centralized so the
 * status is computed once and can be used both for the actual response and
 * for classifying the log line's severity (see below) — previously this
 * logic lived only in the response-sending branches, so the log line never
 * knew (or showed) what status the request ultimately resolved to.
 */
function resolveError(err) {
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return { status: 409, body: { success: false, message: `${field} already exists`, errors: [] } };
  }

  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
    return { status: 400, body: { success: false, message: 'Validation failed', errors } };
  }

  if (err.name === 'CastError') {
    return { status: 400, body: { success: false, message: `Invalid ${err.path}: ${err.value}`, errors: [] } };
  }

  if (err.name === 'JsonWebTokenError') {
    return { status: 401, body: { success: false, message: 'Invalid token', errors: [] } };
  }
  if (err.name === 'TokenExpiredError') {
    return { status: 401, body: { success: false, message: 'Token expired', errors: [] } };
  }

  if (err.code === 'LIMIT_FILE_SIZE') {
    return { status: 400, body: { success: false, message: 'File is too large', errors: [] } };
  }

  if (err instanceof ApiError) {
    return { status: err.statusCode, body: { success: false, message: err.message, errors: err.errors } };
  }

  /* Unknown — never expose internals in production */
  return {
    status: 500,
    body: { success: false, message: env.isProd() ? 'An unexpected error occurred' : err.message, errors: [] },
  };
}

/* eslint-disable no-unused-vars */
const errorMiddleware = (err, req, res, _next) => {
  const { status, body } = resolveError(err);

  /* Log every error with request context (method, url, status, user) so a
   * log line is traceable back to the request that produced it — a bare
   * "Authentication required" with no URL/user is nearly useless when
   * diagnosing which of many concurrent users/endpoints is failing.
   * Severity reflects who's at fault: expected client errors (400–499 — bad
   * input, unverified email, rate limits, etc.) log at 'warn' so they don't
   * look like the same emergency as a genuine 5xx server failure, which
   * logs at 'error'. */
  const context = `${req.method} ${req.originalUrl} [${status}]${req.user?._id ? ` user=${req.user._id}` : ''}`;
  const logMessage = `${err.message} — ${context}`;
  if (status >= 500) {
    logger.error(env.isDev() && err.stack ? `${logMessage}\n${err.stack}` : logMessage);
  } else {
    logger.warn(logMessage);
  }

  return res.status(status).json(body);
};

module.exports = errorMiddleware;
