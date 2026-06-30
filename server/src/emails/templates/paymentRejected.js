'use strict';
const base = require('../baseTemplate');

module.exports = function paymentRejectedTemplate({ name, eventName, reason, dashboardUrl }) {
  return base({
    title: `Payment Rejected — ${eventName}`,
    body:  `
      <h2>Payment Could Not Be Verified ❌</h2>
      <p>Hi ${name},</p>
      <p>Unfortunately, your payment submission for <strong>${eventName}</strong> was rejected by the organizing team.</p>
      <p><strong>Reason:</strong> ${reason}</p>
      <p>You may update your payment details and resubmit from your dashboard.</p>
      <a href="${dashboardUrl}" class="btn">Update Payment</a>
      <hr class="divider" />
      <p style="font-size:13px;color:#9CA3AF;">If you believe this is a mistake, please contact the organizing team directly.</p>
    `,
  });
};
