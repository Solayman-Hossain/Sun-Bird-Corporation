import { Router } from 'express';
import { SystemAdminController } from '../../controllers/SystemAdminController';
import { authGuard } from '../../middlewares/authGuard';
import { hasPermission } from '../../middlewares/rbacGuard';
import { validateRequest } from '../../middlewares/validateRequest';
import {
  updateSystemSettingsSchema,
  updateSecurityPolicySchema,
  triggerBackupSchema,
  executeRestoreSchema,
  testIntegrationSchema,
  toggleFeatureFlagSchema,
  dataExchangeJobSchema,
} from '../../validators/systemAdmin.validator';

const router = Router();

// Apply authGuard to all system admin routes
router.use(authGuard);

/**
 * 1. System Dashboard & KPI Metrics
 */
router.get(
  '/dashboard',
  hasPermission('system', 'VIEW'),
  SystemAdminController.getDashboard
);

/**
 * 2. General System Settings
 */
router.get(
  '/settings',
  hasPermission('system', 'VIEW'),
  SystemAdminController.getSettings
);

router.put(
  '/settings',
  hasPermission('system', 'MANAGE_SETTINGS'),
  validateRequest({ body: updateSystemSettingsSchema }),
  SystemAdminController.updateSettings
);

/**
 * 3. Security Policy & Sessions
 */
router.get(
  '/security/policy',
  hasPermission('system', 'SECURITY_CENTER'),
  SystemAdminController.getSecurityPolicy
);

router.put(
  '/security/policy',
  hasPermission('system', 'SECURITY_CENTER'),
  validateRequest({ body: updateSecurityPolicySchema }),
  SystemAdminController.updateSecurityPolicy
);

router.get(
  '/sessions',
  hasPermission('system', 'SECURITY_CENTER'),
  SystemAdminController.getSessions
);

router.post(
  '/sessions/:sessionId/revoke',
  hasPermission('system', 'SECURITY_CENTER'),
  SystemAdminController.revokeSession
);

router.get(
  '/login-history',
  hasPermission('system', 'SECURITY_CENTER'),
  SystemAdminController.getLoginHistory
);

/**
 * 4. Database Monitoring
 */
router.get(
  '/database/metrics',
  hasPermission('system', 'DATABASE_MONITOR'),
  SystemAdminController.getDatabaseMetrics
);

/**
 * 5. Backup & Restore Management
 */
router.post(
  '/backups/trigger',
  hasPermission('system', 'BACKUP_MANAGE'),
  validateRequest({ body: triggerBackupSchema }),
  SystemAdminController.triggerBackup
);

router.get(
  '/backups/history',
  hasPermission('system', 'BACKUP_MANAGE'),
  SystemAdminController.getBackupHistory
);

router.post(
  '/restores/execute',
  hasPermission('system', 'RESTORE_EXECUTE'),
  validateRequest({ body: executeRestoreSchema }),
  SystemAdminController.executeRestore
);

router.get(
  '/restores/history',
  hasPermission('system', 'RESTORE_EXECUTE'),
  SystemAdminController.getRestoreHistory
);

/**
 * 6. File Storage
 */
router.get(
  '/storage/metrics',
  hasPermission('system', 'STORAGE_MANAGE'),
  SystemAdminController.getStorageMetrics
);

/**
 * 7. Integrations Management
 */
router.get(
  '/integrations',
  hasPermission('system', 'INTEGRATIONS_MANAGE'),
  SystemAdminController.getIntegrations
);

router.post(
  '/integrations/test',
  hasPermission('system', 'INTEGRATIONS_MANAGE'),
  validateRequest({ body: testIntegrationSchema }),
  SystemAdminController.testIntegration
);

/**
 * 8. Queues & Background Jobs
 */
router.get(
  '/queues/metrics',
  hasPermission('system', 'QUEUES_MANAGE'),
  SystemAdminController.getQueueMetrics
);

/**
 * 9. Application Logs
 */
router.get(
  '/logs',
  hasPermission('system', 'LOGS_VIEW'),
  SystemAdminController.getLogs
);

/**
 * 10. Feature Flags
 */
router.get(
  '/feature-flags',
  hasPermission('system', 'FEATURE_FLAGS'),
  SystemAdminController.getFeatureFlags
);

router.post(
  '/feature-flags/toggle',
  hasPermission('system', 'FEATURE_FLAGS'),
  validateRequest({ body: toggleFeatureFlagSchema }),
  SystemAdminController.toggleFeatureFlag
);

/**
 * 11. Data Import & Export
 */
router.post(
  '/data-exchange',
  hasPermission('system', 'DATA_IMPORT_EXPORT'),
  validateRequest({ body: dataExchangeJobSchema }),
  SystemAdminController.createDataExchange
);

router.get(
  '/data-exchange/history',
  hasPermission('system', 'DATA_IMPORT_EXPORT'),
  SystemAdminController.getDataExchangeHistory
);

export default router;
