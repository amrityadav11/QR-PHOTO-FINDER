const mongoose = require('mongoose');

const faceEmbeddingSchema = new mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
    },
    photo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Photo',
      required: true,
    },
    // The embedding vector — NEVER exposed in public API responses
    // Stored as an array of floats (e.g. 128-dim or 512-dim depending on provider)
    embedding: {
      type: [Number],
      required: true,
      select: false, // excluded from all queries by default
    },
    // Bounding box of the face in the original image
    boundingBox: {
      top: { type: Number },
      left: { type: Number },
      width: { type: Number },
      height: { type: Number },
    },
    // Confidence of the face detection
    confidence: {
      type: Number,
      min: 0,
      max: 1,
      default: null,
    },
    // Which provider generated this embedding
    provider: {
      type: String,
      enum: ['aws', 'facepp', 'local', 'mock'],
      default: 'aws',
      select: false,
    },
    // Dimension of embedding vector (e.g. 128, 512)
    dimensions: {
      type: Number,
      default: null,
      select: false,
    },
  },
  {
    timestamps: true,
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
// Fast lookup: all faces for an event (used during similarity search)
faceEmbeddingSchema.index({ event: 1 });
// For deleting a photo's embeddings
faceEmbeddingSchema.index({ photo: 1 });
// Combined index for event + photo
faceEmbeddingSchema.index({ event: 1, photo: 1 });

/*
  NOTE ON MONGODB VECTOR SEARCH:
  If you upgrade to MongoDB Atlas with Vector Search,
  you can add a vector search index on the `embedding` field:

  {
    "type": "vectorSearch",
    "fields": [{
      "type": "vector",
      "path": "embedding",
      "numDimensions": 512,
      "similarity": "cosine"
    }]
  }

  Then use $vectorSearch aggregation pipeline stage instead of
  the in-memory similarity loop in faceRecognitionService.js.
  The schema is already structured to support this upgrade.
*/

module.exports = mongoose.model('FaceEmbedding', faceEmbeddingSchema);
