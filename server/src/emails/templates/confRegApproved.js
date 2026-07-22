'use strict';
const base = require('../baseTemplate');

const WHATSAPP_GROUP_URL = 'https://chat.whatsapp.com/KXApATqIm4rKRQ9ojYjWch';

module.exports = function confRegApprovedTemplate({ name, srcId }) {
  return base({
    title: 'Conference Registration Approved — Viplav 2026',
    preheader: `You're approved! Your SRC ID is ${srcId}`,
    body:  `
      <span class="tag">REGISTRATION APPROVED</span>
      <h2 style="margin-top:16px;">Congratulations, ${name}! Your registration has been approved. 🎉</h2>
      <p>Your conference registration for <strong>AIChE India SRC 2026 (VIPLAV '26)</strong> has been reviewed and approved.</p>
      <div style="text-align:center;margin:32px 0;">
        <div style="display:inline-block;padding:16px 40px;background:rgba(76,88,62,0.08);border:2px solid rgba(76,88,62,0.2);border-radius:12px;">
          <span style="display:block;font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#8A9180;margin-bottom:6px;">Your SRC ID</span>
          <span style="font-size:26px;font-weight:700;letter-spacing:4px;color:#2C3424;font-family:'Courier New',monospace;">${srcId}</span>
        </div>
      </div>
      <p>Your digital conference ID card is attached to this email as a PDF — this is your conference pass. A printed copy is <strong>not</strong> required; simply keep the digital ID on your phone for entry and verification.</p>
      <p>You can now log in to register for individual events (Chem-E-Car, Chem-E-Jeopardy, paper/poster presentations, and K-12 STEM).</p>
      <hr class="divider" />
      <p><strong>Join the official Viplav '26 WhatsApp group</strong> for schedule updates, announcements, and quick support from the organizing team:</p>
      <div style="text-align:center;">
        <a href="${WHATSAPP_GROUP_URL}" class="whatsapp-btn">Join WhatsApp Group →</a>
      </div>
      <hr class="divider" />
      <p style="font-size:13px;color:#8A9180;">See you at RGIPT, Jais from 21–23 August 2026!</p>
    `,
  });
};
