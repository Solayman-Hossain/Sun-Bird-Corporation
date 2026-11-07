import { Router } from 'express';
import { ReviewController } from '../../controllers/ReviewController';

const router = Router();

// GET /api/v1/public/reviews/:productId
router.get('/:productId', ReviewController.getProductReviews);

// POST /api/v1/public/reviews
router.post('/', ReviewController.submitReview);

export default router;

