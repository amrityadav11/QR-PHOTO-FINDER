/**
 * photoProcessor.js
 *
 * In-process background job queue for photo face detection + embedding.
 *
 * Architecture:
 *  - Uses a simple in-memory queue (array + setInterval) for MVP.
 *  - Each job: download photo → detect faces → generate embeddings → save to MongoDB.
 *  - Designed to be replaced with BullMQ + Redis for production scale.
 *  - The queue interface (addPhotoProcessingJob) is the same regardless of backend.
 *
 * To upgrade to BullMQ:
 *  1. npm install bullmq ioredis
 *  2. Replace the queue array with a Bull Queue
 *  3. Move the processJob logic into a Bull Worker
 *  4. Keep addPhotoProcessingJob() signature identical
 */

const { Photo, FaceEmbedding, Event } = require('../models');
const faceService = require('../services/faceRecognitionService');
const logger = require('../utils/logger');

// ─── In-memory job queue ──────────────────────────────────────────────────────
const jobQueue = [];
let isProcessing = false;
let processorInterval = null;

const MAX_RETRIES = 3;
const BATCH_SIZE = 5;          // Process N photos concurrently
const POLL_INTERVAL_MS = 2000; // Check queue every 2 seconds

/**
 * Add a photo processing job to the queue.
 * Called immediately after photo upload.
 *
 * @param {{ photoId: string, eventId: string, imageUrl: string, threshold: number }} job
 */
const addPhotoProcessingJob = (job) => {
  jobQueue.push({ ...job, retries: 0, addedAt: Date.now() });
  logger.debug(`[Worker] Job queued for photo ${job.photoId}. Queue size: ${jobQueue.length}`);
};

/**
 * Process a single photo job.
 */
const processJob = async (job) => {
  const { photoId, eventId, imageUrl } = job;

  try {
    // Mark photo as processing
    await Photo.findByIdAndUpdate(photoId, {
      processingStatus: 'processing',
      $inc: { processingAttempts: 1 },
    });

    logger.debug(`[Worker] Processing photo ${photoId}`);

    // Detect faces and generate embeddings
    const provider = faceService.getProvider().name;
    const collectionId = provider === 'aws' ? `event-${eventId}` : null;

    const faceEmbeddings = await faceService.generateEmbedding(
      { url: imageUrl },
      collectionId
    );

    if (!faceEmbeddings || faceEmbeddings.length === 0) {
      // No faces found — still mark as completed (not every photo has people)
      await Photo.findByIdAndUpdate(photoId, {
        processingStatus: 'completed',
        faceCount: 0,
        hasFaces: false,
        processedAt: new Date(),
      });

      await Event.findByIdAndUpdate(eventId, {
        $inc: { processedPhotoCount: 1 },
      });

      logger.debug(`[Worker] Photo ${photoId}: no faces detected`);
      return;
    }

    // Save each face embedding to MongoDB
    const embeddingDocs = faceEmbeddings.map((fe) => ({
      event: eventId,
      photo: photoId,
      embedding: fe.vector || [],
      boundingBox: fe.boundingBox || {},
      confidence: fe.confidence || null,
      provider: faceService.getProvider().name,
      dimensions: fe.vector ? fe.vector.length : 0,
    }));

    await FaceEmbedding.insertMany(embeddingDocs);

    // Update photo record
    await Photo.findByIdAndUpdate(photoId, {
      processingStatus: 'completed',
      faceCount: faceEmbeddings.length,
      hasFaces: true,
      processedAt: new Date(),
    });

    // Update event stats
    await Event.findByIdAndUpdate(eventId, {
      $inc: {
        processedPhotoCount: 1,
        faceCount: faceEmbeddings.length,
      },
    });

    // Check if all photos in event are processed
    await checkEventCompletion(eventId);

    logger.debug(`[Worker] Photo ${photoId}: ${faceEmbeddings.length} face(s) processed`);
  } catch (err) {
    logger.error(`[Worker] Error processing photo ${photoId}:`, err.message);

    if (job.retries < MAX_RETRIES) {
      // Re-queue with incremented retry count
      job.retries++;
      jobQueue.push(job);
      logger.debug(`[Worker] Photo ${photoId} requeued (attempt ${job.retries}/${MAX_RETRIES})`);

      // Reset status to pending for retry
      await Photo.findByIdAndUpdate(photoId, {
        processingStatus: 'pending',
      }).catch(() => {});
    } else {
      // Mark as failed after max retries
      await Photo.findByIdAndUpdate(photoId, {
        processingStatus: 'failed',
        processingError: err.message,
      }).catch(() => {});

      await Event.findByIdAndUpdate(eventId, {
        $inc: { processedPhotoCount: 1, failedPhotoCount: 1 },
      }).catch(() => {});

      await checkEventCompletion(eventId);

      logger.error(`[Worker] Photo ${photoId} permanently failed after ${MAX_RETRIES} attempts`);
    }
  }
};

