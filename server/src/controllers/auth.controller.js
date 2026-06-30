'use strict';
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse  = require('../utils/ApiResponse');
const ApiError     = require('../utils/ApiError');
const authService  = require('../services/auth.service');
const crypto       = require('crypto');
const {
  setCookies,
  clearCookies,
  signAccessToken,
  signRefreshToken,
  hashToken,
}                  = require('../utils/generateToken');
const { env }      = require('../config/env');
const logger       = require('../utils/logger');

const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  const user = await authService.register({ name, email, password });
  ApiResponse.created(res, 'Account created. Please check your email to verify your account.', {
    id: user._id, name: user.name, email: user.email,
  });
});

const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.query;
  if (!token) throw ApiError.badRequest('Verification token is required');
  await authService.verifyEmail(token);
  ApiResponse.ok(res, 'Email verified successfully. You can now log in.');
});

const resendVerification = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) throw ApiError.badRequest('Email is required');
  await authService.resendVerification(email);
  /* Always 200 — don't reveal whether email exists */
  ApiResponse.ok(res, 'If an unverified account exists for that email, a new verification link has been sent.');
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const { accessToken, refreshToken, user } = await authService.login({ email, password });

  setCookies(res, accessToken, refreshToken);
  logger.info(`User logged in: ${user._id}`);
  ApiResponse.ok(res, 'Login successful', user.toSafeObject ? user.toSafeObject() : user);
});

const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (!token) throw ApiError.unauthorized('Refresh token missing');
  const { accessToken, refreshToken } = await authService.refreshTokens(token);
  setCookies(res, accessToken, refreshToken);
  ApiResponse.ok(res, 'Token refreshed');
});

const logout = asyncHandler(async (req, res) => {
  await authService.logout(req.user._id);
  clearCookies(res);
  ApiResponse.ok(res, 'Logged out successfully');
});

const forgotPassword = asyncHandler(async (req, res) => {
  await authService.forgotPassword(req.body.email);
  ApiResponse.ok(res, 'If an account exists for that email, a password reset link has been sent.');
});

const resetPassword = asyncHandler(async (req, res) => {
  const { token }    = req.query;
  const { password } = req.body;
  if (!token) throw ApiError.badRequest('Reset token is required');
  await authService.resetPassword(token, password);
  ApiResponse.ok(res, 'Password reset successfully. You can now log in with your new password.');
});

/**
 * Google OAuth callback — issues tokens and redirects to frontend dashboard.
 */
const googleCallback = asyncHandler(async (req, res) => {
  const user = req.user;
  if (!user) throw ApiError.unauthorized('Google authentication failed');

  const accessToken  = signAccessToken(user._id.toString(), user.role);
  const refreshToken = signRefreshToken(user._id.toString());

  user.refreshTokenHash = hashToken(refreshToken);
  await user.save();

  setCookies(res, accessToken, refreshToken);
  res.redirect(`${env.CLIENT_URL}/dashboard`);
});

const getMe = asyncHandler(async (req, res) => {
  ApiResponse.ok(res, 'Current user', req.user);
});

module.exports = {
  register,
  verifyEmail,
  resendVerification,
  login,
  refresh,
  logout,
  forgotPassword,
  resetPassword,
  googleCallback,
  getMe,
};
