'use strict';
const mongoose         = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

/**
 * Lifecycle states:
 * registered → waiting_submission → submitted → completed
 *
 * Note: "registered" covers both "no file required" and initial state.
 * If fileUploadRequired, status starts as "waiting_submission".
 */
const STATUS = [
  'registered',
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
      default: 'registered',
    },

    /* SRC ID of the registrant at the time of registration (immutable snapshot) */
    srcId: { type: String, trim: true, default: '' },

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

/* Prevent duplicate registrations for the same event */
registrationSchema.index({ userId: 1, eventId: 1 }, { unique: true });
registrationSchema.index({ eventId: 1, status: 1 });
registrationSchema.index({ teamId: 1 });

registrationSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Registration', registrationSchema);
