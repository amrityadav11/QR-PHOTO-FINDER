const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const { Event, Photo, GuestSearch } = require('../models');
const { sendSuccess } = require('../utils/apiResponse');

// GET /api/analytics/dashboard — photographer's overall dashboard stats
router.get('/dashboard', protect, asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const [
    totalEvents,
    totalPhotos,
    activeEvents,
    searchAgg,
  ] = await Promise.all([
    Event.countDocuments({ owner: userId }),
    Photo.countDocuments({ owner: userId }),
    Event.countDocuments({ owner: userId, status: 'active' }),
    Event.aggregate([
      { $match: { owner: userId } },
      {
        $group: {
          _id: null,
          totalSearches: { $sum: '$totalSearches' },
          successfulSearches: { $sum: '$successfulSearches' },
          totalDownloads: { $sum: '$totalDownloads' },
          totalViews: { $sum: '$totalViews' },
          qrScans: { $sum: '$qrScans' },
        },
      },
    ]),
  ]);

  const agg = searchAgg[0] || {};

  return sendSuccess(res, {
    stats: {
      totalEvents,
      activeEvents,
      totalPhotos,
      totalSearches: agg.totalSearches || 0,
      successfulSearches: agg.successfulSearches || 0,
      totalDownloads: agg.totalDownloads || 0,
      totalViews: agg.totalViews || 0,
      qrScans: agg.qrScans || 0,
    },
  });
}));

// GET /api/analytics/events/:id — per-event analytics
router.get('/events/:id', protect, asyncHandler(async (req, res) => {
  const event = await Event.findOne({ _id: req.params.id, owner: req.user._id });
  if (!event) {
    return require('../utils/apiResponse').sendNotFound(res, 'Event not found');
  }

  // Recent searches (last 30 days)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const recentSearches = await GuestSearch.aggregate([
    {
      $match: {
        event: event._id,
        createdAt: { $gte: thirtyDaysAgo },
        status: 'completed',
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        count: { $sum: 1 },
        matches: { $sum: '$matchCount' },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  return sendSuccess(res, {
    analytics: {
      eventId: event._id,
      eventName: event.name,
      qrScans: event.qrScans,
      uniqueVisitors: event.uniqueVisitors,
      totalSearches: event.totalSearches,
      successfulSearches: event.successfulSearches,
      totalViews: event.totalViews,
      totalDownloads: event.totalDownloads,
      photoCount: event.photoCount,
      processedPhotoCount: event.processedPhotoCount,
      faceCount: event.faceCount,
      processingStatus: event.processingStatus,
      recentSearches,
    },
  });
}));

module.exports = router;
