import { Router } from 'express';
import { ReviewController } from '../../controllers/ReviewController';

const router = Router();

// GET /api/v1/erp/reviews
router.get('/', ReviewController.getModerationQueue);

// PATCH /api/v1/erp/reviews/:id/moderate
router.patch('/:id/moderate', ReviewController.moderateReview);

export default router;

