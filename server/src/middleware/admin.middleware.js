'use strict';
const ApiError = require('../utils/ApiError');

/**
 * Must be placed AFTER authenticate().
 * Rejects anyone who isn't an admin.
 */
const requireAdmin = (req, _res, next) => {
  if (req.user?.role !== 'admin') {
    return next(ApiError.forbidden('Admin access required'));
  }
  next();
};

module.exports = { requireAdmin };