/**
 * Check if all event photos have been processed and update event status.
 */
const checkEventCompletion = async (eventId) => {
  try {
    const event = await Event.findById(eventId).select(
      'photoCount processedPhotoCount failedPhotoCount processingStatus'
    );
    if (!event) return;

    const processed = event.processedPhotoCount;
    const total = event.photoCount;

    if (processed >= total && total > 0) {
      const newStatus = event.failedPhotoCount > 0 ? 'partial' : 'completed';
      await Event.findByIdAndUpdate(eventId, { processingStatus: newStatus });
      logger.info(`[Worker] Event ${eventId} processing ${newStatus}: ${processed}/${total} photos`);
    }
  } catch (err) {
    logger.error('[Worker] checkEventCompletion error:', err.message);
  }
};

/**
 * Process a batch of jobs from the queue.
 */
const processBatch = async () => {
  if (isProcessing || jobQueue.length === 0) return;

  isProcessing = true;
  const batch = jobQueue.splice(0, BATCH_SIZE);

  try {
    await Promise.allSettled(batch.map(processJob));
  } finally {
    isProcessing = false;
  }
};

/**
 * Start the background processor.
 * Called once from server.js on startup.
 */
const startPhotoProcessor = () => {
  if (processorInterval) return; // Already running

  processorInterval = setInterval(processBatch, POLL_INTERVAL_MS);
  logger.info('[Worker] Photo processor started');

  // Recover any stuck "processing" photos from a previous crash
  recoverStuckJobs();
};

/**
 * Gracefully stop the processor.
 */
const stopPhotoProcessor = () => {
  if (processorInterval) {
    clearInterval(processorInterval);
    processorInterval = null;
    logger.info('[Worker] Photo processor stopped');
  }
};

/**
 * On startup, find photos stuck in "processing" state (e.g. after server crash)
 * and re-queue them.
 */
const recoverStuckJobs = async () => {
  try {
    // Wait for DB to be ready
    await new Promise((resolve) => setTimeout(resolve, 3000));

    const stuckPhotos = await Photo.find({ processingStatus: 'processing' })
      .populate('event', 'slug faceSimilarityThreshold')
      .select('_id event originalUrl');

    if (stuckPhotos.length > 0) {
      logger.info(`[Worker] Recovering ${stuckPhotos.length} stuck photo job(s)`);
      stuckPhotos.forEach((photo) => {
        addPhotoProcessingJob({
          photoId: photo._id.toString(),
          eventId: photo.event._id.toString(),
          imageUrl: photo.originalUrl,
          threshold: photo.event.faceSimilarityThreshold || 0.80,
        });
      });

      // Reset them to pending so the queue can pick them up
      await Photo.updateMany(
        { processingStatus: 'processing' },
        { processingStatus: 'pending' }
      );
    }
  } catch (err) {
    logger.error('[Worker] recoverStuckJobs error:', err.message);
  }
};

/**
 * Get current queue statistics.
 */
const getQueueStats = () => ({
  queueSize: jobQueue.length,
  isProcessing,
});

module.exports = {
  addPhotoProcessingJob,
  startPhotoProcessor,
  stopPhotoProcessor,
  getQueueStats,
};
