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

    /* Admin approval */
    approvalTimestamp: { type: Date },
    approvedBy:        { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    /* SRC ID assigned by admin on approval */
    srcId: {
      type:   String,
      trim:   true,
      sparse: true, // unique but nullable until assigned
    },

    /* Rejection */
    rejectionReason: { type: String, default: '' },

    /* Registration fee snapshot at time of submission */
    registrationFee: { type: Number, default: 0 },

    /* QR version used at submission (for future QR rotation support) */
    qrVersion: { type: String, default: 'v1' },

    /* Reference number shown to user after submission */
    referenceNumber: { type: String, sparse: true },

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
