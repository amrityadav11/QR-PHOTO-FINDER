const QRCode = require('qrcode');
const { Event, Photo, FaceEmbedding, GuestSearch } = require('../models');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const {
  sendSuccess,
  sendCreated,
  sendNotFound,
  sendError,
  sendPaginated,
} = require('../utils/apiResponse');
const {
  generateSlug,
  buildPagination,
  isEventExpired,
} = require('../utils/helpers');
const {
  uploadToCloudinary,
  deleteFromCloudinary,
  deleteCloudinaryFolder,
} = require('../config/cloudinary');
const logger = require('../utils/logger');

// ─── Helper: generate QR code data ───────────────────────────────────────────
const generateQRData = async (eventUrl) => {
  const [dataUrl, svgString] = await Promise.all([
    QRCode.toDataURL(eventUrl, {
      width: 400,
      margin: 2,
      color: { dark: '#1a1a2e', light: '#ffffff' },
      errorCorrectionLevel: 'H',
    }),
    QRCode.toString(eventUrl, {
      type: 'svg',
      width: 400,
      margin: 2,
      color: { dark: '#1a1a2e', light: '#ffffff' },
      errorCorrectionLevel: 'H',
    }),
  ]);
  return { dataUrl, svgString };
};

// ─── POST /api/events ─────────────────────────────────────────────────────────
const createEvent = asyncHandler(async (req, res) => {
  const {
    name, type, date, location, description,
    expiresAt, allowDownloads, allowOriginalDownloads,
    watermarkEnabled, watermarkText, isPublic,
    requireConsent, selfieRetentionHours,
    faceSimilarityThreshold,
  } = req.body;

  // Generate unique slug
  const baseSlug = generateSlug(name, Date.now().toString(36));
  let slug = baseSlug;
  let attempt = 0;
  while (await Event.findOne({ slug })) {
    attempt++;
    slug = `${baseSlug}-${attempt}`;
  }

  const domain = process.env.APP_DOMAIN || 'http://localhost:3000';
  const eventUrl = `${domain}/e/${slug}`;

  // Generate QR code
  const { dataUrl, svgString } = await generateQRData(eventUrl);

  // Handle cover image
  let coverImage = null;
  let coverImagePublicId = null;
  if (req.file) {
    try {
      const result = await uploadToCloudinary(req.file.buffer, {
        folder: `qr-photo-finder/events/${slug}/cover`,
        transformation: [{ width: 1200, height: 600, crop: 'fill' }],
      });
      coverImage = result.secure_url;
      coverImagePublicId = result.public_id;
    } catch (err) {
      logger.error('Cover image upload failed:', err);
    }
  }

  const event = await Event.create({
    owner: req.user._id,
    name,
    slug,
    type,
    date,
    location,
    description,
    coverImage,
    coverImagePublicId,
    qrCode: { dataUrl, svgString, publicUrl: eventUrl },
    expiresAt: expiresAt || null,
    allowDownloads: allowDownloads !== undefined ? allowDownloads : true,
    allowOriginalDownloads: allowOriginalDownloads !== undefined ? allowOriginalDownloads : false,
    watermarkEnabled: watermarkEnabled !== undefined ? watermarkEnabled : false,
    watermarkText: watermarkText || '',
    isPublic: isPublic !== undefined ? isPublic : true,
    requireConsent: requireConsent !== undefined ? requireConsent : true,
    selfieRetentionHours: selfieRetentionHours || 0,
    faceSimilarityThreshold: faceSimilarityThreshold || 0.80,
  });

  // Increment user event count
  await require('../models').User.findByIdAndUpdate(req.user._id, {
    $inc: { totalEvents: 1 },
  });

  logger.info(`Event created: ${slug} by user ${req.user._id}`);

  return sendCreated(res, { event }, 'Event created successfully');
});

// ─── GET /api/events ──────────────────────────────────────────────────────────
const getEvents = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = Math.min(parseInt(req.query.limit) || 10, 50);
  const status = req.query.status;
  const type = req.query.type;

  const filter = { owner: req.user._id };
  if (status) filter.status = status;
  if (type) filter.type = type;

  const [events, total] = await Promise.all([
    Event.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select('-qrCode.svgString -coverImagePublicId'), // trim response
    Event.countDocuments(filter),
  ]);

  return sendPaginated(res, events, buildPagination(total, page, limit));
});

// ─── GET /api/events/:id ──────────────────────────────────────────────────────
const getEvent = asyncHandler(async (req, res) => {
  const event = req.event; // set by requireEventOwnership middleware
  return sendSuccess(res, { event });
});

