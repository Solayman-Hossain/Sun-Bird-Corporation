import { Router } from 'express';
import { AssetController } from '../../controllers/AssetController';
import { authGuard } from '../../middlewares/authGuard';
import { hasPermission } from '../../middlewares/rbacGuard';
import { idempotency } from '../../middlewares/idempotency';
import { validateRequest } from '../../middlewares/validateRequest';
import {
  registerAssetSchema,
  runDepreciationSchema,
  disposeAssetSchema,
} from '../../validators/accounting.validator';

const router = Router();

// ── Fixed Asset Register & SLM Depreciation (§6.4) ───────────────────────────
router.post(
  '/',
  authGuard,
  hasPermission('accounting', 'CREATE'),
  idempotency(),
  validateRequest({ body: registerAssetSchema }),
  AssetController.registerAsset
);

router.get(
  '/',
  authGuard,
  hasPermission('accounting', 'READ'),
  AssetController.getAssets
);

router.get(
  '/:id',
  authGuard,
  hasPermission('accounting', 'READ'),
  AssetController.getAssetById
);

router.post(
  '/run-depreciation',
  authGuard,
  hasPermission('accounting', 'UPDATE'),
  idempotency(),
  validateRequest({ body: runDepreciationSchema }),
  AssetController.runMonthlyDepreciation
);

router.post(
  '/:id/dispose',
  authGuard,
  hasPermission('accounting', 'UPDATE'),
  idempotency(),
  validateRequest({ body: disposeAssetSchema }),
  AssetController.disposeAsset
);

export default router;
