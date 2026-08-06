'use strict';

/**
 * Conference registration settings.
 * Driven by environment variables so the organising team can update
 * fee / UPI details without redeploying frontend code.
 */
module.exports = {
  /* Conference registration only */
  feeBase: parseInt(process.env.CONF_FEE_BASE || '3000', 10),
  /* Conference registration + fooding (no accommodation) */
  feeFooding: parseInt(process.env.CONF_FEE_FOODING || '5000', 10),
  /* Conference registration + accommodation & fooding */
  feeWithAccommodation: parseInt(process.env.CONF_FEE_WITH_ACCOMMODATION || '5500', 10),
  /* RGIPT Events Only */
  feeRgiptEvents: parseInt(process.env.CONF_FEE_RGIPT_EVENTS || '500', 10),
  /* RGIPT Events + Registration Kit */
  feeRgiptKit: parseInt(process.env.CONF_FEE_RGIPT_KIT || '1500', 10),
  /* RGIPT Events + Kit + Fooding */
  feeRgiptFooding: parseInt(process.env.CONF_FEE_RGIPT_FOODING || '3500', 10),
  upiId: process.env.CONF_UPI_ID || 'rgiptjais@sbi',
  qrVersion: process.env.CONF_QR_VERSION || 'v1',


  yearOfStudyOptions: [
    'First Year',
    'Second Year',
    'Third Year',
    'Fourth Year',
  ],

  genderOptions: ['Male', 'Female', 'Other', 'Prefer not to say'],
};
