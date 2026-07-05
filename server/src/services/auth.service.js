'use strict';
const crypto         = require('crypto');
const User           = require('../models/User');
const ApiError       = require('../utils/ApiError');
const {
  generateSecureToken,
  hashToken,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
}                    = require('../utils/generateToken');
const emailService   = require('./email.service');
const { env }        = require('../config/env');
const logger         = require('../utils/logger');

/* OTP configuration */
const OTP_EXPIRY_MS       = 10 * 60 * 1000; // 10 minutes
const OTP_MAX_ATTEMPTS    = 5;               // lock OTP after 5 wrong attempts
const OTP_RESEND_LIMIT    = 3;              // max resends in window
const OTP_RESEND_WINDOW_MS = 60 * 60 * 1000; // 1 hour window

/**
 * Generates a 6-digit OTP string.
 */
function generateOTP() {
  return String(crypto.randomInt(100000, 1000000));
}

/**
 * Registers a new user. Does NOT automatically send OTP — caller must
 * follow up with sendOTP so the user can verify their email.
 */
async function register({ name, email, password }) {
  const existing = await User.findOne({ email });
  if (existing) {
    throw ApiError.conflict('Email is already taken');
  }

  const user = await User.create({ name, email, password });
  logger.info(`User registered: ${user._id}`);
  return user;
}

/**
 * Sends (or re-sends) an OTP to the user's email.
 * Rate-limits resend to OTP_RESEND_LIMIT per OTP_RESEND_WINDOW_MS.
 * Resets attempt counter each time a fresh OTP is issued.
 */
async function sendOTP(email) {
  const user = await User.findOne({ email })
    .select('+otpHash +otpExpiry +otpAttempts +otpResendCount +otpResendWindowStart');

  if (!user) return; // silence — don't leak whether email exists

  /* Rate-limit resend requests */
  const now = Date.now();
  if (user.otpResendWindowStart && now - user.otpResendWindowStart.getTime() < OTP_RESEND_WINDOW_MS) {
    if ((user.otpResendCount || 0) >= OTP_RESEND_LIMIT) {
      throw ApiError.tooMany('Too many OTP requests. Please wait before requesting another code.');
    }
    user.otpResendCount = (user.otpResendCount || 0) + 1;
  } else {
    /* New window */
    user.otpResendCount       = 1;
    user.otpResendWindowStart = new Date(now);
  }

  const otp             = generateOTP();
  user.otpHash          = hashToken(otp);
  user.otpExpiry        = new Date(now + OTP_EXPIRY_MS);
  user.otpAttempts      = 0;
  await user.save();

  /* Non-blocking */
  emailService.sendOTP({ name: user.name, email: user.email, otp }).catch(() => {});
}

/**
 * Verifies the OTP submitted by the user.
 * On success: marks email as verified and clears all OTP fields.
 * On failure: increments attempts; locks OTP (clears it) if max reached.
 */
async function verifyOTP(email, submittedOTP) {
  const user = await User.findOne({ email })
    .select('+otpHash +otpExpiry +otpAttempts');

  if (!user) throw ApiError.badRequest('No account found for this email');
  if (user.isEmailVerified) throw ApiError.badRequest('Email is already verified');

  if (!user.otpHash || !user.otpExpiry) {
    throw ApiError.badRequest('No OTP has been sent. Please request a new code.');
  }

  if (new Date() > user.otpExpiry) {
    user.otpHash = undefined;
    user.otpExpiry = undefined;
    user.otpAttempts = 0;
    await user.save();
    throw ApiError.badRequest('OTP has expired. Please request a new code.');
  }

  if ((user.otpAttempts || 0) >= OTP_MAX_ATTEMPTS) {
    user.otpHash = undefined;
    user.otpExpiry = undefined;
    user.otpAttempts = 0;
    await user.save();
    throw ApiError.badRequest('Too many failed attempts. Please request a new OTP.');
  }

  const hash = hashToken(submittedOTP.trim());
  if (hash !== user.otpHash) {
    user.otpAttempts = (user.otpAttempts || 0) + 1;
    await user.save();

    const remaining = OTP_MAX_ATTEMPTS - user.otpAttempts;
    if (remaining <= 0) {
      user.otpHash     = undefined;
      user.otpExpiry   = undefined;
      user.otpAttempts = 0;
      await user.save();
      throw ApiError.badRequest('Too many failed attempts. Please request a new OTP.');
    }

    throw ApiError.badRequest(`Invalid OTP. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`);
  }

  /* Success — activate account and clear OTP */
  user.isEmailVerified  = true;
  user.otpHash          = undefined;
  user.otpExpiry        = undefined;
  user.otpAttempts      = 0;
  user.otpResendCount   = 0;
  user.otpResendWindowStart = undefined;
  await user.save();

  logger.info(`Email verified via OTP: ${user._id}`);
  return user;
}

