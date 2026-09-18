const cloudinary = require('cloudinary').v2;
const logger = require('../utils/logger');

const configureCloudinary = () => {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });

  logger.info('Cloudinary configured');
};

/**
 * Upload a file buffer to Cloudinary
 */
const uploadToCloudinary = (buffer, options = {}) => {
  return new Promise((resolve, reject) => {
    const defaultOptions = {
      folder: 'qr-photo-finder',
      resource_type: 'image',
      ...options,
    };

    const uploadStream = cloudinary.uploader.upload_stream(
      defaultOptions,
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    uploadStream.end(buffer);
  });
};

/**
 * Upload a file path to Cloudinary
 */
const uploadFileToCloudinary = async (filePath, options = {}) => {
  const defaultOptions = {
    folder: 'qr-photo-finder',
    resource_type: 'image',
    ...options,
  };
  return cloudinary.uploader.upload(filePath, defaultOptions);
};

/**
 * Delete a file from Cloudinary by public ID
 */
const deleteFromCloudinary = async (publicId, resourceType = 'image') => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });
    return result;
  } catch (error) {
    logger.error('Cloudinary delete error:', error);
    throw error;
  }
};

/**
 * Delete multiple files from Cloudinary
 */
const deleteManyFromCloudinary = async (publicIds, resourceType = 'image') => {
  try {
    const result = await cloudinary.api.delete_resources(publicIds, {
      resource_type: resourceType,
    });
    return result;
  } catch (error) {
    logger.error('Cloudinary bulk delete error:', error);
    throw error;
  }
};

/**
 * Generate a signed URL for a private resource
 */
const generateSignedUrl = (publicId, options = {}) => {
  return cloudinary.url(publicId, {
    sign_url: true,
    type: 'authenticated',
    ...options,
  });
};

/**
 * Delete entire folder from Cloudinary
 */
const deleteCloudinaryFolder = async (folderPath) => {
  try {
    // Delete all resources in folder first
    await cloudinary.api.delete_resources_by_prefix(folderPath);
    // Then delete folder
    await cloudinary.api.delete_folder(folderPath);
  } catch (error) {
    logger.error('Cloudinary folder delete error:', error);
    // Don't throw - folder may already be empty/deleted
  }
};

module.exports = {
  cloudinary,
  configureCloudinary,
  uploadToCloudinary,
  uploadFileToCloudinary,
  deleteFromCloudinary,
  deleteManyFromCloudinary,
  generateSignedUrl,
  deleteCloudinaryFolder,
};
