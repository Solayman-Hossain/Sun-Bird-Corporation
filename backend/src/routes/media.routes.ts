import { Router } from 'express';
import { authGuard } from '../middlewares/authGuard';
import { getPresignedUrl, getPresignedReadUrl } from '../controllers/media.controller';

const router = Router();

/**
 * @route   POST /api/v1/media/presigned-url
 * @desc    Get pre-signed upload URL for client-side S3 upload
 * @access  Protected
 */
router.post('/presigned-url', authGuard, getPresignedUrl);

/**
 * @route   POST /api/v1/media/presigned-read-url
 * @desc    Get pre-signed read URL for private S3 assets
 * @access  Protected
 */
router.post('/presigned-read-url', authGuard, getPresignedReadUrl);

export default router;
