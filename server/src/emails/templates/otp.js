'use strict';
const base = require('../baseTemplate');

module.exports = function otpTemplate({ name, otp }) {
  return base({
    title: 'Verify Your Email — Viplav 2026',
    preheader: `Your verification code is ${otp}`,
    body:  `
      <span class="tag">EMAIL VERIFICATION</span>
      <h2 style="margin-top:16px;">Confirm your email address</h2>
      <p>Hi ${name},</p>
      <p>Use the following one-time code to verify your email address. This code expires in <strong>10 minutes</strong> and can only be used once.</p>
      <div style="text-align:center;margin:32px 0;">
        <div style="display:inline-block;padding:20px 48px;background:rgba(76,88,62,0.08);border:2px solid rgba(76,88,62,0.2);border-radius:12px;">
          <span style="font-size:36px;font-weight:700;letter-spacing:12px;color:#2C3424;font-family:'Courier New',monospace;">${otp}</span>
        </div>
      </div>
      <hr class="divider" />
      <p style="font-size:13px;color:#8A9180;">If you did not create a Viplav 2026 account, you can safely ignore this email.</p>
      <p style="font-size:13px;color:#8A9180;">Do not share this code with anyone. Viplav organizers will never ask for your OTP.</p>
    `,
  });
};
