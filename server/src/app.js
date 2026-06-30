'use strict';
require('dotenv').config();

const express       = require('express');
const helmet        = require('helmet');
const cors          = require('cors');
const cookieParser  = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');
const xss           = require('xss');
const hpp           = require('hpp');
const passport      = require('./config/passport');
const { globalLimiter } = require('./middleware/rateLimiter');
const errorMiddleware   = require('./middleware/error.middleware');
const logger            = require('./utils/logger');
const { env }           = require('./config/env');

/* ─── Route imports ──────────────────────────────────────────────────────── */
const authRoutes         = require('./routes/auth.routes');
const userRoutes         = require('./routes/user.routes');
const eventRoutes        = require('./routes/event.routes');
const registrationRoutes = require('./routes/registration.routes');
const submissionRoutes   = require('./routes/submission.routes');
const adminRoutes        = require('./routes/admin.routes');

const app = express();

/* ─── Security headers ───────────────────────────────────────────────────── */
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

/* ─── CORS ───────────────────────────────────────────────────────────────── */
app.use(cors({
  origin:      env.CLIENT_URL,
  credentials: true,
  methods:     ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

/* ─── Body parsers ───────────────────────────────────────────────────────── */
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());

/* ─── Sanitization ───────────────────────────────────────────────────────── */
/* Strip $ and . from keys to prevent NoSQL injection */
app.use(mongoSanitize({ replaceWith: '_' }));
/* Prevent HTTP Parameter Pollution */
app.use(hpp());

/* ─── Global rate limit ──────────────────────────────────────────────────── */
app.use(globalLimiter);

/* ─── Passport (Google OAuth only — no session) ─────────────────────────── */
app.use(passport.initialize());

/* ─── Static files (for local uploads fallback) ────────────────────────── */
// Removed: Local uploads fallback disabled in production


/* ─── Health check ───────────────────────────────────────────────────────── */
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', env: env.NODE_ENV, ts: new Date().toISOString() });
});

/* ─── API routes ─────────────────────────────────────────────────────────── */
const V1 = '/api/v1';

app.use(`${V1}/auth`,          authRoutes);
app.use(`${V1}/users`,         userRoutes);
app.use(`${V1}/events`,        eventRoutes);
app.use(`${V1}/registrations`, registrationRoutes);
app.use(`${V1}/submissions`,   submissionRoutes);
app.use(`${V1}/admin`,         adminRoutes);

/* ─── 404 handler ────────────────────────────────────────────────────────── */
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Resource not found' });
});

/* ─── Centralized error handler ──────────────────────────────────────────── */
app.use(errorMiddleware);

module.exports = app;
