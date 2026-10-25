import { Router } from 'express';
import { SalesController } from '../../controllers/SalesController';
import { validateRequest } from '../../middlewares/validateRequest';
import { publicCheckoutSchema } from '../../validators/sales.validator';

const router = Router();

/**
 * @route   POST /api/v1/public/checkout
 * @desc    Public storefront e-commerce checkout
 * @access  Public
 */
router.post(
  '/',
  validateRequest({ body: publicCheckoutSchema }),
  SalesController.publicCheckout
);

export default router;
