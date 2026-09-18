const mongoose = require('mongoose');

const guestSearchSchema = new mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
    },
    // Unique ID returned to guest so they can re-fetch results
    searchId: {
      type: String,
      required: true,
      unique: true,
    },
    // IDs of photos that matched — only photo IDs, never embeddings
    matchedPhotoIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Photo',
      },
    ],
    // Match scores — parallel array to matchedPhotoIds (internal only)
    matchScores: {
      type: [Number],
      select: false,
    },
    // Selfie processing metadata — NEVER store actual selfie permanently
    selfieProcessed: { type: Boolean, default: false },
    selfieDeletedAt: { type: Date, default: null },
    // Temporary selfie public ID (deleted after processing)
    tempSelfiePublicId: {
      type: String,
      default: null,
      select: false,
    },
    // Guest fingerprint (hashed IP + user agent — for rate limiting, no PII stored)
    visitorFingerprint: {
      type: String,
      default: null,
      select: false,
    },
    // Status
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed', 'no_match'],
      default: 'pending',
    },
    errorMessage: {
      type: String,
      default: null,
    },
    matchCount: { type: Number, default: 0 },
    processingTimeMs: { type: Number, default: null },
    // Consent record
    consentGiven: { type: Boolean, default: false },
    consentTimestamp: { type: Date, default: null },
    // IP (hashed for privacy)
    ipHash: {
      type: String,
      default: null,
      select: false,
    },
    // Auto-expire search results
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    },
  },
  {
    timestamps: true,
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
guestSearchSchema.index({ event: 1 });
guestSearchSchema.index({ searchId: 1 }, { unique: true });
guestSearchSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
guestSearchSchema.index({ createdAt: -1 });

module.exports = mongoose.model('GuestSearch', guestSearchSchema);
