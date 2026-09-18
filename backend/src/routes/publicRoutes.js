/**
 * Public (guest-facing) routes — no authentication required.
 *
 * Routes:
 *  GET  /api/public/events/:slug          — event landing page data
 *  POST /api/public/events/:slug/search   — selfie upload + face matching
 *  GET  /api/public/events/:slug/results/:searchId — fetch cached results
 *  GET  /api/public/events/:slug/photos/:photoId/download — download a photo
 */
const express = require('express');
const router = express.Router();
const crypto = require('crypto');

const { Event, Photo, GuestSearch } = require('../models');
const faceService = require('../services/faceRecognitionService');
const { asyncHandler } = require('../middleware/errorHandler');
const { handleUpload, uploadSelfie } = require('../middleware/uploadMiddleware');
const { selfieSearchLimiter, eventPageLimiter, downloadLimiter } = require('../middleware/rateLimiter');
const {
  sendSuccess,
  sendNotFound,
  sendError,
  sendBadRequest,
} = require('../utils/apiResponse');
const { generateSearchId, isEventExpired } = require('../utils/helpers');
const { deleteFromCloudinary, uploadToCloudinary } = require('../config/cloudinary');
const logger = require('../utils/logger');

// ─── GET /api/public/events/:slug ─────────────────────────────────────────────
router.get(
  '/events/:slug',
  eventPageLimiter,
  asyncHandler(async (req, res) => {
    const { slug } = req.params;

    const event = await Event.findOne({ slug })
      .select('-qrCode.svgString -coverImagePublicId -faceSimilarityThreshold');

    if (!event) return sendNotFound(res, 'Event not found.');

    if (event.status === 'archived') {
      return sendError(res, 'This event has been archived.', 410);
    }

    if (!event.isPublic) {
      return sendError(res, 'This event is private.', 403);
    }

    if (isEventExpired(event.expiresAt)) {
      await Event.findByIdAndUpdate(event._id, { status: 'expired' });
      return sendError(res, 'This event has expired.', 410);
    }

    // Increment QR scan / visitor count (best-effort, no await)
    Event.findByIdAndUpdate(event._id, { $inc: { qrScans: 1 } }).exec();

    // Processing status message for guests
    let processingMessage = null;
    if (event.processingStatus === 'processing') {
      const progress =
        event.photoCount > 0
          ? Math.round((event.processedPhotoCount / event.photoCount) * 100)
          : 0;
      processingMessage = `Photos are still being processed (${progress}% complete). You can search now, but some photos may not appear yet.`;
    }

    return sendSuccess(res, {
      event: event.toPublicJSON(),
      processingMessage,
    });
  })
);

// ─── POST /api/public/events/:slug/search ─────────────────────────────────────
router.post(
  '/events/:slug/search',
  selfieSearchLimiter,
  handleUpload(uploadSelfie),
  asyncHandler(async (req, res) => {
    const { slug } = req.params;
    const startTime = Date.now();

    // ── 1. Validate event ──────────────────────────────────────────────────
    const event = await Event.findOne({ slug });
    if (!event) return sendNotFound(res, 'Event not found.');
    if (!event.isPublic) return sendError(res, 'This event is private.', 403);
    if (isEventExpired(event.expiresAt)) return sendError(res, 'This event has expired.', 410);
    if (event.status !== 'active') return sendError(res, 'This event is not active.', 400);

    // ── 2. Validate consent ────────────────────────────────────────────────
    const consentGiven = req.body.consentGiven === 'true' || req.body.consentGiven === true;
    if (!consentGiven) {
      return sendBadRequest(res, 'You must agree to the privacy terms to search for photos.');
    }

    // ── 3. Validate selfie file ────────────────────────────────────────────
    if (!req.file) {
      return sendBadRequest(res, 'No selfie image provided.');
    }

    const selfieBuffer = req.file.buffer;

    // ── 4. Validate face in selfie ─────────────────────────────────────────
    const validation = await faceService.validateSelfieFace(selfieBuffer);
    if (!validation.valid) {
      return sendBadRequest(res, validation.message);
    }

    // ── 5. Check if event has any processed photos ─────────────────────────
    if (event.processedPhotoCount === 0 && event.photoCount > 0) {
      return sendError(
        res,
        'Photos are still being processed. Please try again in a few minutes.',
        503
      );
    }

    // ── 6. Create search record (pending) ─────────────────────────────────
    const searchId = generateSearchId();
    const ipHash = crypto
      .createHash('sha256')
      .update(req.ip || '')
      .digest('hex');

    const guestSearch = await GuestSearch.create({
      event: event._id,
      searchId,
      status: 'processing',
      consentGiven: true,
      consentTimestamp: new Date(),
      ipHash,
    });

    // ── 7. Run face matching ───────────────────────────────────────────────
    let matches = [];
    let searchStatus = 'completed';
    let errorMessage = null;

    try {
      matches = await faceService.findMatchingFaces(
        selfieBuffer,
        event._id.toString(),
        event.faceSimilarityThreshold || 0.80
      );
    } catch (err) {
      logger.error(`[Search] Face matching error for event ${slug}:`, err.message);
      searchStatus = 'failed';
      errorMessage = 'Face matching failed. Please try again.';
    }

    const processingTimeMs = Date.now() - startTime;

    // ── 8. Deduplicate and limit results ───────────────────────────────────
    const uniqueMatches = matches.slice(0, 500); // cap at 500 results
    const matchedPhotoIds = uniqueMatches.map((m) => m.photoId);
    const matchScores = uniqueMatches.map((m) => m.score);

    // ── 9. Update search record ────────────────────────────────────────────
    await GuestSearch.findByIdAndUpdate(guestSearch._id, {
      status: searchStatus === 'failed' ? 'failed' : (matchedPhotoIds.length > 0 ? 'completed' : 'no_match'),
      matchedPhotoIds,
      matchScores,
      matchCount: matchedPhotoIds.length,
      processingTimeMs,
      selfieProcessed: true,
      selfieDeletedAt: new Date(), // selfie buffer is in memory, never persisted
      errorMessage,
    });

    // ── 10. Update event analytics ─────────────────────────────────────────
    await Event.findByIdAndUpdate(event._id, {
      $inc: {
        totalSearches: 1,
        successfulSearches: matchedPhotoIds.length > 0 ? 1 : 0,
      },
    });

    // ── 11. Update user's global search count ─────────────────────────────
    await require('../models').User.findByIdAndUpdate(event.owner, {
      $inc: { totalSearches: 1 },
    });

    // ── 12. Fetch matching photo data (safe — no embeddings, no internal IDs) ─
    if (searchStatus === 'failed') {
      return sendError(res, errorMessage, 500);
    }

    const photos = await fetchMatchingPhotos(matchedPhotoIds, event.allowDownloads);

    logger.info(
      `[Search] Event ${slug}: found ${matchedPhotoIds.length} matches in ${processingTimeMs}ms`
    );

    return sendSuccess(res, {
      searchId,
      matchCount: matchedPhotoIds.length,
      photos,
      processingTimeMs,
      message:
        matchedPhotoIds.length > 0
          ? `We found ${matchedPhotoIds.length} photo${matchedPhotoIds.length === 1 ? '' : 's'} for you!`
          : "We couldn't find any matching photos. Try another selfie.",
    });
  })
);

