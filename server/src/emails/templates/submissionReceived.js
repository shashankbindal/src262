'use strict';
const base = require('../baseTemplate');

module.exports = function submissionReceivedTemplate({ name, eventName, fileName, dashboardUrl }) {
  return base({
    title: `Submission Received — ${eventName}`,
    body:  `
      <h2>Submission Received ✅</h2>
      <p>Hi ${name},</p>
      <p>We have successfully received your submission for <strong>${eventName}</strong>.</p>
      <p><strong>File:</strong> ${fileName}</p>
      <p>Your submission is now <span class="tag">UNDER REVIEW</span>. You can replace your file before the submission deadline.</p>
      <a href="${dashboardUrl}" class="btn">View Submission</a>
    `,
  });
};
