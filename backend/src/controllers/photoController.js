const fs = require('fs');
const path = require('path');
const { Photo, Event } = require('../models');
const { asyncHandler } = require('../middleware/errorHandler');
const {
  sendSuccess,
  sendCreated,
  sendNotFound,
  sendError,
  sendBadRequest,
  sendPaginated,
} = require('../utils/apiResponse');
const { buildPagination } = require('../utils/helpers');
const { uploadFileToCloudinary, deleteFromCloudinary } = require('../config/cloudinary');
const { addPhotoProcessingJob } = require('../workers/photoProcessor');
const logger = require('../utils/logger');

// ─── POST /api/events/:id/photos — bulk upload ────────────────────────────────
const uploadPhotos = asyncHandler(async (req, res) => {
  const event = req.event;

  if (!req.files || req.files.length === 0) {
    return sendBadRequest(res, 'No files uploaded.');
  }

  if (event.status === 'expired' || event.status === 'archived') {
    return sendError(res, 'Cannot upload photos to an expired or archived event.', 400);
  }

  const uploadedPhotos = [];
  const failedFiles = [];

  for (const file of req.files) {
    try {
      // Upload original to Cloudinary
      const result = await uploadFileToCloudinary(file.path, {
        folder: `qr-photo-finder/events/${event.slug}/photos`,
        resource_type: 'image',
        use_filename: false,
        unique_filename: true,
        overwrite: false,
      });

      // Generate thumbnail via Cloudinary transformation
      const thumbnailUrl = result.secure_url.replace(
        '/upload/',
        '/upload/w_400,h_300,c_fill,q_auto,f_auto/'
      );
      const previewUrl = result.secure_url.replace(
        '/upload/',
        '/upload/w_800,h_600,c_limit,q_auto,f_auto/'
      );

      const photo = await Photo.create({
        event: event._id,
        owner: req.user._id,
        originalUrl: result.secure_url,
        thumbnailUrl,
        previewUrl,
        originalPublicId: result.public_id,
        originalFilename: file.originalname,
        width: result.width,
        height: result.height,
        fileSize: result.bytes,
        mimeType: file.mimetype,
        format: result.format,
        processingStatus: 'pending',
      });

      uploadedPhotos.push(photo);

      // Queue face processing job
      addPhotoProcessingJob({
        photoId: photo._id.toString(),
        eventId: event._id.toString(),
        imageUrl: result.secure_url,
        threshold: event.faceSimilarityThreshold,
      });

      // Cleanup temp file
      fs.unlink(file.path, () => {});
    } catch (err) {
      logger.error(`Photo upload failed for ${file.originalname}:`, err);
      failedFiles.push(file.originalname);
      // Cleanup temp file even on error
      fs.unlink(file.path, () => {});
    }
  }

  // Update event photo count
  await Event.findByIdAndUpdate(event._id, {
    $inc: { photoCount: uploadedPhotos.length },
    processingStatus: 'processing',
  });

  // Update user total photos
  await require('../models').User.findByIdAndUpdate(req.user._id, {
    $inc: { totalPhotos: uploadedPhotos.length },
  });

  logger.info(
    `Uploaded ${uploadedPhotos.length} photos to event ${event.slug}. Failed: ${failedFiles.length}`
  );

  return sendCreated(
    res,
    {
      uploaded: uploadedPhotos.length,
      failed: failedFiles.length,
      failedFiles,
      photos: uploadedPhotos.map((p) => ({
        id: p._id,
        thumbnailUrl: p.thumbnailUrl,
        processingStatus: p.processingStatus,
      })),
    },
    `${uploadedPhotos.length} photo(s) uploaded and queued for processing`
  );
});

// ─── GET /api/events/:id/photos ───────────────────────────────────────────────
const getEventPhotos = asyncHandler(async (req, res) => {
  const event = req.event;
  const page = parseInt(req.query.page) || 1;
  const limit = Math.min(parseInt(req.query.limit) || 24, 100);
  const status = req.query.status;

  const filter = { event: event._id };
  if (status) filter.processingStatus = status;

  const [photos, total] = await Promise.all([
    Photo.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select('-originalPublicId -thumbnailPublicId -processingError'),
    Photo.countDocuments(filter),
  ]);

  const allowDownload = event.allowDownloads;
  const formattedPhotos = photos.map((p) => ({
    id: p._id,
    thumbnailUrl: p.thumbnailUrl,
    previewUrl: p.previewUrl,
    originalUrl: allowDownload ? p.originalUrl : undefined,
    width: p.width,
    height: p.height,
    fileSize: p.fileSize,
    processingStatus: p.processingStatus,
    faceCount: p.faceCount,
    viewCount: p.viewCount,
    downloadCount: p.downloadCount,
    createdAt: p.createdAt,
  }));

  return sendPaginated(res, formattedPhotos, buildPagination(total, page, limit));
});

// ─── DELETE /api/events/:id/photos/:photoId ───────────────────────────────────
const deletePhoto = asyncHandler(async (req, res) => {
  const event = req.event;
  const { photoId } = req.params;

  const photo = await Photo.findOne({ _id: photoId, event: event._id }).select('+originalPublicId +thumbnailPublicId');
  if (!photo) {
    return sendNotFound(res, 'Photo not found in this event.');
  }

  // Delete from Cloudinary
  const deletePromises = [];
  if (photo.originalPublicId) deletePromises.push(deleteFromCloudinary(photo.originalPublicId));
  if (photo.thumbnailPublicId) deletePromises.push(deleteFromCloudinary(photo.thumbnailPublicId));
  await Promise.allSettled(deletePromises);

  // Delete face embeddings for this photo
  await require('../models').FaceEmbedding.deleteMany({ photo: photo._id });

  // Delete the photo record
  await photo.deleteOne();

  // Update event count
  await Event.findByIdAndUpdate(event._id, {
    $inc: { photoCount: -1, processedPhotoCount: photo.processingStatus === 'completed' ? -1 : 0 },
  });

  return sendSuccess(res, {}, 'Photo deleted successfully');
});

// ─── GET /api/events/:id/photos/processing-status ────────────────────────────
const getProcessingStatus = asyncHandler(async (req, res) => {
  const event = req.event;

  const [pending, processing, completed, failed] = await Promise.all([
    Photo.countDocuments({ event: event._id, processingStatus: 'pending' }),
    Photo.countDocuments({ event: event._id, processingStatus: 'processing' }),
    Photo.countDocuments({ event: event._id, processingStatus: 'completed' }),
    Photo.countDocuments({ event: event._id, processingStatus: 'failed' }),
  ]);

  // Re-fetch fresh event data
  const freshEvent = await Event.findById(event._id).select(
    'processingStatus photoCount processedPhotoCount faceCount'
  );

  return sendSuccess(res, {
    processingStatus: freshEvent.processingStatus,
    photoCount: freshEvent.photoCount,
    processedPhotoCount: freshEvent.processedPhotoCount,
    faceCount: freshEvent.faceCount,
    breakdown: { pending, processing, completed, failed },
    progress:
      freshEvent.photoCount > 0
        ? Math.round((freshEvent.processedPhotoCount / freshEvent.photoCount) * 100)
        : 0,
  });
});

module.exports = {
  uploadPhotos,
  getEventPhotos,
  deletePhoto,
  getProcessingStatus,
};