// ─── GET /api/public/events/:slug/results/:searchId ───────────────────────────
router.get(
  '/events/:slug/results/:searchId',
  asyncHandler(async (req, res) => {
    const { slug, searchId } = req.params;

    const event = await Event.findOne({ slug }).select('_id allowDownloads');
    if (!event) return sendNotFound(res, 'Event not found.');

    const guestSearch = await GuestSearch.findOne({
      searchId,
      event: event._id,
    }).select('status matchedPhotoIds matchCount processingTimeMs errorMessage createdAt');

    if (!guestSearch) {
      return sendNotFound(res, 'Search results not found or have expired.');
    }

    if (guestSearch.status === 'failed') {
      return sendError(res, guestSearch.errorMessage || 'Search failed.', 500);
    }

    const photos = await fetchMatchingPhotos(
      guestSearch.matchedPhotoIds.map((id) => id.toString()),
      event.allowDownloads
    );

    return sendSuccess(res, {
      searchId,
      status: guestSearch.status,
      matchCount: guestSearch.matchCount,
      photos,
      createdAt: guestSearch.createdAt,
    });
  })
);

// ─── GET /api/public/events/:slug/photos/:photoId/download ────────────────────
router.get(
  '/events/:slug/photos/:photoId/download',
  downloadLimiter,
  asyncHandler(async (req, res) => {
    const { slug, photoId } = req.params;

    const event = await Event.findOne({ slug }).select('_id allowDownloads allowOriginalDownloads status');
    if (!event) return sendNotFound(res, 'Event not found.');

    if (!event.allowDownloads) {
      return sendError(res, 'Downloads are disabled for this event.', 403);
    }

    const photo = await Photo.findOne({ _id: photoId, event: event._id });
    if (!photo) return sendNotFound(res, 'Photo not found.');

    // Increment download count (best-effort)
    Photo.findByIdAndUpdate(photoId, { $inc: { downloadCount: 1 } }).exec();
    Event.findByIdAndUpdate(event._id, { $inc: { totalDownloads: 1 } }).exec();

    const downloadUrl = event.allowOriginalDownloads
      ? photo.originalUrl
      : photo.previewUrl || photo.thumbnailUrl;

    return sendSuccess(res, { downloadUrl });
  })
);

// ─── Helper: fetch safe photo data for matched IDs ────────────────────────────
const fetchMatchingPhotos = async (photoIds, allowDownloads) => {
  if (!photoIds || photoIds.length === 0) return [];

  const photos = await Photo.find({
    _id: { $in: photoIds },
    processingStatus: 'completed',
  }).select('_id thumbnailUrl previewUrl originalUrl width height');

  // Preserve match-score order
  const photoMap = new Map(photos.map((p) => [p._id.toString(), p]));

  return photoIds
    .map((id) => {
      const p = photoMap.get(id.toString());
      if (!p) return null;
      return {
        id: p._id,
        thumbnailUrl: p.thumbnailUrl,
        previewUrl: p.previewUrl || p.thumbnailUrl,
        originalUrl: allowDownloads ? p.originalUrl : undefined,
        width: p.width,
        height: p.height,
      };
    })
    .filter(Boolean);
};

module.exports = router;
