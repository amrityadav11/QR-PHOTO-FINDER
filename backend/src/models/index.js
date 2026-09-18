/**
 * Central export point for all Mongoose models.
 * Import models from here to avoid circular dependency issues.
 */
const User = require('./User');
const Event = require('./Event');
const Photo = require('./Photo');
const FaceEmbedding = require('./FaceEmbedding');
const GuestSearch = require('./GuestSearch');

module.exports = { User, Event, Photo, FaceEmbedding, GuestSearch };
