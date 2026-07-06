'use strict';
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type:      String,
      required:  [true, 'Name is required'],
      trim:      true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type:      String,
      required:  [true, 'Email is required'],
      unique:    true,
      lowercase: true,
      trim:      true,
      match:     [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
      type:      String,
      select:    false,
      minlength: [8, 'Password must be at least 8 characters'],
    },
    googleId: {
      type:   String,
      sparse: true,
    },
    role: {
      type:    String,
      enum:    ['user', 'admin'],
      default: 'user',
    },
    isEmailVerified: {
      type:    Boolean,
      default: false,
    },

    /* OTP-based email verification */
    otpHash:             { type: String, select: false },
    otpExpiry:           { type: Date,   select: false },
    otpAttempts:         { type: Number, default: 0, select: false },
    otpResendCount:      { type: Number, default: 0, select: false },
    otpResendWindowStart:{ type: Date,   select: false },

    /* Password reset */
    passwordResetToken:  { type: String, select: false },
    passwordResetExpiry: { type: Date,   select: false },

    /* Profile fields — basic */
    college:    { type: String, trim: true, maxlength: 150 }, // institute name
    department: { type: String, trim: true, maxlength: 100 },
    phone: {
      type:  String,
      trim:  true,
      match: [/^[0-9]{10}$/, 'Phone must be exactly 10 digits'],
    },
    profilePicture: { type: String, default: '' },

    /* Extended profile — collected during conference registration */
    dateOfBirth: { type: Date },
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Other', 'Prefer not to say'],
    },
    course:      { type: String, trim: true, maxlength: 150 }, // programme name
    yearOfStudy: {
      type: String,
      enum: ['First Year', 'Second Year', 'Third Year', 'Fourth Year'],
    },

    /* Identity — never returned by default */
    aadhaarNumber: { type: String, select: false },

    /* Required membership (for conference) */
    aicheId: { type: String, trim: true, maxlength: 50, default: '' },

    /* Address */
    city:    { type: String, trim: true, maxlength: 100, default: '' },
    state:   { type: String, trim: true, maxlength: 100, default: '' },
    country: { type: String, trim: true, maxlength: 100, default: 'India' },

    /* University ID card stored in storage */
    universityIdCardUrl: { type: String, default: '' },
    universityIdCardKey: { type: String, default: '' },

    /* Refresh token hash stored to allow server-side revocation */
    refreshTokenHash: { type: String, select: false },
  },
  { timestamps: true }
);

/* ─── Hooks ───────────────────────────────────────────────────────────────── */
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

/* ─── Methods ─────────────────────────────────────────────────────────────── */
userSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.otpHash;
  delete obj.otpExpiry;
  delete obj.otpAttempts;
  delete obj.otpResendCount;
  delete obj.otpResendWindowStart;
  delete obj.passwordResetToken;
  delete obj.passwordResetExpiry;
  delete obj.refreshTokenHash;
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
