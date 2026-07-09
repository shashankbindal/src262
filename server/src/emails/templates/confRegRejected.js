'use strict';
const base = require('../baseTemplate');

module.exports = function confRegRejectedTemplate({ name, reason }) {
  return base({
    title: 'Conference Registration — Action Required — Viplav 2026',
    body:  `
      <h2>Registration Needs Attention</h2>
      <p>Hi ${name},</p>
      <p>Your conference registration for <strong>AIChE India SRC 2026 (VIPLAV '26)</strong> could not be approved as submitted.</p>
      <div style="margin:24px 0;padding:16px 20px;background:rgba(214,39,40,0.08);border:1px solid rgba(214,39,40,0.25);border-radius:10px;">
        <span style="display:block;font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#9CA3AF;margin-bottom:6px;">Reason</span>
        <span style="font-size:15px;color:#F9FAFB;">${reason}</span>
      </div>
      <p>Please log in, review the details above, and re-submit your conference registration with the correction.</p>
      <hr class="divider" />
      <p style="font-size:13px;color:#9CA3AF;">If you have questions, reach out to the organizing team via the Contact page.</p>
    `,
  });
};
