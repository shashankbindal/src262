'use strict';
const base = require('../baseTemplate');

module.exports = function submissionApprovedTemplate({ name, eventName, teamName, whatsappGroupLink }) {
  const teamSection = teamName 
    ? `<p>Your team, <strong>${teamName}</strong>, is now fully registered.</p>` 
    : '';

  const whatsappSection = whatsappGroupLink 
    ? `
      <hr class="divider" />
      <p><strong>Join the official WhatsApp group for ${eventName}</strong> to receive announcements, submission updates, schedule changes, and direct support:</p>
      <div style="text-align:center;">
        <a href="${whatsappGroupLink}" class="whatsapp-btn">Join WhatsApp Group →</a>
      </div>
    `
    : '';

  return base({
    title: `Event Registration Confirmed: ${eventName} — Viplav 2026`,
    preheader: `Your registration for ${eventName} is confirmed!`,
    body: `
      <span class="tag">REGISTRATION COMPLETE</span>
      <h2 style="margin-top:16px;">Hello, ${name}! Your event registration is complete. 🎉</h2>
      <p>We are excited to inform you that your submission for <strong>${eventName}</strong> has been reviewed and marked as completed.</p>
      ${teamSection}
      <p>Your registration status is now officially updated to <strong>Completed</strong>.</p>
      ${whatsappSection}
      <hr class="divider" />
      <p style="font-size:13px;color:#8A9180;">Get ready for an exciting event at VIPLAV '26!</p>
    `,
  });
};
