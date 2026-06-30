'use strict';
const mongoose = require('mongoose');
const { env }  = require('./env');
const logger   = require('../utils/logger');

async function connectDB() {
  try {
    const conn = await mongoose.connect(env.MONGODB_URI, {
      maxPoolSize:         10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS:     45000,
    });
    logger.info(`MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    logger.error(`MongoDB connection error: ${err.message}`);
    process.exit(1);
  }
}

mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected. Attempting to reconnect…');
});

mongoose.connection.on('error', (err) => {
  logger.error(`MongoDB error: ${err.message}`);
});

module.exports = connectDB;
