'use strict';
const { DeleteObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl }  = require('@aws-sdk/s3-request-presigner');
const s3                = require('../config/spaces');
const { env }           = require('../config/env');
const logger            = require('../utils/logger');

/**
 * Deletes an object from Spaces by its key.
 */
async function deleteFile(key) {
  if (!key) return;

  try {
    await s3.send(new DeleteObjectCommand({
      Bucket: env.DO_SPACES_BUCKET,
      Key:    key,
    }));
    logger.info(`Deleted file from Spaces: ${key}`);
  } catch (err) {
    logger.error(`Failed to delete file ${key}: ${err.message}`);
  }
}

/**
 * Generates a temporary pre-signed GET URL (1 hour) for private files.
 * Use this when exposing payment screenshots / submissions to admins.
 */
async function getSignedDownloadUrl(key, expiresInSeconds = 3600) {

  const command = new GetObjectCommand({
    Bucket: env.DO_SPACES_BUCKET,
    Key:    key,
  });
  return getSignedUrl(s3, command, { expiresIn: expiresInSeconds });
}

/**
 * Returns the public CDN URL for an object key (only works if ACL is 'public-read').
 * Used for profile pictures; payment/submission files are always private.
 */
function publicUrl(key) {
  return `${env.DO_SPACES_CDN_URL}/${key}`;
}

module.exports = { deleteFile, getSignedDownloadUrl, publicUrl };
