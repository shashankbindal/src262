'use strict';
const { Resend }       = require('resend');
const { env }          = require('../config/env');
const logger           = require('../utils/logger');

const welcomeTemplate              = require('../emails/templates/welcome');
const resetPasswordTemplate        = require('../emails/templates/resetPassword');
const paymentApprovedTemplate      = require('../emails/templates/paymentApproved');
const paymentRejectedTemplate      = require('../emails/templates/paymentRejected');
const submissionReceivedTemplate   = require('../emails/templates/submissionReceived');
const participationConfirmTemplate = require('../emails/templates/participationConfirmation');

const resend = new Resend(env.RESEND_API_KEY);
const FROM   = `${env.EMAIL_FROM_NAME} <${env.EMAIL_FROM}>`;

async function send({ to, subject, html }) {
  try {
    await resend.emails.send({ from: FROM, to, subject, html });
    logger.info(`Email sent to ${to}: ${subject}`);
  } catch (err) {
    /* Log but never throw — email failure must not break the main flow */
    logger.error(`Email delivery failed to ${to}: ${err.message}`);
  }
}

async function sendWelcome({ name, email, verifyUrl }) {
  await send({
    to:      email,
    subject: 'Welcome to Viplav 2026 — Verify Your Email',
    html:    welcomeTemplate({ name, verifyUrl }),
  });
}

async function sendPasswordReset({ name, email, resetUrl }) {
  await send({
    to:      email,
    subject: 'Reset Your Viplav 2026 Password',
    html:    resetPasswordTemplate({ name, resetUrl }),
  });
}

async function sendPaymentApproved({ name, email, eventName, dashboardUrl }) {
  await send({
    to:      email,
    subject: `Payment Approved — ${eventName} | Viplav 2026`,
    html:    paymentApprovedTemplate({ name, eventName, dashboardUrl }),
  });
}

async function sendPaymentRejected({ name, email, eventName, reason, dashboardUrl }) {
  await send({
    to:      email,
    subject: `Payment Rejected — ${eventName} | Viplav 2026`,
    html:    paymentRejectedTemplate({ name, eventName, reason, dashboardUrl }),
  });
}

async function sendSubmissionReceived({ name, email, eventName, fileName, dashboardUrl }) {
  await send({
    to:      email,
    subject: `Submission Received — ${eventName} | Viplav 2026`,
    html:    submissionReceivedTemplate({ name, eventName, fileName, dashboardUrl }),
  });
}

async function sendParticipationConfirmation({ name, email, eventName }) {
  await send({
    to:      email,
    subject: `Registration Confirmed — ${eventName} | Viplav 2026`,
    html:    participationConfirmTemplate({ name, eventName }),
  });
}

module.exports = {
  sendWelcome,
  sendPasswordReset,
  sendPaymentApproved,
  sendPaymentRejected,
  sendSubmissionReceived,
  sendParticipationConfirmation,
};
