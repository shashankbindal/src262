'use strict';
const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema(
  {
    name: {
      type:     String,
      required: true,
      trim:     true,
      unique:   true,
    },
    slug: {
      type:      String,
      required:  true,
      unique:    true,
      lowercase: true,
      trim:      true,
    },
    description: { type: String, trim: true, default: '' },
    type: {
      type:     String,
      enum:     ['solo', 'team'],
      required: true,
    },
    registrationDeadline: {
      type:     Date,
      required: true,
    },
    submissionDeadline: {
      type: Date,
    },
    fileUploadRequired: {
      type:    Boolean,
      default: false,
    },
    allowedFileTypes: {
      type:    [String],
      default: ['application/pdf'],
    },
    maxFileSizeMB: {
      type:    Number,
      default: 10,
    },
    minTeamSize: {
      type: Number,
      min:  1,
    },
    maxTeamSize: {
      type: Number,
      min:  1,
    },
    registrationEnabled: {
      type:    Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

eventSchema.index({ slug: 1 });

module.exports = mongoose.model('Event', eventSchema);
