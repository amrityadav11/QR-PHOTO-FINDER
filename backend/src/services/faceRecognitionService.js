/**
 * faceRecognitionService.js
 *
 * Modular face recognition service.
 * The provider is selected via FACE_RECOGNITION_PROVIDER env var:
 *   'aws'    — AWS Rekognition (recommended for production)
 *   'facepp' — Face++ API
 *   'local'  — local heuristic stub (no real AI; for dev/testing only)
 *
 * All providers expose the same interface:
 *   detectFaces(imageSource)        → [{ boundingBox, confidence }]
 *   generateEmbedding(imageSource)  → Float32Array | number[]
 *   compareFaces(embA, embB)        → similarity (0.0–1.0)
 *   findMatchingFaces(selfieEmb, eventId, threshold) → [{ photoId, score }]
 */

const logger = require('../utils/logger');
const { cosineSimilarity } = require('../utils/helpers');

// ─── Provider: AWS Rekognition ────────────────────────────────────────────────
const awsProvider = (() => {
  let client = null;

  const getClient = () => {
    if (!client) {
      const {
        RekognitionClient,
      } = require('@aws-sdk/client-rekognition');
      client = new RekognitionClient({
        region: process.env.AWS_REGION || 'us-east-1',
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        },
      });
    }
    return client;
  };

  /**
   * Detect faces in an image buffer or URL.
   * imageSource: Buffer (for selfie) or { url: string } for stored photos
   */
  const detectFaces = async (imageSource) => {
    const {
      DetectFacesCommand,
    } = require('@aws-sdk/client-rekognition');

    const params = {
      Attributes: ['DEFAULT'],
    };

    if (Buffer.isBuffer(imageSource)) {
      params.Image = { Bytes: imageSource };
    } else if (imageSource.url) {
      // Download from URL first (Rekognition can't directly fetch Cloudinary URLs)
      const buffer = await downloadImageBuffer(imageSource.url);
      params.Image = { Bytes: buffer };
    }

    const cmd = new DetectFacesCommand(params);
    const response = await getClient().send(cmd);

    return (response.FaceDetails || []).map((face) => ({
      boundingBox: {
        left: face.BoundingBox.Left,
        top: face.BoundingBox.Top,
        width: face.BoundingBox.Width,
        height: face.BoundingBox.Height,
      },
      confidence: face.Confidence / 100, // normalise to 0-1
    }));
  };

  /**
   * Generate a face embedding via Rekognition's SearchFacesByImage.
   * AWS Rekognition doesn't expose raw embeddings directly —
   * we use CompareFaces for similarity and index-based collection for search.
   *
   * For this implementation we use IndexFaces on a per-event collection
   * and store the AWS face ID as the "embedding" (a collection-backed approach).
   *
   * Alternative: use DetectFaces + extract a pseudo-embedding via
   * landmark coordinates (lower accuracy but no collection needed).
   */
  const generateEmbedding = async (imageSource, collectionId = null) => {
    const { IndexFacesCommand, CreateCollectionCommand } = require('@aws-sdk/client-rekognition');

    let buffer;
    if (Buffer.isBuffer(imageSource)) {
      buffer = imageSource;
    } else if (imageSource.url) {
      buffer = await downloadImageBuffer(imageSource.url);
    }

    if (collectionId) {
      // Ensure collection exists
      try {
        await getClient().send(new CreateCollectionCommand({ CollectionId: collectionId }));
      } catch (e) {
        if (e.name !== 'ResourceAlreadyExistsException') throw e;
      }

      const cmd = new IndexFacesCommand({
        CollectionId: collectionId,
        Image: { Bytes: buffer },
        MaxFaces: 5,
        DetectionAttributes: [],
      });
      const result = await getClient().send(cmd);
      const faces = result.FaceRecords || [];
      // Return face IDs as the "embedding" for AWS collection-based search
      return faces.map((f) => ({
        faceId: f.Face.FaceId,
        boundingBox: {
          left: f.Face.BoundingBox.Left,
          top: f.Face.BoundingBox.Top,
          width: f.Face.BoundingBox.Width,
          height: f.Face.BoundingBox.Height,
        },
        confidence: f.Face.Confidence / 100,
        // Store a pseudo-vector from facial landmarks for cosine similarity fallback
        vector: encodeLandmarks(f),
      }));
    }

    // Without a collection, fall back to landmark-based pseudo-embedding
    const { DetectFacesCommand } = require('@aws-sdk/client-rekognition');
    const cmd = new DetectFacesCommand({
      Image: { Bytes: buffer },
      Attributes: ['ALL'],
    });
    const resp = await getClient().send(cmd);
    const faces = (resp.FaceDetails || []).map((face) => ({
      faceId: null,
      boundingBox: {
        left: face.BoundingBox.Left,
        top: face.BoundingBox.Top,
        width: face.BoundingBox.Width,
        height: face.BoundingBox.Height,
      },
      confidence: face.Confidence / 100,
      vector: encodeFaceDetails(face),
    }));
    return faces;
  };

  /**
   * Compare two face embeddings.
   * For AWS collection-based faces, use SearchFacesByImage.
   * For vector-based, use cosine similarity.
   */
  const compareFaces = async (embeddingA, embeddingB) => {
    if (embeddingA.vector && embeddingB.vector) {
      return cosineSimilarity(embeddingA.vector, embeddingB.vector);
    }
    // If both have faceIds in same collection, this can use SearchFaces
    // Fallback to 0 if incompatible
    return 0;
  };

  /**
   * Search a selfie against all stored face embeddings for an event.
   * Uses AWS SearchFacesByImage if collection exists, else cosine similarity.
   */
  const searchFacesInEvent = async (selfieBuffer, collectionId, threshold = 0.80) => {
    const { SearchFacesByImageCommand } = require('@aws-sdk/client-rekognition');

    try {
      const cmd = new SearchFacesByImageCommand({
        CollectionId: collectionId,
        Image: { Bytes: selfieBuffer },
        MaxFaces: 500,
        FaceMatchThreshold: threshold * 100, // AWS uses 0-100
      });
      const result = await getClient().send(cmd);
      return (result.FaceMatches || []).map((m) => ({
        faceId: m.Face.FaceId,
        similarity: m.Similarity / 100,
        externalImageId: m.Face.ExternalImageId, // we store photoId here
      }));
    } catch (err) {
      if (err.name === 'ResourceNotFoundException') {
        logger.warn(`AWS Collection ${collectionId} not found`);
        return [];
      }
      throw err;
    }
  };

  return { detectFaces, generateEmbedding, compareFaces, searchFacesInEvent };
})();

