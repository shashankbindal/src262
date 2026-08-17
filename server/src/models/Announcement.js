'use strict';
const mongoose         = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const announcementSchema = new mongoose.Schema(
  {
    title: {
      type:      String,
      required:  true,
      trim:      true,
      maxlength: 200,
    },
    content: {
      type:      String,
      required:  true,
      trim:      true,
      maxlength: 5000,
    },
    createdBy: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
    },
    url: {
      type:      String,
      trim:      true,
      maxlength: 500,
    },
    urlLabel: {
      type:      String,
      trim:      true,
      maxlength: 100,
    },
  },
  { timestamps: true }
);

announcementSchema.index({ createdAt: -1 });

announcementSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Announcement', announcementSchema);

