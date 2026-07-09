'use strict';
const rateLimit  = require('express-rate-limit');
const slowDown   = require('express-slow-down');

const windowMs = 15 * 60 * 1000; // 15-minute window

/* Generic API rate limiter — applied globally.
 * 600/15min per IP: high enough that a hostel/campus network full of
 * students sharing one NAT'd IP during a registration rush doesn't get
 * collectively throttled, while still bounding abuse from a single source. */
const globalLimiter = rateLimit({
  windowMs,
  max:             600,
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

/* Moderate limiter for file uploads.
 * 150/hour per IP: conference registration uploads a screenshot + photo
 * (+ optionally an ID card) per submission, and many students on the same
 * campus IP may submit within the same hour — the old ceiling of 30 was
 * easily hit by legitimate shared-IP traffic during a registration rush. */
const uploadLimiter = rateLimit({
  windowMs:        60 * 60 * 1000, // 1 hour
  max:             150,
  standardHeaders: true,
  legacyHeaders:   false,
  message:         { success: false, message: 'Upload limit exceeded. Try again later.' },
});

module.exports = { globalLimiter, authLimiter, authSlowDown, uploadLimiter };
