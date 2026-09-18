const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false, // Never return password in queries
    },
    role: {
      type: String,
      enum: ['photographer', 'admin'],
      default: 'photographer',
    },
    profileImage: {
      type: String,
      default: null,
    },
    profileImagePublicId: {
      type: String,
      default: null,
      select: false, // Internal use only
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    // Plan/subscription
    plan: {
      type: String,
      enum: ['free', 'starter', 'pro', 'business'],
      default: 'free',
    },
    planLimits: {
      maxPhotosPerEvent: { type: Number, default: 100 },
      maxEvents: { type: Number, default: 5 },
      allowFaceMatching: { type: Boolean, default: false },
      allowDownloads: { type: Boolean, default: true },
      allowHDDownloads: { type: Boolean, default: false },
    },
    // Stats
    totalEvents: { type: Number, default: 0 },
    totalPhotos: { type: Number, default: 0 },
    totalSearches: { type: Number, default: 0 },
    storageUsedBytes: { type: Number, default: 0 },
    // Password reset
    passwordResetToken: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },
    lastLoginAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });

// ─── Pre-save: hash password ──────────────────────────────────────────────────
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// ─── Method: compare password ─────────────────────────────────────────────────
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// ─── Method: safe public profile ─────────────────────────────────────────────
userSchema.methods.toPublicJSON = function () {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    role: this.role,
    profileImage: this.profileImage,
    plan: this.plan,
    planLimits: this.planLimits,
    totalEvents: this.totalEvents,
    totalPhotos: this.totalPhotos,
    createdAt: this.createdAt,
  };
};

module.exports = mongoose.model('User', userSchema);
