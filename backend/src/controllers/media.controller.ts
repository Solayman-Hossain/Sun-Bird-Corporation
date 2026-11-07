import { Request, Response, NextFunction } from 'express';
import s3Service from '../services/s3.service';
import { ValidationError } from '../errors/AppError';

export class MediaController {
  /**
   * @route   POST /api/v1/media/presigned-url
   * @desc    Generates pre-signed S3 upload URL for client-side uploads
   * @access  Protected (Authenticated)
   */
  public static async getPresignedUrl(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { fileName, fileType, folder } = req.body;

      if (!fileName || typeof fileName !== 'string' || fileName.trim().length === 0) {
        throw new ValidationError('fileName is required in request body.');
      }

      if (!fileType || typeof fileType !== 'string' || fileType.trim().length === 0) {
        throw new ValidationError('fileType is required in request body.');
      }

      // Determine folder (default: 'listings', allows 'listings', 'nid', 'selfies')
      let targetFolder = 'listings';
      if (folder && typeof folder === 'string' && folder.trim().length > 0) {
        const allowedFolders = ['listings', 'nid', 'selfies'];
        const trimmed = folder.trim().toLowerCase();
        if (allowedFolders.includes(trimmed)) {
          targetFolder = trimmed;
        } else {
          targetFolder = trimmed;
        }
      }

      const result = await s3Service.generatePresignedUploadUrl(
        fileName,
        fileType,
        targetFolder
      );

      res.status(200).json({
        success: true,
        uploadUrl: result.uploadUrl,
        fileUrl: result.fileUrl,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   POST /api/v1/media/presigned-read-url
   * @desc    Generates pre-signed S3 read URL for encrypted / private assets (e.g., NID)
   * @access  Protected (Admin / Authorized)
   */
  public static async getPresignedReadUrl(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { fileKey } = req.body;

      if (!fileKey || typeof fileKey !== 'string' || fileKey.trim().length === 0) {
        throw new ValidationError('fileKey is required in request body.');
      }

      const signedUrl = await s3Service.generatePresignedReadUrl(fileKey);

      res.status(200).json({
        success: true,
        signedUrl,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const getPresignedUrl = MediaController.getPresignedUrl;
export const getPresignedReadUrl = MediaController.getPresignedReadUrl;
export default MediaController;
