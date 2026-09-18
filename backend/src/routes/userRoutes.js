const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const { User, Event, Photo } = require('../models');
const { sendSuccess, sendNotFound } = require('../utils/apiResponse');

// GET /api/users/stats — photographer's own stats
router.get('/stats', protect, asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const [eventCount, photoCount] = await Promise.all([
    Event.countDocuments({ owner: userId }),
    Photo.countDocuments({ owner: userId }),
  ]);
  return sendSuccess(res, {
    stats: {
      totalEvents: eventCount,
      totalPhotos: photoCount,
      totalSearches: req.user.totalSearches,
      storageUsedBytes: req.user.storageUsedBytes,
    },
  });
}));

// GET /api/users/profile — own profile
router.get('/profile', protect, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) return sendNotFound(res, 'User not found');
  return sendSuccess(res, { user: user.toPublicJSON() });
}));

module.exports = router;
