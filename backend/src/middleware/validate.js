const { validationResult, body, param, query } = require('express-validator');
const { sendBadRequest } = require('../utils/apiResponse');

/**
 * Run express-validator checks and return 400 if any fail
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const messages = errors.array().map((e) => e.msg);
    return sendBadRequest(res, messages[0], messages);
  }
  next();
};

// ─── Auth validators ──────────────────────────────────────────────────────────
const registerValidators = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be 2–100 characters'),
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[A-Za-z]/).withMessage('Password must contain at least one letter')
    .matches(/\d/).withMessage('Password must contain at least one number'),
];

const loginValidators = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required'),
];

// ─── Event validators ─────────────────────────────────────────────────────────
const createEventValidators = [
  body('name')
    .trim()
    .notEmpty().withMessage('Event name is required')
    .isLength({ min: 2, max: 200 }).withMessage('Event name must be 2–200 characters'),
  body('type')
    .notEmpty().withMessage('Event type is required')
    .isIn([
      'wedding', 'engagement', 'birthday', 'college', 'corporate',
      'conference', 'festival', 'sports', 'photography', 'other',
    ]).withMessage('Invalid event type'),
  body('date')
    .notEmpty().withMessage('Event date is required')
    .isISO8601().withMessage('Invalid date format'),
  body('location')
    .optional()
    .trim()
    .isLength({ max: 300 }).withMessage('Location cannot exceed 300 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 }).withMessage('Description cannot exceed 2000 characters'),
  body('expiresAt')
    .optional()
    .isISO8601().withMessage('Invalid expiry date format'),
  body('allowDownloads')
    .optional()
    .isBoolean().withMessage('allowDownloads must be boolean'),
  body('allowOriginalDownloads')
    .optional()
    .isBoolean().withMessage('allowOriginalDownloads must be boolean'),
  body('faceSimilarityThreshold')
    .optional()
    .isFloat({ min: 0.5, max: 1.0 }).withMessage('Similarity threshold must be between 0.5 and 1.0'),
];

const updateEventValidators = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 200 }).withMessage('Event name must be 2–200 characters'),
  body('type')
    .optional()
    .isIn([
      'wedding', 'engagement', 'birthday', 'college', 'corporate',
      'conference', 'festival', 'sports', 'photography', 'other',
    ]).withMessage('Invalid event type'),
  body('date')
    .optional()
    .isISO8601().withMessage('Invalid date format'),
  body('allowDownloads')
    .optional()
    .isBoolean().withMessage('allowDownloads must be boolean'),
  body('allowOriginalDownloads')
    .optional()
    .isBoolean().withMessage('allowOriginalDownloads must be boolean'),
  body('faceSimilarityThreshold')
    .optional()
    .isFloat({ min: 0.5, max: 1.0 }).withMessage('Threshold must be between 0.5 and 1.0'),
];

// ─── Param validators ─────────────────────────────────────────────────────────
const mongoIdParam = (paramName = 'id') => [
  param(paramName)
    .notEmpty().withMessage(`${paramName} is required`)
    .isMongoId().withMessage(`Invalid ${paramName}`),
];

const slugParam = [
  param('slug')
    .trim()
    .notEmpty().withMessage('Event slug is required')
    .matches(/^[a-z0-9-]+$/).withMessage('Invalid event slug format'),
];

// ─── Pagination query validators ──────────────────────────────────────────────
const paginationValidators = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 200 }).withMessage('Limit must be between 1 and 200'),
];

// ─── Search/selfie validators ─────────────────────────────────────────────────
const searchValidators = [
  body('consentGiven')
    .custom((value) => {
      if (value === true || value === 'true') {
        return true;
      }
      throw new Error('Consent is required to search for photos');
    }),
];

module.exports = {
  validate,
  registerValidators,
  loginValidators,
  createEventValidators,
  updateEventValidators,
  mongoIdParam,
  slugParam,
  paginationValidators,
  searchValidators,
};
