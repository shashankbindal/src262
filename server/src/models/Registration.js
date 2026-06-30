'use strict';
const mongoose       = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

/**
 * Lifecycle states (linear progression):
 *
 * pending_payment → payment_submitted → payment_approved
 *                                    ↘ payment_rejected (can re-submit)
 * payment_approved → waiting_submission → submitted → completed
 */
const STATUS = [
  'pending_payment',
  'payment_submitted',
  'payment_approved',
  'payment_rejected',
  'waiting_submission',
  'submitted',
  'completed',
];

const registrationSchema = new mongoose.Schema(
  {
    userId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
    },
    eventId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'Event',
      required: true,
    },
    /* Populated only for team events */
    teamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref:  'Team',
    },
    status: {
      type:    String,
      enum:    STATUS,
      default: 'pending_payment',
    },
    /* Payment proof */
    paymentScreenshotUrl: { type: String, default: '' },
    paymentScreenshotKey: { type: String, default: '' }, // S3 object key for deletion
    transactionId:        { type: String, trim: true, default: '' },

    /* Admin rejection reason */
    paymentRejectedReason: { type: String, default: '' },

    /* Once approved, details are locked */
    isLocked: { type: Boolean, default: false },

    /* Snapshot of registrant info at time of registration */
    participantSnapshot: {
      name:    String,
      email:   String,
      college: String,
      phone:   String,
    },
  },
  { timestamps: true }
);

/* Prevent duplicate solo registrations */
registrationSchema.index({ userId: 1, eventId: 1 }, { unique: true });
registrationSchema.index({ eventId: 1, status: 1 });
registrationSchema.index({ teamId: 1 });

registrationSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Registration', registrationSchema);
