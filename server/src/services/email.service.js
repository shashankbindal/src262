'use strict';
const { Resend }            = require('resend');
const filterXSS             = require('xss');
const { env }               = require('../config/env');
const logger                = require('../utils/logger');
const otpTemplate           = require('../emails/templates/otp');
const resetPasswordTemplate = require('../emails/templates/resetPassword');

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

module.exports = {
  sendOTP,
  sendPasswordReset,
};
