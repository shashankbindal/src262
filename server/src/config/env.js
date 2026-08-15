'use strict';

/**
 * Validates that all required environment variables are present.
 * Throws on startup if anything is missing — no silent failures in production.
 */
const required = [
  'MONGODB_URI',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'EMAIL_FROM',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
  'CLIENT_URL',
];

/* Google OAuth is optional — sign-in with Google is disabled unless all
 * three of these are provided. */
const GOOGLE_OAUTH_ENABLED = Boolean(
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.GOOGLE_CALLBACK_URL
);

/* Admin access is restricted to this fixed email whitelist, regardless of
 * a user's `role` field — override via the ADMIN_EMAILS env var (comma-separated). */
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '24it3056@rgipt.ac.in,24re@rgipt.ac.in')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

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
  GOOGLE_OAUTH_ENABLED,

  ADMIN_EMAILS,

  /* Email transport — SMTP (e.g. Zoho) is used when SMTP_* are set,
   * otherwise it falls back to Resend if RESEND_API_KEY is present. */
  SMTP_HOST:              process.env.SMTP_HOST,
  SMTP_PORT:              parseInt(process.env.SMTP_PORT, 10) || 465,
  SMTP_SECURE:            process.env.SMTP_SECURE ? process.env.SMTP_SECURE === 'true' : true,
  SMTP_USER:              process.env.SMTP_USER,
  SMTP_PASS:              process.env.SMTP_PASS,
  RESEND_API_KEY:         process.env.RESEND_API_KEY,
  EMAIL_FROM:             process.env.EMAIL_FROM,
  EMAIL_FROM_NAME:        process.env.EMAIL_FROM_NAME || 'Viplav 2026',

  CLOUDINARY_CLOUD_NAME:  process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY:     process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET:  process.env.CLOUDINARY_API_SECRET,

  /* Treat the app as "production" if NODE_ENV says so OR we're running on
   * Render (which always injects RENDER=true into every deployed service).
   * This is a deliberate belt-and-suspenders check: NODE_ENV not being set
   * to "production" on the actual Render service is a real misconfiguration
   * that has happened here before, and it's too security/correctness-
   * critical (trust proxy → correct per-user rate limiting, Secure cookies,
   * hiding internal error details from end users) to depend on a single env
   * var that's easy to forget when provisioning a new service. */
  isProd: () => process.env.NODE_ENV === 'production' || Boolean(process.env.RENDER),
  isDev:  () => process.env.NODE_ENV !== 'production' && !process.env.RENDER,
};

module.exports = { env, validateEnv };
