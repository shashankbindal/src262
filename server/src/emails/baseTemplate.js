'use strict';

/**
 * Wraps any email body with a consistent shell matching the site's actual
 * brand palette (forest green / olive — see client/src/index.css) rather
 * than an arbitrary color scheme.
 */
function baseTemplate({ title, preheader = '', body }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="light" />
  <title>${title}</title>
  <style>
    body { margin: 0; padding: 0; background: #EDEFEA; font-family: 'Segoe UI', Roboto, Arial, sans-serif; }
    .wrapper { max-width: 600px; margin: 0 auto; padding: 32px 20px; }
    .card { background: #FFFFFF; border-radius: 16px; border: 1px solid rgba(44,52,36,0.08); overflow: hidden; box-shadow: 0 4px 20px rgba(44,52,36,0.06); }
    .header { background: linear-gradient(135deg, #2C3424, #4C583E); padding: 36px 40px; text-align: center; }
    .header img { height: 48px; width: auto; margin-bottom: 12px; }
    .header h1 { margin: 0; color: #F4F5F2; font-size: 21px; font-weight: 700; letter-spacing: 0.03em; }
    .header p  { margin: 6px 0 0; color: #C7CEC0; font-size: 13px; }
    .body  { padding: 36px 40px; color: #3A4234; line-height: 1.7; font-size: 15px; }
    .body h2   { color: #2C3424; font-size: 19px; margin: 0 0 16px; font-weight: 700; }
    .body p    { margin: 0 0 16px; }
    .btn { display: inline-block; margin: 8px 0 24px; padding: 14px 34px; background: #4C583E; color: #FFFFFF !important; border-radius: 8px; font-weight: 700; font-size: 15px; text-decoration: none; }
    .whatsapp-btn { display: inline-block; margin: 8px 0 24px; padding: 14px 34px; background: #25D366; color: #FFFFFF !important; border-radius: 8px; font-weight: 700; font-size: 15px; text-decoration: none; }
    .divider { border: none; border-top: 1px solid rgba(44,52,36,0.1); margin: 28px 0; }
    .footer { padding: 22px 40px; text-align: center; color: #8A9180; font-size: 12px; background: #F7F8F5; border-top: 1px solid rgba(44,52,36,0.06); }
    .footer p { margin: 3px 0; }
    .footer a { color: #4C583E; text-decoration: none; }
    .tag { display: inline-block; padding: 4px 12px; background: rgba(76,88,62,0.08); color: #4C583E; border-radius: 4px; font-size: 12px; font-weight: 700; letter-spacing: 0.08em; }
  </style>
</head>
<body>
  ${preheader ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${preheader}</div>` : ''}
  <div class="wrapper">
    <div class="card">
      <div class="header">
        <img src="https://www.viplavsrc.com/aiche.png" alt="AIChE" />
        <h1>VIPLAV '26</h1>
        <p>AIChE India Student Regional Conference — RGIPT</p>
      </div>
      <div class="body">${body}</div>
      <div class="footer">
        <p>© 2026 AIChE RGIPT Student Chapter. All rights reserved.</p>
        <p>Rajiv Gandhi Institute of Petroleum Technology, Jais, Uttar Pradesh</p>
        <p><a href="https://www.viplavsrc.com">www.viplavsrc.com</a></p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

module.exports = baseTemplate;
