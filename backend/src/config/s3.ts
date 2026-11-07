import { S3Client } from '@aws-sdk/client-s3';
import env from './env';

/**
 * AWS S3 Client Configuration
 * Configured using environment variables (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, AWS_S3_BUCKET)
 * with graceful fallback to MinIO / local S3 settings when applicable.
 */
export const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID || env.AWS_ACCESS_KEY_ID || env.S3_ACCESS_KEY_ID || 'minioadmin';
export const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY || env.AWS_SECRET_ACCESS_KEY || env.S3_SECRET_ACCESS_KEY || 'minioadmin';
export const AWS_REGION = process.env.AWS_REGION || env.AWS_REGION || env.S3_REGION || 'ap-southeast-1';
export const AWS_S3_BUCKET = process.env.AWS_S3_BUCKET || env.AWS_S3_BUCKET || env.S3_BUCKET_NAME || 'sunbird-documents';

export const s3Client = new S3Client({
  region: AWS_REGION,
  credentials: {
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
  },
  ...(env.S3_ENDPOINT
    ? {
        endpoint: env.S3_ENDPOINT,
        forcePathStyle: env.S3_USE_PATH_STYLE,
      }
    : {}),
});

export default s3Client;