// ─── PUT /api/events/:id ──────────────────────────────────────────────────────
const updateEvent = asyncHandler(async (req, res) => {
  const event = req.event;

  const allowedUpdates = [
    'name', 'type', 'date', 'location', 'description',
    'expiresAt', 'allowDownloads', 'allowOriginalDownloads',
    'watermarkEnabled', 'watermarkText', 'isPublic',
    'requireConsent', 'selfieRetentionHours', 'faceSimilarityThreshold', 'status',
  ];

  allowedUpdates.forEach((field) => {
    if (req.body[field] !== undefined) {
      event[field] = req.body[field];
    }
  });

  // Handle cover image update
  if (req.file) {
    try {
      const result = await uploadToCloudinary(req.file.buffer, {
        folder: `qr-photo-finder/events/${event.slug}/cover`,
        transformation: [{ width: 1200, height: 600, crop: 'fill' }],
      });
      if (event.coverImagePublicId) {
        await deleteFromCloudinary(event.coverImagePublicId).catch(() => {});
      }
      event.coverImage = result.secure_url;
      event.coverImagePublicId = result.public_id;
    } catch (err) {
      logger.error('Cover image update failed:', err);
    }
  }

  await event.save();
  return sendSuccess(res, { event }, 'Event updated successfully');
});

// ─── DELETE /api/events/:id ───────────────────────────────────────────────────
const deleteEvent = asyncHandler(async (req, res) => {
  const event = req.event;

  // 1. Collect all photo Cloudinary IDs
  const photos = await Photo.find({ event: event._id }).select('+originalPublicId +thumbnailPublicId');
  const publicIds = [];
  photos.forEach((p) => {
    if (p.originalPublicId) publicIds.push(p.originalPublicId);
    if (p.thumbnailPublicId) publicIds.push(p.thumbnailPublicId);
  });

  // 2. Delete from Cloudinary in batches of 100
  if (publicIds.length > 0) {
    const { cloudinary } = require('../config/cloudinary');
    for (let i = 0; i < publicIds.length; i += 100) {
      const batch = publicIds.slice(i, i + 100);
      await cloudinary.api.delete_resources(batch).catch((err) =>
        logger.error('Cloudinary batch delete error:', err)
      );
    }
  }

  // 3. Delete cover image
  if (event.coverImagePublicId) {
    await deleteFromCloudinary(event.coverImagePublicId).catch(() => {});
  }

  // 4. Delete all database records
  await Promise.all([
    Photo.deleteMany({ event: event._id }),
    FaceEmbedding.deleteMany({ event: event._id }),
    GuestSearch.deleteMany({ event: event._id }),
    event.deleteOne(),
  ]);

  // 5. Decrement user counts
  await require('../models').User.findByIdAndUpdate(req.user._id, {
    $inc: { totalEvents: -1, totalPhotos: -photos.length },
  });

  logger.info(`Event deleted: ${event.slug} by user ${req.user._id}`);
  return sendSuccess(res, {}, 'Event and all associated data deleted successfully');
});

// ─── GET /api/events/:id/qr ───────────────────────────────────────────────────
const getQRCode = asyncHandler(async (req, res) => {
  const event = req.event;

  // Regenerate if missing
  if (!event.qrCode || !event.qrCode.dataUrl) {
    const domain = process.env.APP_DOMAIN || 'http://localhost:3000';
    const eventUrl = `${domain}/e/${event.slug}`;
    const { dataUrl, svgString } = await generateQRData(eventUrl);
    event.qrCode = { dataUrl, svgString, publicUrl: eventUrl };
    await event.save();
  }

  return sendSuccess(res, {
    qrCode: {
      dataUrl: event.qrCode.dataUrl,
      svgString: event.qrCode.svgString,
      publicUrl: event.qrCode.publicUrl,
    },
    eventName: event.name,
    eventSlug: event.slug,
  });
});

// ─── POST /api/events/:id/regenerate-qr ──────────────────────────────────────
const regenerateQR = asyncHandler(async (req, res) => {
  const event = req.event;
  const domain = process.env.APP_DOMAIN || 'http://localhost:3000';
  const eventUrl = `${domain}/e/${event.slug}`;
  const { dataUrl, svgString } = await generateQRData(eventUrl);
  event.qrCode = { dataUrl, svgString, publicUrl: eventUrl };
  await event.save();

  return sendSuccess(res, {
    qrCode: { dataUrl, svgString, publicUrl: eventUrl },
  }, 'QR code regenerated');
});

// ─── GET /api/events/:id/stats ────────────────────────────────────────────────
const getEventStats = asyncHandler(async (req, res) => {
  const event = req.event;
  return sendSuccess(res, {
    stats: {
      photoCount: event.photoCount,
      processedPhotoCount: event.processedPhotoCount,
      failedPhotoCount: event.failedPhotoCount,
      faceCount: event.faceCount,
      processingStatus: event.processingStatus,
      processingProgress: event.processingProgress,
      qrScans: event.qrScans,
      uniqueVisitors: event.uniqueVisitors,
      totalSearches: event.totalSearches,
      successfulSearches: event.successfulSearches,
      totalViews: event.totalViews,
      totalDownloads: event.totalDownloads,
    },
  });
});

module.exports = {
  createEvent,
  getEvents,
  getEvent,
  updateEvent,
  deleteEvent,
  getQRCode,
  regenerateQR,
  getEventStats,
};
