const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { sendBadRequest } = require('../utils/apiResponse');

const MAX_FILE_SIZE_MB = parseInt(process.env.MAX_FILE_SIZE_MB || '20', 10);
const MAX_FILES_PER_UPLOAD = parseInt(process.env.MAX_FILES_PER_UPLOAD || '100', 10);

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
];

const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];

/**
 * Validate file type by both MIME type and extension
 * Never trust only one — validate both.
 */
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const mimeOk = ALLOWED_MIME_TYPES.includes(file.mimetype);
  const extOk = ALLOWED_EXTENSIONS.includes(ext);

  if (mimeOk && extOk) {
    cb(null, true);
  } else {
    cb(
      new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'Only JPG, JPEG, PNG, and WEBP images are allowed'),
      false
    );
  }
};

/**
 * Disk storage — temp folder before processing/uploading to Cloudinary
 * Sanitize filename to prevent path traversal
 */
const diskStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads/temp'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeName = `${uuidv4()}${ext}`;
    cb(null, safeName);
  },
});

/**
 * Memory storage — for smaller files / selfies
 */
const memoryStorage = multer.memoryStorage();

// ─── Uploader for event photos (disk storage, multiple files) ─────────────────
const uploadEventPhotos = multer({
  storage: diskStorage,
  limits: {
    fileSize: MAX_FILE_SIZE_MB * 1024 * 1024,
    files: MAX_FILES_PER_UPLOAD,
  },
  fileFilter,
}).array('photos', MAX_FILES_PER_UPLOAD);

// ─── Uploader for single selfie (memory storage) ──────────────────────────────
const uploadSelfie = multer({
  storage: memoryStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB max for selfie
    files: 1,
  },
  fileFilter,
}).single('selfie');

// ─── Uploader for cover image ─────────────────────────────────────────────────
const uploadCoverImage = multer({
  storage: memoryStorage,
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 1,
  },
  fileFilter,
}).single('coverImage');

// ─── Uploader for profile image ───────────────────────────────────────────────
const uploadProfileImage = multer({
  storage: memoryStorage,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1,
  },
  fileFilter,
}).single('profileImage');

/**
 * Middleware wrapper that surfaces multer errors cleanly
 */
const handleUpload = (uploadFn) => (req, res, next) => {
  uploadFn(req, res, (err) => {
    if (!err) return next();

    if (err instanceof multer.MulterError) {
      switch (err.code) {
        case 'LIMIT_FILE_SIZE':
          return sendBadRequest(
            res,
            `File too large. Maximum size is ${MAX_FILE_SIZE_MB}MB per file.`
          );
        case 'LIMIT_FILE_COUNT':
          return sendBadRequest(
            res,
            `Too many files. Maximum ${MAX_FILES_PER_UPLOAD} files per upload.`
          );
        case 'LIMIT_UNEXPECTED_FILE':
          return sendBadRequest(res, err.field || 'Only JPG, JPEG, PNG, and WEBP are allowed.');
        default:
          return sendBadRequest(res, `Upload error: ${err.message}`);
      }
    }

    // Unknown error
    return sendBadRequest(res, err.message || 'File upload failed.');
  });
};

module.exports = {
  handleUpload,
  uploadEventPhotos,
  uploadSelfie,
  uploadCoverImage,
  uploadProfileImage,
  ALLOWED_MIME_TYPES,
  ALLOWED_EXTENSIONS,
};
