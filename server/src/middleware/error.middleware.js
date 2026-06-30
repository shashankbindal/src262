'use strict';
const ApiError = require('../utils/ApiError');
const logger   = require('../utils/logger');
const { env }  = require('../config/env');

/* eslint-disable no-unused-vars */
const errorMiddleware = (err, req, res, _next) => {
  /* Log every error with context */
  logger.error({
    message:  err.message,
    stack:    env.isDev() ? err.stack : undefined,
    method:   req.method,
    url:      req.originalUrl,
    userId:   req.user?._id,
  });

  /* Mongoose duplicate key */
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return res.status(409).json({
      success: false,
      message: `${field} already exists`,
      errors:  [],
    });
  }

  /* Mongoose validation error */
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((e) => ({
      field:   e.path,
      message: e.message,
    }));
    return res.status(400).json({ success: false, message: 'Validation failed', errors });
  }

  /* Mongoose cast error (bad ObjectId) */
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: `Invalid ${err.path}: ${err.value}`,
      errors:  [],
    });
  }

  /* JWT errors */
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ success: false, message: 'Invalid token', errors: [] });
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ success: false, message: 'Token expired', errors: [] });
  }

  /* multer file size */
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ success: false, message: 'File is too large', errors: [] });
  }

  /* Known ApiError */
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors:  err.errors,
    });
  }

  /* Unknown — never expose internals in production */
  return res.status(500).json({
    success: false,
    message: env.isProd() ? 'An unexpected error occurred' : err.message,
    errors:  [],
  });
};

module.exports = errorMiddleware;
