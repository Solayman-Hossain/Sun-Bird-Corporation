import { Router } from 'express';
import { PosController } from '../../controllers/PosController';
import { authGuard } from '../../middlewares/authGuard';
import { hasPermission } from '../../middlewares/rbacGuard';
import { validateRequest } from '../../middlewares/validateRequest';
import { posCheckoutSchema, posOfflineSyncSchema } from '../../validators/pos.validator';

const router = Router();

/**
 * @route   POST /api/v1/erp/pos/checkout
 * @desc    Showroom POS terminal direct checkout
 * @access  Bearer JWT (pos:CREATE)
 */
router.post(
  '/checkout',
  authGuard,
  hasPermission('pos', 'CREATE'),
  validateRequest({ body: posCheckoutSchema }),
  PosController.checkout
);

/**
 * @route   POST /api/v1/erp/pos/sync-offline-batch
 * @desc    Batch synchronize offline POS billing transactions
 * @access  Bearer JWT (pos:CREATE)
 */
router.post(
  '/sync-offline-batch',
  authGuard,
  hasPermission('pos', 'CREATE'),
  validateRequest({ body: posOfflineSyncSchema }),
  PosController.syncOfflineBatch
);

export default router;
