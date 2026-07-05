'use strict';
const base = require('../baseTemplate');

module.exports = function otpTemplate({ name, otp }) {
  return base({
    title: 'Verify Your Email — Viplav 2026',
    body:  `
      <h2>Email Verification</h2>
      <p>Hi ${name},</p>
      <p>Use the following one-time code to verify your email address. This code expires in <strong>10 minutes</strong> and can only be used once.</p>
      <div style="text-align:center;margin:32px 0;">
        <div style="display:inline-block;padding:20px 48px;background:rgba(11,93,70,0.12);border:2px solid rgba(11,93,70,0.25);border-radius:12px;">
          <span style="font-size:36px;font-weight:700;letter-spacing:12px;color:#F9FAFB;font-family:monospace;">${otp}</span>
        </div>
      </div>
      <hr class="divider" />
      <p style="font-size:13px;color:#9CA3AF;">If you did not create a Viplav 2026 account, you can safely ignore this email.</p>
      <p style="font-size:13px;color:#9CA3AF;">Do not share this code with anyone. Viplav organizers will never ask for your OTP.</p>
    `,
  });
};
