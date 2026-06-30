'use strict';
const { verifyAccessToken } = require('../utils/generateToken');
const ApiError              = require('../utils/ApiError');
const asyncHandler          = require('../utils/asyncHandler');
const User                  = require('../models/User');

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

module.exports = { authenticate, requireVerifiedEmail };
