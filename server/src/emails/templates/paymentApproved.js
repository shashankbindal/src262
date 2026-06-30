'use strict';
const base = require('../baseTemplate');

module.exports = function paymentApprovedTemplate({ name, eventName, dashboardUrl }) {
  return base({
    title: `Payment Approved — ${eventName}`,
    body:  `
      <h2>Payment Approved ✅</h2>
      <p>Hi ${name},</p>
      <p>Great news! Your payment for <strong>${eventName}</strong> has been verified and approved by the organizing team.</p>
      <p>Your registration is now <span class="tag">CONFIRMED</span>.</p>
      <p>If this event requires a document submission, you can now upload it from your dashboard before the submission deadline.</p>
      <a href="${dashboardUrl}" class="btn">Go to Dashboard</a>
      <hr class="divider" />
      <p style="font-size:13px;color:#9CA3AF;">Please note that your registration details are now <strong>locked</strong> and cannot be modified. Contact us if you need assistance.</p>
    `,
  });
};
