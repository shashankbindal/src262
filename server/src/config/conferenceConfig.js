'use strict';

/**
 * Conference registration settings.
 * Driven by environment variables so the organising team can update
 * fee / UPI details without redeploying frontend code.
 */
module.exports = {
  fee: parseInt(process.env.CONF_FEE || '5500', 10),
  upiId: process.env.CONF_UPI_ID || 'viplav2026@sbi',
  qrVersion: process.env.CONF_QR_VERSION || 'v1',


  yearOfStudyOptions: [
    'First Year',
    'Second Year',
    'Third Year',
    'Fourth Year',
  ],

  genderOptions: ['Male', 'Female', 'Other', 'Prefer not to say'],
};
