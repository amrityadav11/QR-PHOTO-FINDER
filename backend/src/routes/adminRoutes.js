const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const { adminLimiter } = require('../middleware/rateLimiter');
const { User, Event, Photo, GuestSearch } = require('../models');
const { sendSuccess, sendNotFound } = require('../utils/apiResponse');

// All admin routes require auth + admin role
router.use(protect, restrictTo('admin'), adminLimiter);

// GET /api/admin/stats — system-wide stats
router.get('/stats', asyncHandler(async (req, res) => {
  const [users, events, photos, searches] = await Promise.all([
    User.countDocuments(),
    Event.countDocuments(),
    Photo.countDocuments(),
    GuestSearch.countDocuments(),
  ]);

  const activeUsers = await User.countDocuments({ isActive: true });
  const activeEvents = await Event.countDocuments({ status: 'active' });
  const failedPhotos = await Photo.countDocuments({ processingStatus: 'failed' });

  return sendSuccess(res, {
    stats: {
      totalUsers: users,
      activeUsers,
      totalEvents: events,
      activeEvents,
      totalPhotos: photos,
      totalSearches: searches,
      failedPhotos,
    },
  });
}));

// GET /api/admin/users — list users
router.get('/users', asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = Math.min(parseInt(req.query.limit) || 20, 100);

  const [users, total] = await Promise.all([
    User.find()
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select('-password -passwordResetToken -passwordResetExpires'),
    User.countDocuments(),
  ]);

  return sendSuccess(res, { users, total, page, limit });
}));

// PATCH /api/admin/users/:id/toggle-active — enable/disable user
router.patch('/users/:id/toggle-active', asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return sendNotFound(res, 'User not found');
  if (user.role === 'admin') {
    return require('../utils/apiResponse').sendForbidden(res, 'Cannot deactivate admin accounts');
  }
  user.isActive = !user.isActive;
  await user.save({ validateBeforeSave: false });
  return sendSuccess(res, { isActive: user.isActive }, `User ${user.isActive ? 'activated' : 'deactivated'}`);
}));

// GET /api/admin/events — list all events
router.get('/events', asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = Math.min(parseInt(req.query.limit) || 20, 100);

  const [events, total] = await Promise.all([
    Event.find()
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('owner', 'name email'),
    Event.countDocuments(),
  ]);

  return sendSuccess(res, { events, total, page, limit });
}));

// DELETE /api/admin/events/:id — force delete any event
router.delete('/events/:id', asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) return sendNotFound(res, 'Event not found');

  await Promise.all([
    Photo.deleteMany({ event: event._id }),
    require('../models').FaceEmbedding.deleteMany({ event: event._id }),
    GuestSearch.deleteMany({ event: event._id }),
    event.deleteOne(),
  ]);

  return sendSuccess(res, {}, 'Event deleted by admin');
}));

module.exports = router;
