'use strict';
const base = require('../baseTemplate');

module.exports = function participationConfirmationTemplate({ name, eventName }) {
  return base({
    title: `Registration Confirmed — ${eventName}`,
    body:  `
      <h2>You're All Set! 🎊</h2>
      <p>Hi ${name},</p>
      <p>Your participation in <strong>${eventName}</strong> at AIChE India SRC 2026 — Viplav has been confirmed.</p>
      <p>We look forward to seeing you at RGIPT on <strong>22nd–23rd August 2026</strong>.</p>
      <hr class="divider" />
      <p style="font-size:13px;color:#9CA3AF;">Carry this email as proof of registration if required on the event day.</p>
    `,
  });
};
