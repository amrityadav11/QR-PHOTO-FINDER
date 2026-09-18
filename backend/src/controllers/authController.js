const { User } = require('../models');
const { generateToken } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const {
  sendSuccess,
  sendCreated,
  sendError,
  sendUnauthorized,
  sendBadRequest,
} = require('../utils/apiResponse');
const { uploadToCloudinary, deleteFromCloudinary } = require('../config/cloudinary');
const logger = require('../utils/logger');

// ─── POST /api/auth/register ──────────────────────────────────────────────────
const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const existing = await User.findOne({ email });
  if (existing) {
    return sendError(res, 'An account with this email already exists.', 409);
  }

  const user = await User.create({ name, email, password });
  const token = generateToken(user._id, user.role);

  logger.info(`New user registered: ${email}`);

  return sendCreated(res, {
    token,
    user: user.toPublicJSON(),
  }, 'Account created successfully');
});

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Explicitly select password (it's excluded by default)
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    // Use same message to prevent email enumeration
    return sendUnauthorized(res, 'Invalid email or password.');
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return sendUnauthorized(res, 'Invalid email or password.');
  }

  if (!user.isActive) {
    return sendError(res, 'Your account has been deactivated. Contact support.', 403);
  }

  // Update last login
  user.lastLoginAt = new Date();
  await user.save({ validateBeforeSave: false });

  const token = generateToken(user._id, user.role);

  logger.info(`User logged in: ${email}`);

  return sendSuccess(res, {
    token,
    user: user.toPublicJSON(),
  }, 'Login successful');
});

// ─── POST /api/auth/logout ────────────────────────────────────────────────────
// JWT is stateless — logout is handled client-side by discarding the token.
// This endpoint exists for logging and future token blacklist support.
const logout = asyncHandler(async (req, res) => {
  logger.info(`User logged out: ${req.user.email}`);
  return sendSuccess(res, {}, 'Logged out successfully');
});

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) return sendUnauthorized(res, 'User not found.');
  return sendSuccess(res, { user: user.toPublicJSON() });
});

// ─── PUT /api/auth/me ─────────────────────────────────────────────────────────
const updateMe = asyncHandler(async (req, res) => {
  const allowedFields = ['name'];
  const updates = {};
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  });

  // Handle profile image upload
  if (req.file) {
    try {
      const result = await uploadToCloudinary(req.file.buffer, {
        folder: 'qr-photo-finder/profiles',
        transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'face' }],
      });

      // Delete old profile image
      if (req.user.profileImagePublicId) {
        await deleteFromCloudinary(req.user.profileImagePublicId).catch(() => {});
      }

      updates.profileImage = result.secure_url;
      updates.profileImagePublicId = result.public_id;
    } catch (err) {
      logger.error('Profile image upload failed:', err);
      return sendError(res, 'Profile image upload failed.', 500);
    }
  }

  const user = await User.findByIdAndUpdate(req.user._id, updates, {
    new: true,
    runValidators: true,
  });

  return sendSuccess(res, { user: user.toPublicJSON() }, 'Profile updated');
});

// ─── PUT /api/auth/change-password ───────────────────────────────────────────
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return sendBadRequest(res, 'Current and new passwords are required.');
  }
  if (newPassword.length < 8) {
    return sendBadRequest(res, 'New password must be at least 8 characters.');
  }

  const user = await User.findById(req.user._id).select('+password');
  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    return sendUnauthorized(res, 'Current password is incorrect.');
  }

  user.password = newPassword;
  await user.save();

  return sendSuccess(res, {}, 'Password changed successfully');
});

module.exports = { register, login, logout, getMe, updateMe, changePassword };
