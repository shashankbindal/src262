'use strict';
require('dotenv').config();

const { validateEnv } = require('./src/config/env');
const connectDB       = require('./src/config/db');
const logger          = require('./src/utils/logger');
const app             = require('./src/app');
const { env }         = require('./src/config/env');

/* Crash immediately if any required env var is missing */
validateEnv();

async function boot() {
  await connectDB();

  const server = app.listen(env.PORT, () => {
    logger.info(`Server running in ${env.NODE_ENV} mode on port ${env.PORT}`);
  });

  /* ─── Graceful shutdown ───────────────────────────────────────────────── */
  const shutdown = (signal) => {
    logger.info(`${signal} received — shutting down gracefully`);
    server.close(() => {
      logger.info('HTTP server closed');
      process.exit(0);
    });

    /* Force exit after 10s if graceful shutdown stalls */
    setTimeout(() => {
      logger.error('Force exit after 10s timeout');
      process.exit(1);
    }, 10_000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT',  () => shutdown('SIGINT'));

  process.on('unhandledRejection', (reason) => {
    logger.error(`Unhandled Rejection: ${reason}`);
    server.close(() => process.exit(1));
  });

  process.on('uncaughtException', (err) => {
    logger.error(`Uncaught Exception: ${err.message}`);
    process.exit(1);
  });
}

boot();
