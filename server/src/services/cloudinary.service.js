'use strict';
const cloudinary = require('../config/cloudinary');
const logger = require('../utils/logger');
const streamifier = require('streamifier');
const { env } = require('../config/env');

/**
 * Uploads a file buffer to Cloudinary using upload_stream.
 * @param {Buffer} buffer - The file buffer from multer.memoryStorage().
 * @param {string} folder - The Cloudinary folder to upload to.
 * @param {string} originalName - Original filename to determine resource_type if needed.
 * @returns {Promise<Object>} The Cloudinary upload result.
 */
function uploadFile(buffer, folder, originalName = '') {
  return new Promise((resolve, reject) => {
    // Bypass Cloudinary for dummy credentials
    if (env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_KEY.includes('dummy')) {
      logger.info(`[Testing Bypass] Mocking upload to folder: ${folder}`);
      return resolve({
        secure_url: `https://dummy.cloudinary.com/${folder}/${Date.now()}_${originalName}`,
        public_id: `dummy_${folder}_${Date.now()}`,
        resource_type: 'auto'
      });
    }
    // Determine resource_type based on file extension to prevent uploading arbitrary executables
    let resource_type = 'image';
    const ext = originalName.toLowerCase().split('.').pop();
    if (ext === 'pdf') {
      resource_type = 'raw'; 
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type,
      },
      (error, result) => {
        if (error) {
          logger.error(`Cloudinary upload failed: ${error.message}`);
          return reject(error);
        }
        resolve(result);
      }
    );

    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
}

/**
 * Deletes a file from Cloudinary by its public_id.
 * @param {string} publicId - The Cloudinary public_id of the asset.
 */
async function deleteFile(publicId) {
  if (!publicId) return;

  // Bypass Cloudinary for dummy credentials
  if (env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_KEY.includes('dummy')) {
    logger.info(`[Testing Bypass] Mocking deletion for publicId: ${publicId}`);
    return;
  }

  try {
    // If it's a PDF uploaded as raw, resource_type must be 'raw'.
    // If we uploaded everything as 'auto', Cloudinary automatically assigns resource_type ('image', 'raw', etc.).
    // Let's try to delete. We can just use destroy. If we need to specify resource_type, we might need it.
    // For safety, we can delete image and raw.
    await cloudinary.uploader.destroy(publicId);
    // Also try raw in case it was a raw PDF
    await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' });
    
    logger.info(`Deleted file from Cloudinary: ${publicId}`);
  } catch (err) {
    logger.error(`Failed to delete file ${publicId}: ${err.message}`);
  }
}

/**
 * Gets a download URL for a file.
 * Cloudinary secure_urls are public by default unless restricted.
 * If we need a signed URL, Cloudinary supports signed delivery URLs, but for now we can just return the URL.
 * @param {string} publicId - The Cloudinary public_id
 * @param {string} secureUrl - The stored secure_url
 */
async function getSignedDownloadUrl(publicId, secureUrl) {
  // If we just have the secureUrl, return it. If we need a signed URL, we can generate it.
  // For simplicity and matching the previous signature, we return the secure URL.
  // We can also use cloudinary.url(publicId, { secure: true, sign_url: true }) if strict auth is needed.
  return secureUrl || cloudinary.url(publicId, { secure: true });
}

function publicUrl(publicId) {
  return cloudinary.url(publicId, { secure: true });
}

module.exports = { uploadFile, deleteFile, getSignedDownloadUrl, publicUrl };
