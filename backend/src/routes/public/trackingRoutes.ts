import { Router } from 'express';
import { LogisticsController } from '../../controllers/LogisticsController';

const router = Router();

/**
 * @route   GET /api/v1/public/track-order/:trackingCode
 * @desc    Public shipment AWB tracking without sensitive pricing details
 * @access  Public
 */
router.get('/:trackingCode', LogisticsController.trackOrderPublic);

export default router;
