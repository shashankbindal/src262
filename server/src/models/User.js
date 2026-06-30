'use strict';
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type:     String,
      required: [true, 'Name is required'],
      trim:     true,
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
      type:     String,
      select:   false,
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
    emailVerificationToken: { type: String, select: false },
    emailVerificationExpiry: { type: Date, select: false },

    passwordResetToken:  { type: String, select: false },
    passwordResetExpiry: { type: Date, select: false },

    /* Profile fields */
    college:    { type: String, trim: true, maxlength: 150 },
    department: { type: String, trim: true, maxlength: 100 },
    phone:      {
      type:  String,
      trim:  true,
      match: [/^\+?[0-9\s\-]{7,15}$/, 'Please provide a valid phone number'],
    },
    profilePicture: { type: String, default: '' },

    /* Refresh token hash stored to allow server-side revocation */
    refreshTokenHash: { type: String, select: false },
  },
  { timestamps: true }
);

/* ─── Indexes ─────────────────────────────────────────────────────────────── */
userSchema.index({ email: 1 });
userSchema.index({ googleId: 1 }, { sparse: true });

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
  delete obj.emailVerificationToken;
  delete obj.emailVerificationExpiry;
  delete obj.passwordResetToken;
  delete obj.passwordResetExpiry;
  delete obj.refreshTokenHash;
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
