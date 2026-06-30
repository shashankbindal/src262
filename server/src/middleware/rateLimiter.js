'use strict';
const rateLimit  = require('express-rate-limit');
const slowDown   = require('express-slow-down');

const windowMs = 15 * 60 * 1000; // 15-minute window

/* Generic API rate limiter — applied globally */
const globalLimiter = rateLimit({
  windowMs,
  max:             300,
  standardHeaders: true,
  legacyHeaders:   false,
  message:         { success: false, message: 'Too many requests. Please try again later.' },
});

/* Strict limiter for auth endpoints (login, register, password reset) */
const authLimiter = rateLimit({
  windowMs,
  max:             20,
  standardHeaders: true,
  legacyHeaders:   false,
  message:         { success: false, message: 'Too many auth attempts. Try again in 15 minutes.' },
  skipSuccessfulRequests: true,
});

/* Progressive slow-down after 10 auth attempts */
const authSlowDown = slowDown({
  windowMs,
  delayAfter: 10,
  delayMs:    (used, req) => {
    const delayAfter = req.slowDown.limit;
    return (used - delayAfter) * 500;
  },
});

/* Moderate limiter for file uploads */
const uploadLimiter = rateLimit({
  windowMs:        60 * 60 * 1000, // 1 hour
  max:             30,
  standardHeaders: true,
  legacyHeaders:   false,
  message:         { success: false, message: 'Upload limit exceeded. Try again later.' },
});

module.exports = { globalLimiter, authLimiter, authSlowDown, uploadLimiter };
