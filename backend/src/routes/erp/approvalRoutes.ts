import { Router } from 'express';
import { ApprovalRequestController } from '../../controllers/ApprovalRequestController';
import { authGuard } from '../../middlewares/authGuard';
import { hasPermission } from '../../middlewares/rbacGuard';
import { validateRequest } from '../../middlewares/validateRequest';
import { approvalActionSchema } from '../../validators/system-aux.validator';

const router = Router();

// ── Workflow Maker-Checker Approvals (§4) ───────────────────────────────────

router.get(
  '/',
  authGuard,
  hasPermission('approvals', 'READ'),
  ApprovalRequestController.getRequests
);

router.post(
  '/',
  authGuard,
  hasPermission('approvals', 'CREATE'),
  ApprovalRequestController.createRequest
);

router.put(
  '/:id/action',
  authGuard,
  hasPermission('approvals', 'APPROVE'),
  validateRequest({ body: approvalActionSchema }),
  ApprovalRequestController.actionRequest
);

export default router;
