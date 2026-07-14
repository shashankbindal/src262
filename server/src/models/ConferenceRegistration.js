'use strict';
const mongoose         = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const STATUS = ['pending', 'approved', 'rejected'];

const conferenceRegistrationSchema = new mongoose.Schema(
  {
    userId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
      unique:   true, // one conference registration per user
    },
    status: {
      type:    String,
      enum:    STATUS,
      default: 'pending',
    },

    /* Payment proof */
    paymentScreenshotUrl: { type: String, default: '' },
    paymentScreenshotKey: { type: String, default: '' },
    transactionId:        { type: String, trim: true, default: '' },
    paymentTimestamp:     { type: Date },

    /* Passport-style photo used on the generated conference ID card */
    photoUrl: { type: String, default: '' },
    photoKey: { type: String, default: '' },

    /* Which registration tier was purchased — determines the fee.
     * 'base': registration only. 'fooding': registration + fooding.
     * 'accommodation': registration + accommodation & fooding. */
    registrationTier: {
      type: String,
      enum: ['base', 'fooding', 'accommodation'],
      default: 'base',
    },
    /* Kept in sync with registrationTier (true only for 'accommodation') —
     * older code/exports read this boolean directly. */
    needsAccommodation: { type: Boolean, default: false },

    /* Admin approval */
    approvalTimestamp: { type: Date },
    approvedBy:        { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    /* SRC ID assigned by admin on approval — unique index defined below */
    srcId: {
      type: String,
      trim: true,
    },

    /* Rejection */
    rejectionReason: { type: String, default: '' },

    /* Registration fee snapshot at time of submission */
    registrationFee: { type: Number, default: 0 },

    /* QR version used at submission (for future QR rotation support) */
    qrVersion: { type: String, default: 'v1' },

    /* Reference number shown to user after submission — unique index defined below */
    referenceNumber: { type: String },

    /* Lock: once approved, payment details cannot be changed */
    isLocked: { type: Boolean, default: false },
  },
  { timestamps: true }
);

/* SRC IDs must be globally unique */
conferenceRegistrationSchema.index({ srcId: 1 }, { unique: true, sparse: true });
conferenceRegistrationSchema.index({ referenceNumber: 1 }, { unique: true, sparse: true });
conferenceRegistrationSchema.index({ status: 1 });

conferenceRegistrationSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('ConferenceRegistration', conferenceRegistrationSchema);
