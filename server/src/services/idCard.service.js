'use strict';
const PDFDocument = require('pdfkit');
const logger = require('../utils/logger');

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
 * Generates a conference ID card as a PDF buffer.
 */
async function generateIdCardPdf({ name, srcId, college, photoUrl }) {
  const photoBuffer = await fetchImageBuffer(photoUrl);

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: [340, 500], margin: 0 });
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    /* Background */
    doc.rect(0, 0, 340, 500).fill('#0F1319');

    /* Header band */
    doc.rect(0, 0, 340, 90).fill('#1A2332');
    doc.fillColor('#F5DFB3').fontSize(19).font('Helvetica-Bold')
      .text("VIPLAV '26", 0, 24, { align: 'center', width: 340 });
    doc.fillColor('#9CA3AF').fontSize(9).font('Helvetica')
      .text('AIChE India SRC 2026 — Conference Pass', 0, 52, { align: 'center', width: 340 });

    /* Photo */
    const photoSize = 140;
    const photoX = (340 - photoSize) / 2;
    doc.image(photoBuffer, photoX, 115, { width: photoSize, height: photoSize, fit: [photoSize, photoSize] });
    doc.rect(photoX, 115, photoSize, photoSize).lineWidth(2).stroke('#F5DFB3');

    /* Name */
    doc.fillColor('#F9FAFB').fontSize(16).font('Helvetica-Bold')
      .text(name, 20, 278, { align: 'center', width: 300 });

    /* SRC ID */
    doc.fillColor('#F5DFB3').fontSize(13).font('Helvetica-Bold')
      .text(srcId, 20, 302, { align: 'center', width: 300 });

    /* College */
    if (college) {
      doc.fillColor('#D1D5DB').fontSize(10).font('Helvetica')
        .text(college, 30, 328, { align: 'center', width: 280 });
    }

    /* Footer */
    doc.fillColor('#6B7280').fontSize(8).font('Helvetica')
      .text('Rajiv Gandhi Institute of Petroleum Technology, Jais, Uttar Pradesh', 20, 460, { align: 'center', width: 300 })
      .text('21–23 August 2026', 20, 474, { align: 'center', width: 300 });

    doc.end();
  });
}

module.exports = { generateIdCardPdf };
