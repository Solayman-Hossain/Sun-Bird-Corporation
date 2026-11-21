import { Router } from 'express';
import { ImportController } from '../../controllers/ImportController';
import { authGuard } from '../../middlewares/authGuard';
import { hasPermission } from '../../middlewares/rbacGuard';
import { validateRequest } from '../../middlewares/validateRequest';
import {
  createImportLcExtendedSchema,
  createProformaInvoiceSchema,
  createLCAmendmentSchema,
  createShipmentSchema,
  addTrackingEventSchema,
  createCustomsClearanceSchema,
  recordImportPaymentSchema,
  uploadDocumentSchema,
  aiQuerySchema,
  aiExtractSchema,
  aiCompareSchema,
} from '../../validators/import.validator';

const router = Router();

// 1. Dashboard & Reports
router.get(
  '/dashboard',
  authGuard,
  hasPermission('import', 'VIEW'),
  ImportController.getDashboard
);

router.get(
  '/reports',
  authGuard,
  hasPermission('import', 'VIEW'),
  ImportController.getReport
);

// 2. Letters of Credit (LC) & Amendments
router.get(
  '/lcs',
  authGuard,
  hasPermission('import', 'VIEW'),
  ImportController.listLcs
);

router.get(
  '/lcs/:id',
  authGuard,
  hasPermission('import', 'VIEW'),
  ImportController.getLcById
);

router.post(
  '/lcs',
  authGuard,
  hasPermission('import', 'CREATE'),
  validateRequest({ body: createImportLcExtendedSchema }),
  ImportController.createLc
);

router.post(
  '/lcs/:id/amendments',
  authGuard,
  hasPermission('import', 'AMEND'),
  validateRequest({ body: createLCAmendmentSchema }),
  ImportController.createAmendment
);

router.get(
  '/lcs/:id/amendments',
  authGuard,
  hasPermission('import', 'VIEW'),
  ImportController.listAmendments
);

// 3. Proforma Invoices (PI)
router.get(
  '/proforma-invoices',
  authGuard,
  hasPermission('import', 'VIEW'),
  ImportController.listProformaInvoices
);

router.post(
  '/proforma-invoices',
  authGuard,
  hasPermission('import', 'CREATE'),
  validateRequest({ body: createProformaInvoiceSchema }),
  ImportController.createProformaInvoice
);

// 4. Shipments & Tracking
router.get(
  '/shipments',
  authGuard,
  hasPermission('import', 'VIEW'),
  ImportController.listShipments
);

router.post(
  '/shipments',
  authGuard,
  hasPermission('import', 'CREATE'),
  validateRequest({ body: createShipmentSchema }),
  ImportController.createShipment
);

router.post(
  '/shipments/:id/events',
  authGuard,
  hasPermission('import', 'UPDATE'),
  validateRequest({ body: addTrackingEventSchema }),
  ImportController.addTrackingEvent
);

// 5. Customs Clearance & Port Demurrage
router.get(
  '/customs',
  authGuard,
  hasPermission('import', 'CUSTOMS'),
  ImportController.listCustomsClearances
);

router.post(
  '/customs',
  authGuard,
  hasPermission('import', 'CUSTOMS'),
  validateRequest({ body: createCustomsClearanceSchema }),
  ImportController.recordCustomsClearance
);

// 6. Payments & Bank Margins
router.get(
  '/payments',
  authGuard,
  hasPermission('import', 'PAYMENT'),
  ImportController.listPayments
);

router.post(
  '/payments',
  authGuard,
  hasPermission('import', 'PAYMENT'),
  validateRequest({ body: recordImportPaymentSchema }),
  ImportController.recordPayment
);

// 7. Document Repository
router.get(
  '/documents',
  authGuard,
  hasPermission('import', 'VIEW'),
  ImportController.listDocuments
);

router.post(
  '/documents',
  authGuard,
  hasPermission('import', 'CREATE'),
  validateRequest({ body: uploadDocumentSchema }),
  ImportController.uploadDocument
);

router.put(
  '/documents/:id/verify',
  authGuard,
  hasPermission('import', 'APPROVE'),
  ImportController.verifyDocument
);

// 8. AI Assistant & Risk Center
router.get(
  '/risk-alerts',
  authGuard,
  hasPermission('import', 'VIEW'),
  ImportController.getRiskAlerts
);

router.put(
  '/risk-alerts/:id/resolve',
  authGuard,
  hasPermission('import', 'UPDATE'),
  ImportController.resolveRiskAlert
);

router.post(
  '/ai/assistant',
  authGuard,
  hasPermission('import', 'AI_USE'),
  validateRequest({ body: aiQuerySchema }),
  ImportController.aiAssistant
);

router.post(
  '/ai/extract',
  authGuard,
  hasPermission('import', 'AI_USE'),
  validateRequest({ body: aiExtractSchema }),
  ImportController.aiExtract
);

router.post(
  '/ai/compare',
  authGuard,
  hasPermission('import', 'AI_USE'),
  validateRequest({ body: aiCompareSchema }),
  ImportController.aiCompare
);

router.post(
  '/ai/shipment-risk',
  authGuard,
  hasPermission('import', 'AI_USE'),
  ImportController.aiShipmentRisk
);

router.post(
  '/ai/landed-cost-advice',
  authGuard,
  hasPermission('import', 'AI_USE'),
  ImportController.aiLandedCostAdvice
);

// 9. Settings
router.get(
  '/settings',
  authGuard,
  hasPermission('import', 'MANAGE_SETTINGS'),
  ImportController.getSettings
);

router.put(
  '/settings',
  authGuard,
  hasPermission('import', 'MANAGE_SETTINGS'),
  ImportController.updateSettings
);

export default router;