/**
 * Authenticates a user by email + password.
 */
async function login({ email, password }) {
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password +refreshTokenHash');

  if (!user || !user.password) {
    logger.warn(`Failed login attempt for email: ${email}`);
    throw ApiError.unauthorized('Invalid credentials');
  }

  const match = await user.comparePassword(password);
  if (!match) {
    logger.warn(`Wrong password for ${email}`);
    throw ApiError.unauthorized('Invalid credentials');
  }

  return issueTokens(user);
}

/**
 * Returns a new access token given a valid refresh token cookie.
 */
async function refreshTokens(rawRefreshToken) {
  let payload;
  try {
    payload = verifyRefreshToken(rawRefreshToken);
  } catch {
    throw ApiError.unauthorized('Invalid refresh token');
  }

  const user = await User.findById(payload.sub).select('+refreshTokenHash');
  if (!user) throw ApiError.unauthorized('Account not found');

  const hash = hashToken(rawRefreshToken);
  if (user.refreshTokenHash !== hash) {
    user.refreshTokenHash = undefined;
    await user.save();
    throw ApiError.unauthorized('Refresh token reuse detected. Please log in again.');
  }

  return issueTokens(user);
}

async function issueTokens(user) {
  const accessToken  = signAccessToken(user._id.toString(), user.role);
  const refreshToken = signRefreshToken(user._id.toString());

  user.refreshTokenHash = hashToken(refreshToken);
  await user.save();

  return { accessToken, refreshToken, user };
}

/**
 * Initiates a password reset flow.
 */
async function forgotPassword(email) {
  const user = await User.findOne({ email }).select('+passwordResetToken +passwordResetExpiry');
  if (!user) return; // silence

  const { raw, hash } = generateSecureToken(32);
  user.passwordResetToken  = hash;
  user.passwordResetExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1h
  await user.save();

  const resetUrl = `${env.CLIENT_URL}/reset-password?token=${raw}`;
  emailService.sendPasswordReset({ name: user.name, email, resetUrl }).catch(() => {});
}

/**
 * Resets the password using the raw token from the URL.
 */
async function resetPassword(rawToken, newPassword) {
  const hash = hashToken(rawToken);
  const user = await User.findOne({
    passwordResetToken:  hash,
    passwordResetExpiry: { $gt: new Date() },
  }).select('+passwordResetToken +passwordResetExpiry +refreshTokenHash');

  if (!user) throw ApiError.badRequest('Reset link is invalid or has expired');

  user.password            = newPassword;
  user.passwordResetToken  = undefined;
  user.passwordResetExpiry = undefined;
  user.refreshTokenHash    = undefined; // invalidate all sessions
  await user.save();
}

/**
 * Revokes the refresh token (logout).
 */
async function logout(userId) {
  await User.findByIdAndUpdate(userId, { $unset: { refreshTokenHash: 1 } });
}

module.exports = {
  register,
  sendOTP,
  verifyOTP,
  login,
  refreshTokens,
  forgotPassword,
  resetPassword,
  logout,
};
