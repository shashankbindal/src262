'use strict';

/**
 * Wraps any email body with a consistent branded shell.
 */
function baseTemplate({ title, body }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <style>
    body { margin: 0; padding: 0; background: #0F1319; font-family: 'Segoe UI', Arial, sans-serif; }
    .wrapper { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
    .card { background: #171E27; border-radius: 16px; border: 1px solid rgba(255,255,255,0.08); overflow: hidden; }
    .header { background: linear-gradient(135deg, #1a2332, #0F1319); padding: 32px 40px; border-bottom: 1px solid rgba(255,255,255,0.08); }
    .header h1 { margin: 0; color: #F5DFB3; font-size: 22px; font-weight: 600; letter-spacing: 0.02em; }
    .header p  { margin: 6px 0 0; color: #9CA3AF; font-size: 13px; }
    .body  { padding: 36px 40px; color: #D1D5DB; line-height: 1.7; font-size: 15px; }
    .body h2   { color: #F9FAFB; font-size: 18px; margin-top: 0; }
    .body p    { margin: 0 0 16px; }
    .btn { display: inline-block; margin: 8px 0 24px; padding: 14px 32px; background: #F5DFB3; color: #0F1319; border-radius: 8px; font-weight: 700; font-size: 15px; text-decoration: none; }
    .divider { border: none; border-top: 1px solid rgba(255,255,255,0.08); margin: 28px 0; }
    .footer { padding: 20px 40px; text-align: center; color: #6B7280; font-size: 12px; }
    .tag { display: inline-block; padding: 4px 12px; background: rgba(245,223,179,0.1); color: #F5DFB3; border-radius: 4px; font-size: 12px; font-weight: 600; letter-spacing: 0.08em; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card">
      <div class="header">
        <h1>Viplav '26</h1>
        <p>AIChE India SRC 2026 — RGIPT</p>
      </div>
      <div class="body">${body}</div>
      <div class="footer">
        <p>© 2026 AIChE RGIPT Student Chapter. All rights reserved.</p>
        <p>Rajiv Gandhi Institute of Petroleum Technology, Jais, Uttar Pradesh</p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

module.exports = baseTemplate;
