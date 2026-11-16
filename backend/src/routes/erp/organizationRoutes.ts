import { Router } from 'express';
import { OrganizationController } from '../../controllers/OrganizationController';
import { authGuard } from '../../middlewares/authGuard';
import { hasPermission } from '../../middlewares/rbacGuard';
import { validateRequest } from '../../middlewares/validateRequest';
import {
  createOrganizationSchema,
  updateOrganizationSchema,
  updateBrandingSchema,
  bankAccountSchema,
  signatorySchema,
  stampSchema,
  documentConfigSchema,
  financialSettingsSchema,
} from '../../validators/organization.validator';

const router = Router();

// ─── Dashboard Stats & Default Organization ───
router.get(
  '/stats',
  authGuard,
  hasPermission('ORGANIZATION', 'READ'),
  OrganizationController.getDashboardStats
);

router.get('/default', authGuard, OrganizationController.getDefaultOrganization);

// ─── Organization CRUD ───
router.get(
  '/',
  authGuard,
  hasPermission('ORGANIZATION', 'READ'),
  OrganizationController.getOrganizations
);

router.post(
  '/',
  authGuard,
  hasPermission('ORGANIZATION', 'CREATE'),
  validateRequest({ body: createOrganizationSchema }),
  OrganizationController.createOrganization
);

router.get(
  '/:id',
  authGuard,
  hasPermission('ORGANIZATION', 'READ'),
  OrganizationController.getOrganizationById
);

router.put(
  '/:id',
  authGuard,
  hasPermission('ORGANIZATION', 'UPDATE'),
  validateRequest({ body: updateOrganizationSchema }),
  OrganizationController.updateOrganization
);

router.patch(
  '/:id/status',
  authGuard,
  hasPermission('ORGANIZATION', 'UPDATE'),
  OrganizationController.setStatus
);

router.patch(
  '/:id/default',
  authGuard,
  hasPermission('ORGANIZATION', 'UPDATE'),
  OrganizationController.setDefault
);

// ─── Logo & Branding ───
router.get(
  '/:id/branding',
  authGuard,
  hasPermission('ORGANIZATION', 'READ'),
  OrganizationController.getBranding
);

router.put(
  '/:id/branding',
  authGuard,
  hasPermission('ORGANIZATION', 'UPDATE'),
  validateRequest({ body: updateBrandingSchema }),
  OrganizationController.updateBranding
);

// ─── Bank Accounts ───
router.get(
  '/:id/banks',
  authGuard,
  hasPermission('ORGANIZATION', 'READ'),
  OrganizationController.getBankAccounts
);

router.post(
  '/:id/banks',
  authGuard,
  hasPermission('ORGANIZATION', 'UPDATE'),
  validateRequest({ body: bankAccountSchema }),
  OrganizationController.addBankAccount
);

router.put(
  '/:id/banks/:bankId',
  authGuard,
  hasPermission('ORGANIZATION', 'UPDATE'),
  validateRequest({ body: bankAccountSchema.partial() }),
  OrganizationController.updateBankAccount
);

router.delete(
  '/:id/banks/:bankId',
  authGuard,
  hasPermission('ORGANIZATION', 'UPDATE'),
  OrganizationController.deleteBankAccount
);

// ─── Signatories ───
router.get(
  '/:id/signatures',
  authGuard,
  hasPermission('ORGANIZATION', 'READ'),
  OrganizationController.getSignatories
);

router.post(
  '/:id/signatures',
  authGuard,
  hasPermission('ORGANIZATION', 'UPDATE'),
  validateRequest({ body: signatorySchema }),
  OrganizationController.addSignatory
);

router.put(
  '/:id/signatures/:sigId',
  authGuard,
  hasPermission('ORGANIZATION', 'UPDATE'),
  validateRequest({ body: signatorySchema.partial() }),
  OrganizationController.updateSignatory
);

router.delete(
  '/:id/signatures/:sigId',
  authGuard,
  hasPermission('ORGANIZATION', 'UPDATE'),
  OrganizationController.deleteSignatory
);

// ─── Official & Approval Stamps ───
router.get(
  '/:id/stamps',
  authGuard,
  hasPermission('ORGANIZATION', 'READ'),
  OrganizationController.getStamps
);

router.post(
  '/:id/stamps',
  authGuard,
  hasPermission('ORGANIZATION', 'UPDATE'),
  validateRequest({ body: stampSchema }),
  OrganizationController.addStamp
);

router.put(
  '/:id/stamps/:stampId',
  authGuard,
  hasPermission('ORGANIZATION', 'UPDATE'),
  validateRequest({ body: stampSchema.partial() }),
  OrganizationController.updateStamp
);

router.delete(
  '/:id/stamps/:stampId',
  authGuard,
  hasPermission('ORGANIZATION', 'UPDATE'),
  OrganizationController.deleteStamp
);

// ─── Document Configuration ───
router.get(
  '/:id/documents',
  authGuard,
  hasPermission('ORGANIZATION', 'READ'),
  OrganizationController.getDocumentConfig
);

router.put(
  '/:id/documents',
  authGuard,
  hasPermission('ORGANIZATION', 'UPDATE'),
  validateRequest({ body: documentConfigSchema }),
  OrganizationController.updateDocumentConfig
);

// ─── Financial Settings ───
router.get(
  '/:id/financials',
  authGuard,
  hasPermission('ORGANIZATION', 'READ'),
  OrganizationController.getFinancialSettings
);

router.put(
  '/:id/financials',
  authGuard,
  hasPermission('ORGANIZATION', 'UPDATE'),
  validateRequest({ body: financialSettingsSchema }),
  OrganizationController.updateFinancialSettings
);

// ─── Activity Logs ───
router.get(
  '/:id/logs',
  authGuard,
  hasPermission('ORGANIZATION', 'READ'),
  OrganizationController.getActivityLogs
);

export default router;

