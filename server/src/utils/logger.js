'use strict';
const { createLogger, format, transports } = require('winston');
const { combine, timestamp, printf, colorize, errors } = format;

const logFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} [${level}]: ${stack || message}`;
});

/* Mirrors config/env.js's isProd() check without importing it (this module
 * is loaded very early, before env vars are validated, so it stays
 * dependency-light and reads process.env directly). Render always injects
 * RENDER=true into every deployed service — checked as a fallback in case
 * NODE_ENV isn't set to "production" there. */
const IS_DEPLOYED = process.env.NODE_ENV === 'production' || Boolean(process.env.RENDER);

/* Console only — Render (and most PaaS hosts) capture stdout/stderr directly
 * and show it in their own log viewer, so writing to local files too just
 * adds disk I/O on an ephemeral filesystem that's wiped on every deploy.
 *
 * Level is 'info' (not 'warn') even when deployed: the codebase has zero
 * logger.debug() calls, so 'warn' doesn't trade away debug noise — it
 * silently discards every logger.info() call (registrations, approvals,
 * logins, emails sent, admin actions), which is exactly the operational
 * trail needed to diagnose live issues. */
const logger = createLogger({
  level: IS_DEPLOYED ? 'info' : 'debug',
  format: combine(
    errors({ stack: true }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    IS_DEPLOYED ? format.uncolorize() : colorize(),
    logFormat
  ),
  transports: [
    new transports.Console(),
  ],
});

module.exports = logger;
