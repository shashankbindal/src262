'use strict';
const cloudinary = require('../config/cloudinary');
const logger = require('../utils/logger');
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
    // Determine extension
    const ext = originalName.toLowerCase().split('.').pop();
    
    // Treat PDFs and standard image types as 'image' resources (Cloudinary's recommended setting)
    const resource_type = (ext === 'pdf' || ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext)) 
      ? 'image' 
      : 'raw';

    const uploadOptions = {
      folder,
      resource_type,
    };

    // If it's a PDF, explicitly set the format to ensure correct parsing
    if (ext === 'pdf') {
      uploadOptions.format = 'pdf';
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          logger.error(`Cloudinary upload failed: ${error.message}`);
          return reject(error);
        }
        resolve(result);
      }
    );

    // Stream the buffer directly to Cloudinary
    uploadStream.end(buffer);
  });
}

/**
 * Deletes a file from Cloudinary by its public_id.
 * @param {string} publicId - The Cloudinary public_id of the asset.
 */
async function deleteFile(publicId) {
  if (!publicId) return;

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
async function getSignedDownloadUrl(publicId, secureUrl, originalName = '') {
  if (!publicId) return secureUrl || '';

  const ext = originalName.toLowerCase().split('.').pop();
  const resource_type = (ext === 'pdf' || ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext)) 
    ? 'image' 
    : 'raw';

  const options = {
    secure: true,
    resource_type,
  };

  if (originalName) {
    const nameWithoutExt = originalName.split('.').slice(0, -1).join('.') || originalName;
    const safeName = nameWithoutExt.replace(/[^a-zA-Z0-9-_]/g, '_');
    options.flags = `attachment:${safeName}`;
    options.sign_url = true;
  }

  return cloudinary.url(publicId, options);
}

function publicUrl(publicId) {
  return cloudinary.url(publicId, { secure: true });
}

module.exports = { uploadFile, deleteFile, getSignedDownloadUrl, publicUrl };
