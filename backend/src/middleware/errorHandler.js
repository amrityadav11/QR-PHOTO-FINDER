const logger = require('../utils/logger');
const { sendError } = require('../utils/apiResponse');

/**
 * Centralized async error wrapper — removes try/catch boilerplate from controllers
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Global 404 handler — register AFTER all routes
 */
const notFoundHandler = (req, res) => {
  sendError(res, `Route ${req.method} ${req.originalUrl} not found`, 404);
};

/**
 * Global error handler — register LAST in Express middleware chain
 * Must have 4 parameters for Express to recognise it as error middleware
 */
// eslint-disable-next-line no-unused-vars
const globalErrorHandler = (err, req, res, next) => {
  logger.error(`[${req.method}] ${req.originalUrl} → ${err.message}`, {
    stack: err.stack,
    user: req.user ? req.user._id : 'unauthenticated',
  });

  // ─── Mongoose Validation ───────────────────────────────────────────────────
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((e) => e.message);
    return sendError(res, 'Validation failed', 400, errors);
  }

  // ─── Mongoose Cast (bad ObjectId) ─────────────────────────────────────────
  if (err.name === 'CastError') {
    return sendError(res, `Invalid ${err.path}: ${err.value}`, 400);
  }

  // ─── MongoDB Duplicate Key ────────────────────────────────────────────────
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return sendError(res, `${field} already exists.`, 409);
  }

  // ─── JWT Errors ───────────────────────────────────────────────────────────
  if (err.name === 'JsonWebTokenError') {
    return sendError(res, 'Invalid authentication token.', 401);
  }
  if (err.name === 'TokenExpiredError') {
    return sendError(res, 'Authentication token has expired.', 401);
  }

  // ─── Multer ───────────────────────────────────────────────────────────────
  if (err.code === 'LIMIT_FILE_SIZE') {
    return sendError(res, `File too large. Max ${process.env.MAX_FILE_SIZE_MB || 20}MB.`, 400);
  }
  if (err.code === 'LIMIT_FILE_COUNT') {
    return sendError(res, `Too many files per upload.`, 400);
  }

  // ─── CORS ────────────────────────────────────────────────────────────────
  if (err.message && err.message.includes('CORS')) {
    return sendError(res, err.message, 403);
  }

  // ─── Custom app errors ────────────────────────────────────────────────────
  if (err.isOperational) {
    return sendError(res, err.message, err.statusCode || 500);
  }

  // ─── Default: mask internal errors in production ─────────────────────────
  const statusCode = err.statusCode || err.status || 500;
  const message =
    process.env.NODE_ENV === 'production'
      ? 'Something went wrong. Please try again.'
      : err.message || 'Internal Server Error';

  sendError(res, message, statusCode);
};

/**
 * Create an operational (expected) error with a status code
 */
class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = {
  asyncHandler,
  notFoundHandler,
  globalErrorHandler,
  AppError,
};
