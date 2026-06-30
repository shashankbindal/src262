'use strict';
const { S3Client } = require('@aws-sdk/client-s3');
const { env }      = require('./env');

const s3 = new S3Client({
  endpoint:        env.DO_SPACES_ENDPOINT,
  region:          env.DO_SPACES_REGION,
  credentials: {
    accessKeyId:     env.DO_SPACES_KEY,
    secretAccessKey: env.DO_SPACES_SECRET,
  },
  forcePathStyle: false,
});

module.exports = s3;
