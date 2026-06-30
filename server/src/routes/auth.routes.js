'use strict';
const express  = require('express');
const passport = require('../config/passport');
const ctrl     = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authLimiter, authSlowDown } = require('../middleware/rateLimiter');
const validate = require('../middleware/validate');
const {
  registerValidator,
  loginValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
} = require('../validators/auth.validators');

const router = express.Router();

/* ─── Public ─────────────────────────────────────────────────────────────── */
router.post('/register',
  authLimiter, authSlowDown,
  registerValidator, validate,
  ctrl.register
);

router.post('/login',
  authLimiter, authSlowDown,
  loginValidator, validate,
  ctrl.login
);

router.get('/verify-email',  ctrl.verifyEmail);
router.post('/resend-verification', authLimiter, ctrl.resendVerification);

router.post('/forgot-password',
  authLimiter,
  forgotPasswordValidator, validate,
  ctrl.forgotPassword
);

router.post('/reset-password',
  authLimiter,
  resetPasswordValidator, validate,
  ctrl.resetPassword
);

router.post('/refresh', ctrl.refresh);

/* ─── Google OAuth ───────────────────────────────────────────────────────── */
router.get('/google',
  passport.authenticate('google', { session: false })
);

router.get('/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login' }),
  ctrl.googleCallback
);

/* ─── Protected ──────────────────────────────────────────────────────────── */
router.get('/me', authenticate, ctrl.getMe);
router.post('/logout', authenticate, ctrl.logout);

module.exports = router;
