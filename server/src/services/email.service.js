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

/* Both transports are initialized (when configured) so callers can choose per
 * email: the "resend" buttons deliver over SMTP (Zoho), while every other/
 * automatic email uses the Resend API service. If the preferred transport is
 * not configured, we fall back to whichever one is. */
let smtpTransport = null;
let resendClient  = null;

if (env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS) {
  smtpTransport = nodemailer.createTransport({
    host:   env.SMTP_HOST,
    port:   env.SMTP_PORT,
    secure: env.SMTP_SECURE, // true for port 465, false for 587 (STARTTLS)
    auth:   { user: env.SMTP_USER, pass: env.SMTP_PASS },
  });
  logger.info(`Email transport ready: SMTP via ${env.SMTP_HOST}:${env.SMTP_PORT} (used for resend buttons)`);
}
if (env.RESEND_API_KEY) {
  resendClient = new Resend(env.RESEND_API_KEY);
  logger.info('Email transport ready: Resend (used for all other emails)');
}
if (!smtpTransport && !resendClient) {
  logger.warn('No email transport configured (set SMTP_* and/or RESEND_API_KEY) — emails will be skipped.');
}

async function sendViaSmtp({ to, subject, html, attachments }) {
  await smtpTransport.sendMail({
    from: FROM,
    to,
    subject,
    html,
    attachments: attachments?.map((a) => ({ filename: a.filename, content: a.content })),
  });
}

async function sendViaResend({ to, subject, html, attachments }) {
  await resendClient.emails.send({
    from: FROM,
    to,
    subject,
    html,
    attachments: attachments?.map((a) => ({ filename: a.filename, content: a.content.toString('base64') })),
  });
}

/**
 * Sends an email. `via` selects the transport — 'smtp' for the resend buttons,
 * 'resend' (default) for everything else — falling back to the other transport
 * if the preferred one isn't configured. `attachments` is a normalized list of
 * `{ filename, content: Buffer }`. Never throws: email failure must not break
 * the main request flow; returns true/false instead.
 */
async function send({ to, subject, html, attachments, via = 'resend' }) {
  const preferSmtp = via === 'smtp';
  const primary   = preferSmtp ? smtpTransport : resendClient;
  const primaryFn = preferSmtp ? sendViaSmtp   : sendViaResend;
  const fallback   = preferSmtp ? resendClient : smtpTransport;
  const fallbackFn = preferSmtp ? sendViaResend : sendViaSmtp;

  const usePrimary = Boolean(primary);
  const useFn      = usePrimary ? primaryFn : (fallback ? fallbackFn : null);
  const label      = usePrimary ? (preferSmtp ? 'SMTP' : 'Resend') : (preferSmtp ? 'Resend' : 'SMTP');

  if (!useFn) {
    logger.warn(`Email skipped (no transport configured): "${subject}" → ${to}`);
    return false;
  }

  try {
    await useFn({ to, subject, html, attachments });
    logger.info(`Email sent to ${to} via ${label}: ${subject}`);
    return true;
  } catch (err) {
    logger.error(`Email delivery failed to ${to} via ${label}: ${err.message}`);
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

/* `via` defaults to 'resend'; the resend-button paths pass via: 'smtp'. */
async function sendConfRegApproved({ name, email, srcId, idCardPdf, via }) {
  await send({
    to:      email,
    subject: 'Your AIChE India SRC 2026 Registration is Approved!',
    html:    confRegApprovedTemplate({ name: filterXSS(name), srcId }),
    attachments: idCardPdf
      ? [{ filename: 'Viplav-2026-ID-Card.pdf', content: idCardPdf }]
      : undefined,
    via,
  });
}

async function sendConfRegRejected({ name, email, reason, via }) {
  await send({
    to:      email,
    subject: 'Action Required: Your AIChE India SRC 2026 Registration',
    html:    confRegRejectedTemplate({ name: filterXSS(name), reason: filterXSS(reason) }),
    via,
  });
}

async function sendEventRegistrationComplete({ name, email, eventName, teamName, whatsappGroupLink, hasSubmission = true, via }) {
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
    via,
  });
}

module.exports = {
  sendOTP,
  sendPasswordReset,
  sendConfRegApproved,
  sendConfRegRejected,
  sendEventRegistrationComplete,
};
