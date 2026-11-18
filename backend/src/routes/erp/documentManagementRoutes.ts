import { Router } from 'express';
import { DocumentManagementController } from '../../controllers/DocumentManagementController';
import { authGuard } from '../../middlewares/authGuard';
import { hasPermission } from '../../middlewares/rbacGuard';

const router = Router();

// ─── 01. DASHBOARD ──────────────────────────────────────────────────────────
router.get(
  '/dashboard',
  authGuard,
  hasPermission('documents', 'READ'),
  DocumentManagementController.getDashboard
);

// ─── 02. TEMPLATES ──────────────────────────────────────────────────────────
router.get(
  '/templates',
  authGuard,
  hasPermission('documents', 'READ'),
  DocumentManagementController.listTemplates
);
router.post(
  '/templates',
  authGuard,
  hasPermission('documents', 'CREATE'),
  DocumentManagementController.createTemplate
);
router.post(
  '/templates/seed-defaults',
  authGuard,
  hasPermission('documents', 'CREATE'),
  DocumentManagementController.seedDefaultTemplates
);
router.get(
  '/templates/:id',
  authGuard,
  hasPermission('documents', 'READ'),
  DocumentManagementController.getTemplate
);
router.put(
  '/templates/:id',
  authGuard,
  hasPermission('documents', 'UPDATE'),
  DocumentManagementController.updateTemplate
);
router.post(
  '/templates/:id/duplicate',
  authGuard,
  hasPermission('documents', 'CREATE'),
  DocumentManagementController.duplicateTemplate
);
router.post(
  '/templates/:id/set-default',
  authGuard,
  hasPermission('documents', 'UPDATE'),
  DocumentManagementController.setDefaultTemplate
);
router.delete(
  '/templates/:id',
  authGuard,
  hasPermission('documents', 'DELETE'),
  DocumentManagementController.deleteTemplate
);

// ─── 03. SALES QUOTATIONS ───────────────────────────────────────────────────
router.get(
  '/quotations',
  authGuard,
  hasPermission('documents', 'READ'),
  DocumentManagementController.listQuotations
);
router.post(
  '/quotations',
  authGuard,
  hasPermission('documents', 'CREATE'),
  DocumentManagementController.createQuotation
);
router.get(
  '/quotations/:id',
  authGuard,
  hasPermission('documents', 'READ'),
  DocumentManagementController.getQuotation
);
router.post(
  '/quotations/:id/approve',
  authGuard,
  hasPermission('documents', 'APPROVE'),
  DocumentManagementController.approveQuotation
);

// ─── 04. PROFORMA INVOICES ──────────────────────────────────────────────────
router.get(
  '/proforma-invoices',
  authGuard,
  hasPermission('documents', 'READ'),
  DocumentManagementController.listProformas
);
router.post(
  '/proforma-invoices',
  authGuard,
  hasPermission('documents', 'CREATE'),
  DocumentManagementController.createProforma
);
router.get(
  '/proforma-invoices/:id',
  authGuard,
  hasPermission('documents', 'READ'),
  DocumentManagementController.getProforma
);

// ─── 05. MONEY RECEIPTS ─────────────────────────────────────────────────────
router.get(
  '/money-receipts',
  authGuard,
  hasPermission('documents', 'READ'),
  DocumentManagementController.listReceipts
);
router.post(
  '/money-receipts',
  authGuard,
  hasPermission('documents', 'CREATE'),
  DocumentManagementController.createReceipt
);
router.get(
  '/money-receipts/:id',
  authGuard,
  hasPermission('documents', 'READ'),
  DocumentManagementController.getReceipt
);
router.post(
  '/money-receipts/:id/post',
  authGuard,
  hasPermission('documents', 'APPROVE'),
  DocumentManagementController.postReceipt
);

// ─── 06. CREDIT NOTES ───────────────────────────────────────────────────────
router.get(
  '/credit-notes',
  authGuard,
  hasPermission('documents', 'READ'),
  DocumentManagementController.listCreditNotes
);
router.post(
  '/credit-notes',
  authGuard,
  hasPermission('documents', 'CREATE'),
  DocumentManagementController.createCreditNote
);
router.get(
  '/credit-notes/:id',
  authGuard,
  hasPermission('documents', 'READ'),
  DocumentManagementController.getCreditNote
);
router.post(
  '/credit-notes/:id/post',
  authGuard,
  hasPermission('documents', 'APPROVE'),
  DocumentManagementController.postCreditNote
);

// ─── 07. UNIVERSAL PREVIEW & PDF ────────────────────────────────────────────
router.get(
  '/preview/:docType/:id',
  authGuard,
  hasPermission('documents', 'READ'),
  DocumentManagementController.previewDocument
);
router.get(
  '/pdf/:docType/:id',
  authGuard,
  hasPermission('documents', 'READ'),
  DocumentManagementController.downloadDocumentPdf
);

// ─── 08. BRANDING & ASSETS ──────────────────────────────────────────────────
router.get(
  '/branding/:orgId',
  authGuard,
  hasPermission('documents', 'READ'),
  DocumentManagementController.getBranding
);
router.post(
  '/branding/:orgId',
  authGuard,
  hasPermission('documents', 'UPDATE'),
  DocumentManagementController.updateBranding
);

export default router;