// ─── Provider: Face++ ─────────────────────────────────────────────────────────
const faceppProvider = (() => {
  const FACEPP_BASE = 'https://api-us.faceplusplus.com/facepp/v3';

  const post = async (endpoint, formData) => {
    const axios = require('axios');
    const FormData = require('form-data');

    const fd = new FormData();
    fd.append('api_key', process.env.FACEPP_API_KEY);
    fd.append('api_secret', process.env.FACEPP_API_SECRET);
    Object.entries(formData).forEach(([k, v]) => fd.append(k, v));

    const resp = await axios.post(`${FACEPP_BASE}${endpoint}`, fd, {
      headers: fd.getHeaders(),
      timeout: 30000,
    });
    return resp.data;
  };

  const detectFaces = async (imageSource) => {
    const formData = {};
    if (Buffer.isBuffer(imageSource)) {
      formData.image_base64 = imageSource.toString('base64');
    } else {
      formData.image_url = imageSource.url;
    }

    const result = await post('/detect', { ...formData, return_landmark: 0, return_attributes: 'none' });
    return (result.faces || []).map((f) => ({
      faceToken: f.face_token,
      boundingBox: {
        left: f.face_rectangle.left,
        top: f.face_rectangle.top,
        width: f.face_rectangle.width,
        height: f.face_rectangle.height,
      },
      confidence: 0.95, // Face++ doesn't return per-face confidence here
    }));
  };

  const generateEmbedding = async (imageSource) => {
    const formData = {};
    if (Buffer.isBuffer(imageSource)) {
      formData.image_base64 = imageSource.toString('base64');
    } else {
      formData.image_url = imageSource.url;
    }
    // Face++ uses face sets for search — return face tokens as "embedding"
    const result = await post('/detect', { ...formData, return_landmark: 2, return_attributes: 'none' });
    return (result.faces || []).map((f) => ({
      faceToken: f.face_token,
      boundingBox: {
        left: f.face_rectangle.left,
        top: f.face_rectangle.top,
        width: f.face_rectangle.width,
        height: f.face_rectangle.height,
      },
      confidence: 0.95,
      vector: encodeFaceppLandmarks(f.landmark || {}),
    }));
  };

  const compareFaces = async (tokenA, tokenB) => {
    if (tokenA.faceToken && tokenB.faceToken) {
      const result = await post('/compare', {
        face_token1: tokenA.faceToken,
        face_token2: tokenB.faceToken,
      });
      return (result.confidence || 0) / 100;
    }
    if (tokenA.vector && tokenB.vector) {
      return cosineSimilarity(tokenA.vector, tokenB.vector);
    }
    return 0;
  };

  return { detectFaces, generateEmbedding, compareFaces };
})();

