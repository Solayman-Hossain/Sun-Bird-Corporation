import { Router } from 'express';
import { AuditLogController } from '../../controllers/AuditLogController';
import { authGuard } from '../../middlewares/authGuard';
import { hasPermission } from '../../middlewares/rbacGuard';

const router = Router();

/**
 * @route   GET /api/v1/erp/audit-logs/reports
 * @desc    Aggregate compliance audit reports
 * @access  Bearer JWT (audit:READ)
 */
router.get(
  '/reports',
  authGuard,
  hasPermission('audit', 'READ'),
  AuditLogController.getAuditReports
);

/**
 * @route   POST /api/v1/erp/audit-logs/diff
 * @desc    Compute before-and-after change diffs
 * @access  Bearer JWT
 */
router.post('/diff', authGuard, AuditLogController.computeDiff);

/**
 * @route   GET /api/v1/erp/audit-logs/history/:collection/:id
 * @desc    Retrieves full chronological change history for a specific business document
 * @access  Bearer JWT (audit:READ)
 */
router.get(
  '/history/:collection/:id',
  authGuard,
  hasPermission('audit', 'READ'),
  AuditLogController.getResourceHistory
);

/**
 * @route   GET /api/v1/erp/audit-logs
 * @desc    Queries chronological immutable database audit trail
 * @access  Bearer JWT (audit:READ)
 */
router.get(
  '/',
  authGuard,
  hasPermission('audit', 'READ'),
  AuditLogController.getAuditLogs
);

/**
 * @route   GET /api/v1/erp/audit-logs/:id
 * @desc    Retrieve single audit record
 * @access  Bearer JWT (audit:READ)
 */
router.get(
  '/:id',
  authGuard,
  hasPermission('audit', 'READ'),
  AuditLogController.getAuditLogById
);

export default router;
