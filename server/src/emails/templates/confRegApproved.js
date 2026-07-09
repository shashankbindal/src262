'use strict';
const base = require('../baseTemplate');

module.exports = function confRegApprovedTemplate({ name, srcId }) {
  return base({
    title: 'Conference Registration Approved — Viplav 2026',
    body:  `
      <h2>You're Approved! 🎉</h2>
      <p>Hi ${name},</p>
      <p>Your conference registration for <strong>AIChE India SRC 2026 (VIPLAV '26)</strong> has been reviewed and approved.</p>
      <div style="text-align:center;margin:32px 0;">
        <div style="display:inline-block;padding:16px 40px;background:rgba(11,93,70,0.12);border:2px solid rgba(11,93,70,0.25);border-radius:12px;">
          <span style="display:block;font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#9CA3AF;margin-bottom:6px;">Your SRC ID</span>
          <span style="font-size:26px;font-weight:700;letter-spacing:4px;color:#F9FAFB;font-family:monospace;">${srcId}</span>
        </div>
      </div>
      <p>Your conference ID card is attached to this email as a PDF — please carry a printed or digital copy with you as your conference pass.</p>
      <p>You can now log in to register for individual events (Chem-E-Car, Chem-E-Jeopardy, paper/poster presentations, and K-12 STEM).</p>
      <hr class="divider" />
      <p style="font-size:13px;color:#9CA3AF;">See you at RGIPT, Jais from 21–23 August 2026!</p>
    `,
  });
};