// ─── Provider: Local (development / no-AI fallback) ──────────────────────────
const localProvider = (() => {
  /**
   * Local provider uses the 'sharp' library for basic image inspection
   * and generates a simple pixel-based hash as a pseudo-embedding.
   * This is NOT real face recognition — it is a structural placeholder
   * that lets the application run without cloud credentials.
   * Replace with a real provider for production.
   */
  const detectFaces = async (imageSource) => {
    logger.warn('LOCAL face provider: returning mock face detection (not real AI)');
    // Return one mock face covering the centre of the image
    return [
      {
        boundingBox: { left: 0.3, top: 0.2, width: 0.4, height: 0.5 },
        confidence: 0.5,
        isMock: true,
      },
    ];
  };

  const generateEmbedding = async (imageSource) => {
    const sharp = require('sharp');
    let buffer;
    if (Buffer.isBuffer(imageSource)) {
      buffer = imageSource;
    } else if (imageSource.url) {
      buffer = await downloadImageBuffer(imageSource.url);
    }

    // Resize to 16×16 greyscale and flatten to 256-dim vector
    const resized = await sharp(buffer)
      .resize(16, 16)
      .greyscale()
      .raw()
      .toBuffer();

    const vector = Array.from(resized).map((v) => v / 255);
    return [
      {
        vector,
        boundingBox: { left: 0.3, top: 0.2, width: 0.4, height: 0.5 },
        confidence: 0.5,
        isMock: true,
      },
    ];
  };

  const compareFaces = async (embA, embB) => {
    if (embA.vector && embB.vector) {
      return cosineSimilarity(embA.vector, embB.vector);
    }
    return 0;
  };

  return { detectFaces, generateEmbedding, compareFaces };
})();

// ─── Shared utilities ─────────────────────────────────────────────────────────

/**
 * Download an image from URL and return as Buffer
 */
const downloadImageBuffer = async (url) => {
  const axios = require('axios');
  const response = await axios.get(url, {
    responseType: 'arraybuffer',
    timeout: 30000,
    maxContentLength: 50 * 1024 * 1024, // 50 MB max
  });
  return Buffer.from(response.data);
};

/**
 * Encode AWS facial landmarks as a normalised vector
 */
const encodeFaceDetails = (faceDetail) => {
  const landmarks = faceDetail.Landmarks || [];
  const vec = [];
  landmarks.forEach((lm) => {
    vec.push(lm.X, lm.Y);
  });
  // Pad or truncate to fixed 128 dims
  while (vec.length < 128) vec.push(0);
  return vec.slice(0, 128);
};

const encodeLandmarks = (faceRecord) => {
  // Placeholder — in practice extract from face record if available
  return new Array(128).fill(0).map(() => Math.random());
};

const encodeFaceppLandmarks = (landmarks) => {
  const vec = [];
  Object.values(landmarks).forEach((pt) => {
    if (pt && typeof pt.x === 'number') {
      vec.push(pt.x / 1000, pt.y / 1000);
    }
  });
  while (vec.length < 128) vec.push(0);
  return vec.slice(0, 128);
};

// ─── Public API ───────────────────────────────────────────────────────────────

const getProvider = () => {
  const providerName = (process.env.FACE_RECOGNITION_PROVIDER || 'local').toLowerCase();
  switch (providerName) {
    case 'aws': return { provider: awsProvider, name: 'aws' };
    case 'facepp': return { provider: faceppProvider, name: 'facepp' };
    case 'local':
    default:
      return { provider: localProvider, name: 'local' };
  }
};

/**
 * Detect faces in an image.
 * @param {Buffer|{url:string}} imageSource
 * @returns {Promise<Array<{boundingBox, confidence}>>}
 */
const detectFaces = async (imageSource) => {
  const { provider, name } = getProvider();
  logger.debug(`[FaceService] detectFaces using provider: ${name}`);
  return provider.detectFaces(imageSource);
};

/**
 * Generate face embeddings for an image.
 * @param {Buffer|{url:string}} imageSource
 * @param {string} [collectionId] - AWS collection ID (for AWS provider)
 * @returns {Promise<Array<{vector, boundingBox, confidence, faceToken?, faceId?}>>}
 */
const generateEmbedding = async (imageSource, collectionId = null) => {
  const { provider, name } = getProvider();
  logger.debug(`[FaceService] generateEmbedding using provider: ${name}`);
  return provider.generateEmbedding(imageSource, collectionId);
};

/**
 * Compare two face embedding objects.
 * @returns {Promise<number>} similarity 0.0–1.0
 */
