'use strict';
const jwt    = require('jsonwebtoken');
const crypto = require('crypto');
const { env } = require('../config/env');

/**
 * Signs a short-lived access token (15m by default).
 */
function signAccessToken(userId, role) {
  return jwt.sign({ sub: userId, role }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
    algorithm: 'HS256',
  });
}

/**
 * Signs a long-lived refresh token (7d by default).
 */
function signRefreshToken(userId) {
  return jwt.sign({ sub: userId }, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
    algorithm: 'HS256',
  });
}

/**
 * Verifies the access token.  Throws on invalid/expired.
 */
function verifyAccessToken(token) {
  return jwt.verify(token, env.JWT_SECRET, { algorithms: ['HS256'] });
}

/**
 * Verifies the refresh token.
 */
function verifyRefreshToken(token) {
  return jwt.verify(token, env.JWT_REFRESH_SECRET, { algorithms: ['HS256'] });
}

/**
 * Generates a cryptographically secure URL-safe random hex token
 * and returns both the raw token (for the URL) and its SHA-256 hash
 * (stored in the database so the plain token is never persisted).
 */
function generateSecureToken(byteLength = 32) {
  const raw  = crypto.randomBytes(byteLength).toString('hex');
  const hash = crypto.createHash('sha256').update(raw).digest('hex');
  return { raw, hash };
}

/**
 * Hashes a raw token (for lookup in the database).
 */
function hashToken(raw) {
  return crypto.createHash('sha256').update(raw).digest('hex');
}

/**
 * Sets both tokens as secure HTTP-only cookies on the response.
 */
function setCookies(res, accessToken, refreshToken) {
  const isProd = env.isProd();

  /*
   * The frontend (Vercel) proxies /api requests through to this backend
   * (see client/vercel.json), so the browser only ever talks to its own
   * origin — auth cookies are same-site. SameSite=Lax is the tighter,
   * CSRF-resistant setting; SameSite=None would only be needed if the
   * client called this API directly cross-origin, which it no longer does.
   */
  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure:   isProd,
    sameSite: 'Lax',
    maxAge:   15 * 60 * 1000, // 15 minutes
  });

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure:   isProd,
    sameSite: 'Lax',
    maxAge:   7 * 24 * 60 * 60 * 1000, // 7 days
    path:     '/api/v1/auth/refresh',
  });
}

/**
 * Clears both auth cookies.
 */
function clearCookies(res) {
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken', { path: '/api/v1/auth/refresh' });
}

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  generateSecureToken,
  hashToken,
  setCookies,
  clearCookies,
};
