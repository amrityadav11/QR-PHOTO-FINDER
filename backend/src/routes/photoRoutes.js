const express = require('express');
const router = express.Router({ mergeParams: true });

const {
  uploadPhotos,
  getEventPhotos,
  deletePhoto,
  getProcessingStatus,
} = require('../controllers/photoController');

const { protect } = require('../middleware/auth');
const { requireEventOwnership } = require('../middleware/eventOwnership');
const { mongoIdParam, validate } = require('../middleware/validate');
const { handleUpload, uploadEventPhotos } = require('../middleware/uploadMiddleware');

// All photo routes require auth + event ownership
// These are mounted under /api/events/:id/photos in app.js
router.use(protect);
router.use(mongoIdParam('id').concat([]), validate);
router.use(requireEventOwnership);

router.post('/', handleUpload(uploadEventPhotos), uploadPhotos);
router.get('/', getEventPhotos);
router.get('/processing-status', getProcessingStatus);
router.delete('/:photoId', deletePhoto);

module.exports = router;
