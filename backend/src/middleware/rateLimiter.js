const rateLimit = require('express-rate-limit');

/**
 * Per-event selfie search rate limiter
 * Applied on: POST /api/public/events/:slug/search
 * Limits: 10 searches per 15 minutes per IP
 */
const selfieSearchLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  keyGenerator: (req) => {
    // Key by IP + event slug combination
    const ip = req.ip || req.socket.remoteAddress;
    const slug = req.params.slug || 'unknown';
    return `${ip}_${slug}`;
  },
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many photo searches. Please wait 15 minutes before trying again.',
  },
});

/**
 * Photo download rate limiter
 * 30 downloads per 15 minutes per IP
 */
const downloadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many download requests. Please wait before trying again.',
  },
});

/**
 * Event page view rate limiter (QR scan tracking)
 * 60 visits per 15 minutes per IP
 */
const eventPageLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests. Please slow down.',
  },
});

/**
 * API key / admin endpoint limiter
 */
const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  selfieSearchLimiter,
  downloadLimiter,
  eventPageLimiter,
  adminLimiter,
};
