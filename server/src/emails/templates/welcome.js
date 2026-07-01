'use strict';
const base = require('../baseTemplate');

module.exports = function welcomeTemplate({ name, verifyUrl }) {
  return base({
    title: 'Welcome to VIPLAV 2026',
    body:  `
      <h2>Welcome, ${name}! 🎉</h2>
      <p>Your account has been created successfully for <strong>AIChE India SRC 2026 — VIPLAV</strong>.</p>
      <p>Please verify your email address to complete registration and unlock event sign-ups.</p>
      <a href="${verifyUrl}" class="btn">Verify Email Address</a>
      <hr class="divider" />
      <p style="font-size:13px;color:#9CA3AF;">This link expires in <strong>24 hours</strong>. If you did not create an account, please ignore this email.</p>
    `,
  });
};
