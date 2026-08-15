'use strict';
const { verifyAccessToken } = require('../utils/generateToken');
const ApiError              = require('../utils/ApiError');
const asyncHandler          = require('../utils/asyncHandler');
const User                  = require('../models/User');
const { isAdminEmail }      = require('../utils/adminAccess');

/**
 * Authenticates the request by reading the access token from the HTTP-only
 * cookie (preferred) or the Authorization Bearer header (API clients).
 */
const authenticate = asyncHandler(async (req, _res, next) => {
  let token = req.cookies?.accessToken;

  if (!token) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.slice(7);
    }
  }

  if (!token) throw ApiError.unauthorized('Authentication required');

  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch {
    throw ApiError.unauthorized('Invalid or expired token — please log in again');
  }

  const user = await User.findById(payload.sub).lean();
  if (!user) throw ApiError.unauthorized('Account no longer exists');

  user.isAdmin = isAdminEmail(user.email);
  req.user = user;
  next();
});

/**
 * Ensures the authenticated user's email is verified before allowing
 * protected operations (registrations, submissions, etc.).
 */
const requireVerifiedEmail = (req, _res, next) => {
  if (!req.user.isEmailVerified) {
    return next(ApiError.forbidden('Please verify your email address first'));
  }
  next();
};

/**
 * Same as requireVerifiedEmail, but exempts @rgipt.ac.in accounts. Email
 * verification isn't mandatory for RGIPT students registering for the
 * conference — their institutional address is itself a form of identity
 * assurance, and the OTP step (resend limits, delivery delays) was becoming
 * a real blocker right when students most needed to register. External
 * participants still must verify. Scoped only to conference-registration
 * routes — every other route keeps the strict requireVerifiedEmail check.
 */
const requireVerifiedEmailUnlessRgipt = (req, _res, next) => {
  const isRgipt = (req.user.email || '').toLowerCase().endsWith('@rgipt.ac.in');
  if (!req.user.isEmailVerified && !isRgipt) {
    return next(ApiError.forbidden('Please verify your email address first'));
  }
  next();
};

module.exports = { authenticate, requireVerifiedEmail, requireVerifiedEmailUnlessRgipt };
