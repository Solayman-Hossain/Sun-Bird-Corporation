import { Router } from 'express';
import { LoanController } from '../../controllers/LoanController';
import { authGuard } from '../../middlewares/authGuard';
import { hasPermission } from '../../middlewares/rbacGuard';
import { idempotency } from '../../middlewares/idempotency';
import { validateRequest } from '../../middlewares/validateRequest';
import {
  createPartnerSchema,
  distributeProfitSchema,
  recordDrawingsSchema,
} from '../../validators/accounting.validator';

const router = Router();

// ── Partnership Capital Accounts & Profit Allocation (§6.6) ──────────────────
router.get(
  '/',
  authGuard,
  hasPermission('accounting', 'READ'),
  LoanController.getPartners
);

router.post(
  '/',
  authGuard,
  hasPermission('accounting', 'CREATE'),
  idempotency(),
  validateRequest({ body: createPartnerSchema }),
  LoanController.createPartner
);

router.post(
  '/distribute-profit',
  authGuard,
  hasPermission('accounting', 'APPROVE'),
  idempotency(),
  validateRequest({ body: distributeProfitSchema }),
  LoanController.distributeProfit
);

router.post(
  '/:id/drawings',
  authGuard,
  hasPermission('accounting', 'UPDATE'),
  idempotency(),
  validateRequest({ body: recordDrawingsSchema }),
  LoanController.recordDrawings
);

export default router;
