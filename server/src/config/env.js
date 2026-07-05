'use strict';

/**
 * Validates that all required environment variables are present.
 * Throws on startup if anything is missing — no silent failures in production.
 */
const required = [
  'MONGODB_URI',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'GOOGLE_CALLBACK_URL',
  'RESEND_API_KEY',
  'EMAIL_FROM',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
  'CLIENT_URL',
];

function validateEnv() {
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

const env = {
  NODE_ENV:               process.env.NODE_ENV || 'development',
  PORT:                   parseInt(process.env.PORT, 10) || 5000,
  CLIENT_URL:             process.env.CLIENT_URL,
  MONGODB_URI:            process.env.MONGODB_URI,

  JWT_SECRET:             process.env.JWT_SECRET,
  JWT_EXPIRES_IN:         process.env.JWT_EXPIRES_IN || '15m',
  JWT_REFRESH_SECRET:     process.env.JWT_REFRESH_SECRET,
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',

  GOOGLE_CLIENT_ID:       process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET:   process.env.GOOGLE_CLIENT_SECRET,
  GOOGLE_CALLBACK_URL:    process.env.GOOGLE_CALLBACK_URL,

  RESEND_API_KEY:         process.env.RESEND_API_KEY,
  EMAIL_FROM:             process.env.EMAIL_FROM,
  EMAIL_FROM_NAME:        process.env.EMAIL_FROM_NAME || 'Viplav 2026',

  CLOUDINARY_CLOUD_NAME:  process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY:     process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET:  process.env.CLOUDINARY_API_SECRET,

  isProd: () => process.env.NODE_ENV === 'production',
  isDev:  () => process.env.NODE_ENV !== 'production',
};

module.exports = { env, validateEnv };
