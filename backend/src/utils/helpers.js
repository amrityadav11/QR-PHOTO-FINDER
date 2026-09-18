const slugify = require('slugify');
const { v4: uuidv4 } = require('uuid');

/**
 * Generate a URL-safe slug from a string
 */
const generateSlug = (text, suffix = '') => {
  const base = slugify(text, {
    lower: true,
    strict: true,
    trim: true,
  });
  const uniqueSuffix = suffix || Date.now().toString(36);
  return `${base}-${uniqueSuffix}`;
};

/**
 * Generate a unique search ID
 */
const generateSearchId = () => uuidv4();

/**
 * Calculate cosine similarity between two vectors
 */
const cosineSimilarity = (vecA, vecB) => {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  if (normA === 0 || normB === 0) return 0;

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};

/**
 * Calculate Euclidean distance between two vectors
 */
const euclideanDistance = (vecA, vecB) => {
  if (!vecA || !vecB || vecA.length !== vecB.length) return Infinity;

  let sum = 0;
  for (let i = 0; i < vecA.length; i++) {
    const diff = vecA[i] - vecB[i];
    sum += diff * diff;
  }
  return Math.sqrt(sum);
};

/**
 * Paginate an array
 */
const paginate = (array, page = 1, limit = 20) => {
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  return array.slice(startIndex, endIndex);
};

/**
 * Build pagination metadata
 */
const buildPagination = (total, page, limit) => {
  const totalPages = Math.ceil(total / limit);
  return {
    total,
    page: parseInt(page),
    limit: parseInt(limit),
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
};

/**
 * Sanitize filename to prevent path traversal
 */
const sanitizeFilename = (filename) => {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/\.{2,}/g, '_')
    .substring(0, 255);
};

/**
 * Format file size to human readable
 */
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

/**
 * Check if event is expired
 */
const isEventExpired = (expiresAt) => {
  if (!expiresAt) return false;
  return new Date() > new Date(expiresAt);
};

/**
 * Generate expiry date
 */
const getExpiryDate = (days) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
};

module.exports = {
  generateSlug,
  generateSearchId,
  cosineSimilarity,
  euclideanDistance,
  paginate,
  buildPagination,
  sanitizeFilename,
  formatFileSize,
  isEventExpired,
  getExpiryDate,
};
