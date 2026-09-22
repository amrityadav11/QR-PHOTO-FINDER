require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');

const corsOptions = require('./config/corsOptions');
const connectDB = require('./config/db');
const { configureCloudinary } = require('./config/cloudinary');
const logger = require('./utils/logger');
const { sendError } = require('./utils/apiResponse');

// Connect to database (for serverless functions)
if (process.env.NODE_ENV === 'production' || process.env.VERCEL) {
  connectDB();
}

// Route imports
const authRoutes = require('./routes/authRoutes');
const eventRoutes = require('./routes/eventRoutes');
const photoRoutes = require('./routes/photoRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const userRoutes = require('./routes/userRoutes');
const publicRoutes = require('./routes/publicRoutes'); // created in task 10
const adminRoutes = require('./routes/adminRoutes');

const app = express();

// ─── Configure trust proxy for Render ───────────────────────────────────────
app.set('trust proxy', 1);

// ─── Configure external services ────────────────────────────────────────────
configureCloudinary();

// ─── Security Middleware ─────────────────────────────────────────────────────
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: false, // handled on frontend
  })
);
app.use(cors(corsOptions));

// ─── General Rate Limiter ────────────────────────────────────────────────────
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});

// ─── Strict Rate Limiter (auth, selfie search) ────────────────────────────────
const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many attempts. Please wait before trying again.' },
});

// ─── Body Parsers ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Request Logging ─────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.use(
    morgan('combined', {
      stream: { write: (msg) => logger.info(msg.trim()) },
    })
  );
}

// ─── Apply general limiter ────────────────────────────────────────────────────
app.use('/api', generalLimiter);

// ─── Static uploads (dev only - use CDN in production) ───────────────────────
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ─── Root Route ──────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'QR Photo Finder API is running',
    healthCheck: '/api/health',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'QR Photo Finder API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// ─── Auto-prefix /api fallback for legacy or misconfigured clients ────────────
app.use((req, res, next) => {
  if (req.path !== '/' && !req.path.startsWith('/api') && !req.path.startsWith('/uploads')) {
    req.url = '/api' + req.url;
  }
  next();
});

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth', strictLimiter, authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/events', eventRoutes);
// Photo sub-resource mounted under events
app.use('/api/events/:id/photos', photoRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/public', publicRoutes); // Guest-facing public routes

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  sendError(res, `Route ${req.originalUrl} not found`, 404);
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((e) => e.message);
    return sendError(res, 'Validation failed', 400, errors);
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return sendError(res, `${field} already exists`, 409);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return sendError(res, 'Invalid token', 401);
  }
  if (err.name === 'TokenExpiredError') {
    return sendError(res, 'Token has expired', 401);
  }

  // Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return sendError(res, `File too large. Maximum size is ${process.env.MAX_FILE_SIZE_MB || 20}MB`, 400);
  }
  if (err.code === 'LIMIT_FILE_COUNT') {
    return sendError(res, `Too many files. Maximum ${process.env.MAX_FILES_PER_UPLOAD || 100} per upload`, 400);
  }

  // CORS errors
  if (err.message && err.message.includes('CORS')) {
    return sendError(res, err.message, 403);
  }

  // Default server error — never expose stack in production
  const statusCode = err.statusCode || err.status || 500;
  const message =
    process.env.NODE_ENV === 'production'
      ? 'Something went wrong. Please try again.'
      : err.message || 'Internal Server Error';

  sendError(res, message, statusCode);
});

module.exports = app;
