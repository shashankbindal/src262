'use strict';
const base = require('../baseTemplate');

module.exports = function confRegRejectedTemplate({ name, reason }) {
  return base({
    title: 'Conference Registration — Action Required — Viplav 2026',
    preheader: 'Your conference registration needs a correction',
    body:  `
      <span class="tag" style="background:rgba(178,58,46,0.1);color:#B23A2E;">ACTION REQUIRED</span>
      <h2 style="margin-top:16px;">Your registration needs attention</h2>
      <p>Hi ${name},</p>
      <p>Your conference registration for <strong>AIChE India SRC 2026 (VIPLAV '26)</strong> could not be approved as submitted.</p>
      <div style="margin:24px 0;padding:16px 20px;background:rgba(178,58,46,0.06);border:1px solid rgba(178,58,46,0.2);border-radius:10px;">
        <span style="display:block;font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#8A9180;margin-bottom:6px;">Reason</span>
        <span style="font-size:15px;color:#2C3424;">${reason}</span>
      </div>
      <p>Please log in, review the details above, and re-submit your conference registration with the correction.</p>
      <a href="https://www.viplavsrc.com/conference-registration" class="btn">Re-submit Registration</a>
      <hr class="divider" />
      <p style="font-size:13px;color:#8A9180;">If you have questions, reach out to the organizing team via the Contact page.</p>
    `,
  });
};
