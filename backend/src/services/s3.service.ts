import { PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import s3Client, { AWS_S3_BUCKET, AWS_REGION } from '../config/s3';
import env from '../config/env';
import { ValidationError } from '../errors/AppError';

export const ALLOWED_FILE_TYPES = ['image/webp', 'image/jpeg', 'image/png'] as const;
export type AllowedFileType = (typeof ALLOWED_FILE_TYPES)[number];

export interface PresignedUploadResponse {
  uploadUrl: string;
  fileUrl: string;
}

export class S3Service {
  /**
   * Generates a pre-signed PUT URL for client-side upload to S3/MinIO.
   *
   * @param fileName Original file name
   * @param fileType MIME type of the file ('image/webp', 'image/jpeg', 'image/png')
   * @param folder S3 folder prefix ('listings', 'nid', 'selfies', etc.)
   * @returns Object containing { uploadUrl, fileUrl }
   */
  async generatePresignedUploadUrl(
    fileName: string,
    fileType: string,
    folder: string = 'listings'
  ): Promise<PresignedUploadResponse> {
    if (!fileType || !ALLOWED_FILE_TYPES.includes(fileType as AllowedFileType)) {
      throw new ValidationError(
        `Invalid fileType: '${fileType}'. Allowed types are: ${ALLOWED_FILE_TYPES.join(', ')}`
      );
    }

    if (!fileName || typeof fileName !== 'string' || fileName.trim().length === 0) {
      throw new ValidationError('fileName is required and cannot be empty.');
    }

    // Clean filename to prevent path traversal or special character issues
    const sanitizedFileName = fileName.trim().replace(/[^a-zA-Z0-9._-]/g, '_');
    const uniqueId = uuidv4();
    const cleanFolder = (folder || 'listings').trim().replace(/^\/+|\/+$/g, '');
    const s3Key = `${cleanFolder}/${uniqueId}_${sanitizedFileName}`;

    const command = new PutObjectCommand({
      Bucket: AWS_S3_BUCKET,
      Key: s3Key,
      ContentType: fileType,
    });

    // 5-minute expiration = 300 seconds
    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });

    // Determine permanent public S3 URL
    let fileUrl: string;
    if (env.S3_ENDPOINT) {
      const endpointTrimmed = env.S3_ENDPOINT.replace(/\/+$/, '');
      fileUrl = `${endpointTrimmed}/${AWS_S3_BUCKET}/${s3Key}`;
    } else {
      fileUrl = `https://${AWS_S3_BUCKET}.s3.${AWS_REGION}.amazonaws.com/${s3Key}`;
    }

    return {
      uploadUrl,
      fileUrl,
    };
  }

  /**
   * Generates a pre-signed GET URL with 5-minute expiration.
   * Used by authorized users/admins to view private/encrypted assets (e.g. NID photos).
   *
   * @param fileKey S3 object key
   * @returns Signed GET URL string
   */
  async generatePresignedReadUrl(fileKey: string): Promise<string> {
    if (!fileKey || typeof fileKey !== 'string' || fileKey.trim().length === 0) {
      throw new ValidationError('fileKey is required.');
    }

    const command = new GetObjectCommand({
      Bucket: AWS_S3_BUCKET,
      Key: fileKey.trim(),
    });

    // 5-minute expiration = 300 seconds
    const readUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });
    return readUrl;
  }
}

export const s3Service = new S3Service();
export const generatePresignedUploadUrl = (
  fileName: string,
  fileType: string,
  folder: string = 'listings'
) => s3Service.generatePresignedUploadUrl(fileName, fileType, folder);

export const generatePresignedReadUrl = (fileKey: string) =>
  s3Service.generatePresignedReadUrl(fileKey);

export default s3Service;

