import * as Minio from 'minio';
import crypto from 'crypto';
import path from 'path';
import config from '../config/index.js';

let minioClient = null;

export const getMinioClient = () => {
  if (!minioClient) {
    minioClient = new Minio.Client({
      endPoint: config.minio.endPoint,
      port: config.minio.port,
      useSSL: config.minio.useSSL,
      accessKey: config.minio.accessKey,
      secretKey: config.minio.secretKey,
    });
    console.log(`[MINIO PROVIDER] Initialized MinIO client for ${config.minio.endPoint}:${config.minio.port}`);
  }
  return minioClient;
};

/**
 * Ensure configured MinIO bucket exists
 */
export const ensureBucketExists = async () => {
  const client = getMinioClient();
  const bucketName = config.minio.bucket;

  try {
    const exists = await client.bucketExists(bucketName);
    if (!exists) {
      await client.makeBucket(bucketName);
      console.log(`[MINIO PROVIDER] Created bucket '${bucketName}'`);
    }
  } catch (err) {
    console.warn(`[MINIO PROVIDER WARNING] Bucket check/creation failed for '${bucketName}':`, err.message);
  }
};

/**
 * Upload image buffer to MinIO bucket
 * @param {Buffer} buffer
 * @param {string} mimeType
 * @param {string} originalName
 * @returns {Promise<string>} Generated objectKey
 */
export const uploadImage = async (buffer, mimeType, originalName = '') => {
  await ensureBucketExists();
  const client = getMinioClient();

  const extMap = {
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
  };

  const ext = extMap[mimeType] || path.extname(originalName) || '.jpg';
  const objectKey = `products/${crypto.randomUUID()}${ext}`;

  await client.putObject(config.minio.bucket, objectKey, buffer, buffer.length, {
    'Content-Type': mimeType,
  });

  console.log(`[MINIO UPLOAD SUCCESS] Uploaded image to key: ${objectKey}`);
  return objectKey;
};

/**
 * Get readable image stream from MinIO
 * @param {string} objectKey
 */
export const getObjectStream = async (objectKey) => {
  const client = getMinioClient();
  return await client.getObject(config.minio.bucket, objectKey);
};

/**
 * Remove image object from MinIO
 * @param {string} objectKey
 */
export const deleteImage = async (objectKey) => {
  if (!objectKey) return;
  const client = getMinioClient();
  try {
    await client.removeObject(config.minio.bucket, objectKey);
    console.log(`[MINIO DELETE SUCCESS] Deleted object key: ${objectKey}`);
  } catch (err) {
    console.warn(`[MINIO DELETE WARNING] Failed to delete key '${objectKey}':`, err.message);
  }
};

export default {
  getMinioClient,
  ensureBucketExists,
  uploadImage,
  getObjectStream,
  deleteImage,
};
