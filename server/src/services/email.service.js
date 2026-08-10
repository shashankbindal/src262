'use strict';
const nodemailer              = require('nodemailer');
const { Resend }              = require('resend');
const filterXSS               = require('xss');
const { env }                 = require('../config/env');
const logger                  = require('../utils/logger');
const otpTemplate             = require('../emails/templates/otp');
const resetPasswordTemplate   = require('../emails/templates/resetPassword');
const confRegApprovedTemplate = require('../emails/templates/confRegApproved');
const confRegRejectedTemplate = require('../emails/templates/confRegRejected');
const eventRegistrationCompleteTemplate = require('../emails/templates/eventRegistrationComplete');

const FROM = `${env.EMAIL_FROM_NAME} <${env.EMAIL_FROM}>`;

/* Choose a transport at startup: prefer SMTP (Zoho) when configured, else
 * fall back to Resend. Emails are skipped (with a warning) if neither is set,
 * so the server still boots during setup. */
let smtpTransport = null;
let resendClient  = null;

if (env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS) {
  smtpTransport = nodemailer.createTransport({
    host:   env.SMTP_HOST,
    port:   env.SMTP_PORT,
    secure: env.SMTP_SECURE, // true for port 465, false for 587 (STARTTLS)
    auth:   { user: env.SMTP_USER, pass: env.SMTP_PASS },
  });
  logger.info(`Email transport: SMTP via ${env.SMTP_HOST}:${env.SMTP_PORT}`);
} else if (env.RESEND_API_KEY) {
  resendClient = new Resend(env.RESEND_API_KEY);
  logger.info('Email transport: Resend');
} else {
  logger.warn('No email transport configured (set SMTP_* or RESEND_API_KEY) — emails will be skipped.');
}

/**
 * Sends an email through the active transport. `attachments` is a normalized
 * list of `{ filename, content: Buffer }` — reformatted per transport here so
 * callers never worry about the underlying provider. Never throws: email
 * failure must not break the main request flow; returns true/false instead.
 */
async function send({ to, subject, html, attachments }) {
  try {
    if (smtpTransport) {
      await smtpTransport.sendMail({
        from: FROM,
        to,
        subject,
        html,
        attachments: attachments?.map((a) => ({ filename: a.filename, content: a.content })),
      });
    } else if (resendClient) {
      await resendClient.emails.send({
        from: FROM,
        to,
        subject,
        html,
        attachments: attachments?.map((a) => ({ filename: a.filename, content: a.content.toString('base64') })),
      });
    } else {
      logger.warn(`Email skipped (no transport configured): "${subject}" → ${to}`);
      return false;
    }
    logger.info(`Email sent to ${to}: ${subject}`);
    return true;
  } catch (err) {
    logger.error(`Email delivery failed to ${to}: ${err.message}`);
    return false;
  }
}

async function sendOTP({ name, email, otp }) {
  await send({
    to:      email,
    subject: 'Your Viplav 2026 Verification Code',
    html:    otpTemplate({ name: filterXSS(name), otp }),
  });
}

async function sendPasswordReset({ name, email, resetUrl }) {
  await send({
    to:      email,
    subject: 'Reset Your Viplav 2026 Password',
    html:    resetPasswordTemplate({ name: filterXSS(name), resetUrl }),
  });
}

async function sendConfRegApproved({ name, email, srcId, idCardPdf }) {
  await send({
    to:      email,
    subject: 'Your AIChE India SRC 2026 Registration is Approved!',
    html:    confRegApprovedTemplate({ name: filterXSS(name), srcId }),
    attachments: idCardPdf
      ? [{ filename: 'Viplav-2026-ID-Card.pdf', content: idCardPdf }]
      : undefined,
  });
}

async function sendConfRegRejected({ name, email, reason }) {
  await send({
    to:      email,
    subject: 'Action Required: Your AIChE India SRC 2026 Registration',
    html:    confRegRejectedTemplate({ name: filterXSS(name), reason: filterXSS(reason) }),
  });
}

async function sendEventRegistrationComplete({ name, email, eventName, teamName, whatsappGroupLink, hasSubmission = true }) {
  await send({
    to:      email,
    subject: `Your Registration for ${eventName} is Confirmed! — Viplav 2026`,
    html:    eventRegistrationCompleteTemplate({
      name: filterXSS(name),
      eventName: filterXSS(eventName),
      teamName: teamName ? filterXSS(teamName) : undefined,
      whatsappGroupLink: whatsappGroupLink ? filterXSS(whatsappGroupLink) : undefined,
      hasSubmission,
    }),
  });
}

module.exports = {
  sendOTP,
  sendPasswordReset,
  sendConfRegApproved,
  sendConfRegRejected,
  sendEventRegistrationComplete,
};
