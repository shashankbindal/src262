'use strict';
const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema(
  {
    userId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name:    { type: String, required: true },
    email:   { type: String, required: true, lowercase: true },
    college: { type: String, default: '' },
  },
  { _id: false }
);

const teamSchema = new mongoose.Schema(
  {
    eventId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'Event',
      required: true,
    },
    leaderId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
    },
    teamName: {
      type:     String,
      trim:     true,
      maxlength: 80,
    },
    members: [memberSchema],
  },
  { timestamps: true }
);

/* Compound index: a user can only lead one team per event */
teamSchema.index({ eventId: 1, leaderId: 1 }, { unique: true });

module.exports = mongoose.model('Team', teamSchema);
