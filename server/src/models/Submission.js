'use strict';
const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema(
  {
    registrationId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'Registration',
      required: true,
      unique:   true,   // one submission record per registration
    },
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
    fileUrl:      { type: String, required: true },
    fileKey:      { type: String, required: true },  // S3 object key for deletion/replacement
    fileName:     { type: String, required: true },
    fileMimeType: { type: String, required: true },
    fileSizeBytes: { type: Number, required: true },
    status: {
      type:    String,
      enum:    ['submitted', 'under_review', 'completed'],
      default: 'submitted',
    },
    /* Admin notes */
    reviewNotes: { type: String, default: '' },
  },
  { timestamps: true }
);

submissionSchema.index({ eventId: 1, status: 1 });
submissionSchema.index({ userId: 1 });

module.exports = mongoose.model('Submission', submissionSchema);
