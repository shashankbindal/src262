'use strict';
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
const bcrypt         = require('bcryptjs');

/**
 * Registers a new user, sends verification email.
 */
async function register({ name, email, password }) {
  const existing = await User.findOne({ email });
  if (existing) {
    throw ApiError.conflict('Email is already taken');
  }

  const { raw, hash } = generateSecureToken(32);
  const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

  const user = await User.create({
    name,
    email,
    password,
    emailVerificationToken:  hash,
    emailVerificationExpiry: expiry,
  });

  const verifyUrl = `${env.CLIENT_URL}/verify-email?token=${raw}`;

  /* Non-blocking — do NOT await */
  emailService.sendWelcome({ name: user.name, email: user.email, verifyUrl }).catch(() => {});

  return user;
}

/**
 * Verifies email from the raw token in the URL.
 */
async function verifyEmail(rawToken) {
  const hash = hashToken(rawToken);
  const user = await User.findOne({
    emailVerificationToken:  hash,
    emailVerificationExpiry: { $gt: new Date() },
  }).select('+emailVerificationToken +emailVerificationExpiry');

  if (!user) throw ApiError.badRequest('Verification link is invalid or has expired');

  user.isEmailVerified        = true;
  user.emailVerificationToken  = undefined;
  user.emailVerificationExpiry = undefined;
  await user.save();

  return user;
}

/**
 * Resends a verification email.
 */
async function resendVerification(email) {
  const user = await User.findOne({ email })
    .select('+emailVerificationToken +emailVerificationExpiry');
  if (!user) return; // silence — don't leak whether email exists
  if (user.isEmailVerified) return;

  const { raw, hash } = generateSecureToken(32);
  user.emailVerificationToken  = hash;
  user.emailVerificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await user.save();

  const verifyUrl = `${env.CLIENT_URL}/verify-email?token=${raw}`;
  emailService.sendWelcome({ name: user.name, email, verifyUrl }).catch(() => {});
}

/**
 * Authenticates a user by email/username + password.
 * Returns { accessToken, refreshToken, user }.
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
    /* Token reuse detected — possible hijack; invalidate all tokens */
    user.refreshTokenHash = undefined;
    await user.save();
    throw ApiError.unauthorized('Refresh token reuse detected. Please log in again.');
  }

  return issueTokens(user);
}

/**
 * Internal helper — issues both tokens and persists the refresh hash.
 */
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

  user.password           = newPassword;
  user.passwordResetToken  = undefined;
  user.passwordResetExpiry = undefined;
  user.refreshTokenHash    = undefined; // invalidate all sessions
  await user.save();
}

/**
 * Revokes the refresh token stored on the user document (logout).
 */
async function logout(userId) {
  await User.findByIdAndUpdate(userId, { $unset: { refreshTokenHash: 1 } });
}

module.exports = {
  register,
  verifyEmail,
  resendVerification,
  login,
  refreshTokens,
  forgotPassword,
  resetPassword,
  logout,
};
