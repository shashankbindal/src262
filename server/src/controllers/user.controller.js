'use strict';
const asyncHandler  = require('../utils/asyncHandler');
const ApiResponse   = require('../utils/ApiResponse');
const userService   = require('../services/user.service');

const getProfile = asyncHandler(async (req, res) => {
  const user = await userService.getProfile(req.user._id);
  ApiResponse.ok(res, 'Profile fetched', user);
});

const updateProfile = asyncHandler(async (req, res) => {
  const user = await userService.updateProfile(req.user._id, req.body);
  ApiResponse.ok(res, 'Profile updated', user);
});

module.exports = { getProfile, updateProfile };
