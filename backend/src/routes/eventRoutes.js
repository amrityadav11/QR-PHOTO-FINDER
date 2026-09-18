const express = require('express');
const router = express.Router();

const {
  createEvent,
  getEvents,
  getEvent,
  updateEvent,
  deleteEvent,
  getQRCode,
  regenerateQR,
  getEventStats,
} = require('../controllers/eventController');

const { protect } = require('../middleware/auth');
const { requireEventOwnership } = require('../middleware/eventOwnership');
const {
  createEventValidators,
  updateEventValidators,
  mongoIdParam,
  validate,
} = require('../middleware/validate');
const { handleUpload, uploadCoverImage } = require('../middleware/uploadMiddleware');

// All event routes require authentication
router.use(protect);

router.post('/', handleUpload(uploadCoverImage), createEventValidators, validate, createEvent);
router.get('/', getEvents);

router.get('/:id', mongoIdParam(), validate, requireEventOwnership, getEvent);
router.put('/:id', mongoIdParam(), validate, requireEventOwnership, handleUpload(uploadCoverImage), updateEventValidators, validate, updateEvent);
router.delete('/:id', mongoIdParam(), validate, requireEventOwnership, deleteEvent);

router.get('/:id/qr', mongoIdParam(), validate, requireEventOwnership, getQRCode);
router.post('/:id/regenerate-qr', mongoIdParam(), validate, requireEventOwnership, regenerateQR);
router.get('/:id/stats', mongoIdParam(), validate, requireEventOwnership, getEventStats);

module.exports = router;
