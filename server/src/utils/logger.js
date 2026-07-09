'use strict';
const { createLogger, format, transports } = require('winston');
const { combine, timestamp, printf, colorize, errors } = format;

const logFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} [${level}]: ${stack || message}`;
});

/* Console only — Render (and most PaaS hosts) capture stdout/stderr directly
 * and show it in their own log viewer, so writing to local files too just
 * adds disk I/O on an ephemeral filesystem that's wiped on every deploy. */
const logger = createLogger({
  level: process.env.NODE_ENV === 'production' ? 'warn' : 'debug',
  format: combine(
    errors({ stack: true }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    process.env.NODE_ENV !== 'production' ? colorize() : format.uncolorize(),
    logFormat
  ),
  transports: [
    new transports.Console(),
  ],
});

module.exports = logger;
