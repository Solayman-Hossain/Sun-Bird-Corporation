import { Router } from 'express';
import { AuditLogController } from '../../controllers/AuditLogController';
import { authGuard } from '../../middlewares/authGuard';
import { hasPermission } from '../../middlewares/rbacGuard';

const router = Router();

// ── Immutable Audit Trail (§20 & §22) ───────────────────────────────────────

router.get(
  '/',
  authGuard,
  hasPermission('audit', 'READ'),
  AuditLogController.getAuditLogs
);

router.get(
  '/history/:collection/:id',
  authGuard,
  hasPermission('audit', 'READ'),
  AuditLogController.getResourceHistory
);

export default router;
