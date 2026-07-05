'use strict';
const User     = require('../models/User');
const ApiError = require('../utils/ApiError');

const ALLOWED_UPDATE_FIELDS = [
  'name', 'college', 'department', 'phone',
  'dateOfBirth', 'gender', 'course', 'yearOfStudy',
  'aicheId', 'city', 'state', 'country',
];

async function getProfile(userId) {
  const user = await User.findById(userId).lean();
  if (!user) throw ApiError.notFound('User not found');
  return user;
}

async function updateProfile(userId, body) {
  /* Whitelist — never allow role or email changes here */
  const update = {};
  for (const field of ALLOWED_UPDATE_FIELDS) {
    if (body[field] !== undefined) update[field] = body[field];
  }

  if (Object.keys(update).length === 0) {
    throw ApiError.badRequest('No valid fields provided for update');
  }

  const user = await User.findByIdAndUpdate(
    userId,
    { $set: update },
    { new: true, runValidators: true }
  ).lean();

  if (!user) throw ApiError.notFound('User not found');
  return user;
}

module.exports = { getProfile, updateProfile };
