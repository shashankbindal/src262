'use strict';
const { env } = require('../config/env');

/**
 * Admin access is gated purely by email whitelist (env.ADMIN_EMAILS), not
 * the `role` field on the User model — this lets the two designated
 * accounts get admin access as soon as they sign up, with no manual DB edit.
 */
function isAdminEmail(email) {
  return Boolean(email) && env.ADMIN_EMAILS.includes(email.toLowerCase());
}

module.exports = { isAdminEmail };