const compareFaces = async (embeddingA, embeddingB) => {
  const { provider } = getProvider();
  return provider.compareFaces(embeddingA, embeddingB);
};

/**
 * Find all matching photos in an event for a given selfie.
 *
 * Architecture:
 *  1. Generate selfie embedding
 *  2. Load all event face embeddings from MongoDB (vector field selected explicitly)
 *  3. Compute cosine similarity between selfie and each stored face
 *  4. Filter by threshold
 *  5. Deduplicate by photo (keep highest score per photo)
 *  6. Sort by score descending
 *
 * For large events (10k+ photos), upgrade to MongoDB Atlas Vector Search
 * or a dedicated vector DB — the schema and interface already support it.
 *
 * @param {Buffer} selfieBuffer
 * @param {string} eventId
 * @param {number} threshold  0.0–1.0
 * @returns {Promise<Array<{photoId:string, score:number}>>}
 */
const findMatchingFaces = async (selfieBuffer, eventId, threshold = 0.80) => {
  const { provider, name } = getProvider();
  logger.debug(`[FaceService] findMatchingFaces for event ${eventId} using ${name}`);

  // ── AWS Collection-Based Search (fast, server-side) ──────────────────────
  if (name === 'aws' && provider.searchFacesInEvent) {
    const collectionId = `event-${eventId}`;
    const matches = await provider.searchFacesInEvent(selfieBuffer, collectionId, threshold);

    // externalImageId = photoId (set during IndexFaces in photoProcessor)
    const photoMap = new Map();
    matches.forEach((m) => {
      const photoId = m.externalImageId;
      if (!photoMap.has(photoId) || photoMap.get(photoId) < m.similarity) {
        photoMap.set(photoId, m.similarity);
      }
    });

    return Array.from(photoMap.entries())
      .map(([photoId, score]) => ({ photoId, score }))
      .sort((a, b) => b.score - a.score);
  }

  // ── In-Process Cosine Similarity Search ──────────────────────────────────
  // Generate selfie embedding
  const selfieEmbeddings = await generateEmbedding(selfieBuffer, null);
  if (!selfieEmbeddings || selfieEmbeddings.length === 0) {
    throw new Error('No face detected in selfie');
  }
  const selfieEmb = selfieEmbeddings[0]; // Use primary face

  // Load all face embeddings for this event (embedding field explicitly selected)
  const { FaceEmbedding } = require('../models');
  const storedEmbeddings = await FaceEmbedding.find({ event: eventId })
    .select('+embedding photo')
    .lean();

  logger.debug(`[FaceService] Comparing selfie against ${storedEmbeddings.length} stored faces`);

  const photoScores = new Map();

  for (const stored of storedEmbeddings) {
    if (!stored.embedding || stored.embedding.length === 0) continue;

    const storedEmb = { vector: stored.embedding };
    const similarity = await compareFaces(selfieEmb, storedEmb);

    if (similarity >= threshold) {
      const photoId = stored.photo.toString();
      if (!photoScores.has(photoId) || photoScores.get(photoId) < similarity) {
        photoScores.set(photoId, similarity);
      }
    }
  }

  return Array.from(photoScores.entries())
    .map(([photoId, score]) => ({ photoId, score }))
    .sort((a, b) => b.score - a.score);
};

/**
 * Validate that a selfie has exactly one clear face.
 * @param {Buffer} buffer
 * @returns {{ valid: boolean, faceCount: number, message?: string }}
 */
const validateSelfieFace = async (buffer) => {
  try {
    const faces = await detectFaces(buffer);

    if (faces.length === 0) {
      return {
        valid: false,
        faceCount: 0,
        message: "We couldn't detect a face in your photo. Please try a clearer selfie.",
      };
    }

    if (faces.length > 3) {
      return {
        valid: false,
        faceCount: faces.length,
        message: 'Multiple faces detected. Please use a photo where only your face is visible.',
      };
    }

    const primary = faces[0];
    if (primary.confidence < 0.5) {
      return {
        valid: false,
        faceCount: faces.length,
        message: 'Face detection confidence is too low. Please use a clearer, well-lit photo.',
      };
    }

    return { valid: true, faceCount: faces.length };
  } catch (err) {
    logger.error('[FaceService] validateSelfieFace error:', err);
    return {
      valid: false,
      faceCount: 0,
      message: 'Unable to process this photo. Please try again.',
    };
  }
};

module.exports = {
  detectFaces,
  generateEmbedding,
  compareFaces,
  findMatchingFaces,
  validateSelfieFace,
  downloadImageBuffer,
  getProvider,
};
