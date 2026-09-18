const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: [true, 'Event name is required'],
      trim: true,
      minlength: [2, 'Event name must be at least 2 characters'],
      maxlength: [200, 'Event name cannot exceed 200 characters'],
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    type: {
      type: String,
      enum: [
        'wedding',
        'engagement',
        'birthday',
        'college',
        'corporate',
        'conference',
        'festival',
        'sports',
        'photography',
        'other',
      ],
      required: [true, 'Event type is required'],
    },
    date: {
      type: Date,
      required: [true, 'Event date is required'],
    },
    location: {
      type: String,
      trim: true,
      maxlength: [300, 'Location cannot exceed 300 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    // Cover image
    coverImage: {
      type: String,
      default: null,
    },
    coverImagePublicId: {
      type: String,
      default: null,
      select: false,
    },
    // QR Code
    qrCode: {
      dataUrl: { type: String, default: null },    // base64 PNG for display
      svgString: { type: String, default: null },   // SVG markup
      publicUrl: { type: String, default: null },   // URL QR points to
    },
    // Status
    status: {
      type: String,
      enum: ['draft', 'active', 'expired', 'archived'],
      default: 'active',
    },
    processingStatus: {
      type: String,
      enum: ['idle', 'processing', 'completed', 'partial', 'failed'],
      default: 'idle',
    },
    // Photo stats
    photoCount: { type: Number, default: 0 },
    processedPhotoCount: { type: Number, default: 0 },
    failedPhotoCount: { type: Number, default: 0 },
    faceCount: { type: Number, default: 0 },

    // Analytics
    qrScans: { type: Number, default: 0 },
    uniqueVisitors: { type: Number, default: 0 },
    totalSearches: { type: Number, default: 0 },
    successfulSearches: { type: Number, default: 0 },
    totalViews: { type: Number, default: 0 },
    totalDownloads: { type: Number, default: 0 },

    // Settings
    expiresAt: { type: Date, default: null },
    allowDownloads: { type: Boolean, default: true },
    allowOriginalDownloads: { type: Boolean, default: false },
    watermarkEnabled: { type: Boolean, default: false },
    watermarkText: { type: String, default: '' },
    isPublic: { type: Boolean, default: true },
    requireConsent: { type: Boolean, default: true },
    selfieRetentionHours: { type: Number, default: 0 }, // 0 = delete immediately after processing
    maxSearchesPerHour: { type: Number, default: 50 },
    faceSimilarityThreshold: {
      type: Number,
      default: 0.80,
      min: 0.5,
      max: 1.0,
    },
  },
  {
    timestamps: true,
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
eventSchema.index({ owner: 1 });
eventSchema.index({ slug: 1 }, { unique: true });
eventSchema.index({ status: 1 });
eventSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0, sparse: true });
eventSchema.index({ owner: 1, createdAt: -1 });

// ─── Virtual: event URL ───────────────────────────────────────────────────────
eventSchema.virtual('eventUrl').get(function () {
  const domain = process.env.APP_DOMAIN || 'http://localhost:3000';
  return `${domain}/e/${this.slug}`;
});

// ─── Virtual: processing progress percent ────────────────────────────────────
eventSchema.virtual('processingProgress').get(function () {
  if (this.photoCount === 0) return 0;
  return Math.round((this.processedPhotoCount / this.photoCount) * 100);
});

// ─── Method: safe public event data (for guest-facing API) ───────────────────
eventSchema.methods.toPublicJSON = function () {
  return {
    id: this._id,
    name: this.name,
    slug: this.slug,
    type: this.type,
    date: this.date,
    location: this.location,
    description: this.description,
    coverImage: this.coverImage,
    status: this.status,
    processingStatus: this.processingStatus,
    photoCount: this.photoCount,
    allowDownloads: this.allowDownloads,
    isPublic: this.isPublic,
    requireConsent: this.requireConsent,
    expiresAt: this.expiresAt,
    eventUrl: this.eventUrl,
  };
};

module.exports = mongoose.model('Event', eventSchema);
