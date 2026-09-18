const mongoose = require('mongoose');

const photoSchema = new mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Storage
    originalUrl: {
      type: String,
      required: true,
    },
    thumbnailUrl: {
      type: String,
      default: null,
    },
    previewUrl: {
      type: String,
      default: null,
    },
    // Cloudinary public IDs (internal — not exposed in API)
    originalPublicId: {
      type: String,
      required: true,
      select: false,
    },
    thumbnailPublicId: {
      type: String,
      default: null,
      select: false,
    },
    // Metadata
    originalFilename: {
      type: String,
      default: null,
    },
    width: { type: Number, default: null },
    height: { type: Number, default: null },
    fileSize: { type: Number, default: null }, // bytes
    mimeType: { type: String, default: null },
    format: { type: String, default: null },

    // Processing
    processingStatus: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
    },
    processingError: {
      type: String,
      default: null,
      select: false,
    },
    processingAttempts: {
      type: Number,
      default: 0,
    },
    processedAt: { type: Date, default: null },

    // Face data
    faceCount: { type: Number, default: 0 },
    hasFaces: { type: Boolean, default: false },

    // Download tracking
    downloadCount: { type: Number, default: 0 },
    viewCount: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
photoSchema.index({ event: 1 });
photoSchema.index({ event: 1, processingStatus: 1 });
photoSchema.index({ owner: 1 });
photoSchema.index({ createdAt: -1 });

// ─── Method: safe public photo data ──────────────────────────────────────────
photoSchema.methods.toPublicJSON = function (allowDownload = false) {
  const data = {
    id: this._id,
    thumbnailUrl: this.thumbnailUrl,
    previewUrl: this.previewUrl || this.thumbnailUrl,
    width: this.width,
    height: this.height,
  };
  if (allowDownload) {
    data.originalUrl = this.originalUrl;
  }
  return data;
};

module.exports = mongoose.model('Photo', photoSchema);
