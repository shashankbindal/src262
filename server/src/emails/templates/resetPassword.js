'use strict';
const base = require('../baseTemplate');

module.exports = function resetPasswordTemplate({ name, resetUrl }) {
  return base({
    title: 'Reset Your Password — Viplav 2026',
    preheader: 'Reset your Viplav 2026 account password',
    body:  `
      <span class="tag">PASSWORD RESET</span>
      <h2 style="margin-top:16px;">Reset your password</h2>
      <p>Hi ${name},</p>
      <p>We received a request to reset your password. Click the button below to choose a new one.</p>
      <a href="${resetUrl}" class="btn">Reset Password</a>
      <hr class="divider" />
      <p style="font-size:13px;color:#8A9180;">This link expires in <strong>1 hour</strong>. If you did not request a password reset, you can safely ignore this email — your password will remain unchanged.</p>
    `,
  });
};
