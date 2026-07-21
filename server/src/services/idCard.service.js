'use strict';
const fs   = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const QRCode      = require('qrcode');
const logger      = require('../utils/logger');

/* The ID-card template (591 × 1004 px). All overlay coordinates below are in
 * template pixels with a top-left origin; the PDF page is created at the same
 * pixel dimensions so 1pt === 1px and coordinates map 1:1 onto the artwork. */
const TEMPLATE_PATH = path.join(__dirname, '../assets/idcard.png');
const CARD_W = 591;
const CARD_H = 1004;

/* Where each dynamic element sits on the template. The template already prints
 * the "SRC ID:" and "INSTITUTE NAME:" labels, so only the values are drawn —
 * positioned just after each printed label. If the artwork changes, adjust
 * these constants only. */
const LAYOUT = {
  photo:     { cx: 294, cy: 288, r: 156 },
  name:      { y: 478, size: 50, color: '#E6CFA7' },
  qr:        { x: 392, y: 556, size: 156 },
  srcId:     { x: 208, y: 748, size: 30, color: '#E6CFA7' },
  institute: { x: 224, y: 806, w: 352, size: 15, color: '#E6CFA7' },
};

/* What the QR encodes — a verification URL keyed by SRC ID, so the code on the
 * pass can be scanned to confirm the registration is genuine. */
const VERIFY_BASE_URL = process.env.ID_CARD_VERIFY_URL || 'https://viplavsrc.com/verify';

/* Template is read once and reused for every card. */
let templateBuffer = null;
function getTemplate() {
  if (!templateBuffer) templateBuffer = fs.readFileSync(TEMPLATE_PATH);
  return templateBuffer;
}

/**
 * Forces Cloudinary to deliver the image as a JPEG regardless of the stored
 * format — pdfkit only embeds JPEG/PNG, and uploaded photos may be WebP.
 */
function toEmbeddableUrl(cloudinaryUrl) {
  return cloudinaryUrl.replace('/upload/', '/upload/f_jpg,q_auto/');
}

async function fetchImageBuffer(url) {
  const res = await fetch(toEmbeddableUrl(url));
  if (!res.ok) throw new Error(`Failed to fetch photo: HTTP ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

/**
 * Generates the conference ID card as a PDF buffer: the branded template with
 * the participant's photo, name, SRC ID, institute and a verification QR code
 * composited on top.
 */
async function generateIdCardPdf({ name, srcId, college, photoUrl }) {
  const [photoBuffer, qrBuffer] = await Promise.all([
    fetchImageBuffer(photoUrl),
    QRCode.toBuffer(`${VERIFY_BASE_URL}/${encodeURIComponent(srcId || '')}`, {
      margin: 1,
      width: 320,
      color: { dark: '#1A2332', light: '#FFFFFF' },
    }),
  ]);

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: [CARD_W, CARD_H], margin: 0 });
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    /* Branded background */
    doc.image(getTemplate(), 0, 0, { width: CARD_W, height: CARD_H });

    /* Participant photo — cover-fit into the circular window, then framed */
    const p = LAYOUT.photo;
    doc.save();
    doc.circle(p.cx, p.cy, p.r).clip();
    doc.image(photoBuffer, p.cx - p.r, p.cy - p.r, {
      cover: [p.r * 2, p.r * 2],
      align: 'center',
      valign: 'center',
    });
    doc.restore();
    doc.circle(p.cx, p.cy, p.r).lineWidth(4).stroke('#E6CFA7');

    /* Name */
    doc.fillColor(LAYOUT.name.color).font('Helvetica-Bold').fontSize(LAYOUT.name.size)
      .text(name || '', 0, LAYOUT.name.y, { align: 'center', width: CARD_W, lineBreak: false });

    /* Verification QR — white backing so it stays scannable on any artwork */
    const q = LAYOUT.qr;
    doc.rect(q.x - 6, q.y - 6, q.size + 12, q.size + 12).fill('#FFFFFF');
    doc.image(qrBuffer, q.x, q.y, { width: q.size, height: q.size });

    /* SRC ID value (the "SRC ID:" label is printed on the template) */
    doc.fillColor(LAYOUT.srcId.color).font('Helvetica-Bold').fontSize(LAYOUT.srcId.size)
      .text(srcId || '', LAYOUT.srcId.x, LAYOUT.srcId.y, { lineBreak: false });

    /* Institute value — flows after the printed "INSTITUTE NAME:" label,
     * wrapping onto further lines if long */
    if (college) {
      const i = LAYOUT.institute;
      doc.fillColor(i.color).font('Helvetica-Bold').fontSize(i.size)
        .text(college, i.x, i.y, { width: i.w });
    }

    doc.end();
  });
}

module.exports = { generateIdCardPdf };
