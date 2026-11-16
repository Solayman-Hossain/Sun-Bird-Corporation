import { Router } from 'express';
import { PurchaseController } from '../../controllers/PurchaseController';
import { authGuard } from '../../middlewares/authGuard';
import { hasPermission } from '../../middlewares/rbacGuard';

const router = Router();

// ─── 1. DASHBOARD ────────────────────────────────────────────────────────────
router.get(
  '/dashboard',
  authGuard,
  hasPermission('procurement', 'READ'),
  PurchaseController.getDashboard
);

// ─── 2. PURCHASE REQUISITIONS ────────────────────────────────────────────────
router.get(
  '/requisitions',
  authGuard,
  hasPermission('procurement', 'READ'),
  PurchaseController.listRequisitions
);
router.post(
  '/requisitions',
  authGuard,
  hasPermission('procurement', 'CREATE'),
  PurchaseController.createRequisition
);
router.get(
  '/requisitions/:id',
  authGuard,
  hasPermission('procurement', 'READ'),
  PurchaseController.getRequisition
);
router.post(
  '/requisitions/:id/submit',
  authGuard,
  hasPermission('procurement', 'UPDATE'),
  PurchaseController.submitRequisition
);
router.post(
  '/requisitions/:id/approve',
  authGuard,
  hasPermission('procurement', 'APPROVE'),
  PurchaseController.approveRequisition
);
router.post(
  '/requisitions/:id/reject',
  authGuard,
  hasPermission('procurement', 'APPROVE'),
  PurchaseController.rejectRequisition
);
router.post(
  '/requisitions/:id/return',
  authGuard,
  hasPermission('procurement', 'APPROVE'),
  PurchaseController.returnRequisition
);
router.post(
  '/requisitions/:id/cancel',
  authGuard,
  hasPermission('procurement', 'DELETE'),
  PurchaseController.cancelRequisition
);
router.post(
  '/requisitions/:id/convert-to-po',
  authGuard,
  hasPermission('procurement', 'CREATE'),
  PurchaseController.convertToPo
);

// ─── 3. GOODS RECEIVE NOTE (GRN) ─────────────────────────────────────────────
router.get(
  '/grns',
  authGuard,
  hasPermission('procurement', 'READ'),
  PurchaseController.listGrns
);
router.post(
  '/grns',
  authGuard,
  hasPermission('procurement', 'CREATE'),
  PurchaseController.createGrn
);
router.get(
  '/grns/:id',
  authGuard,
  hasPermission('procurement', 'READ'),
  PurchaseController.getGrn
);
router.post(
  '/grns/:id/post',
  authGuard,
  hasPermission('procurement', 'APPROVE'),
  PurchaseController.postGrn
);
router.post(
  '/grns/:id/reverse',
  authGuard,
  hasPermission('procurement', 'DELETE'),
  PurchaseController.reverseGrn
);

// ─── 4. PURCHASE INVOICES ────────────────────────────────────────────────────
router.get(
  '/invoices',
  authGuard,
  hasPermission('procurement', 'READ'),
  PurchaseController.listInvoices
);
router.post(
  '/invoices',
  authGuard,
  hasPermission('procurement', 'CREATE'),
  PurchaseController.createInvoice
);
router.get(
  '/invoices/:id',
  authGuard,
  hasPermission('procurement', 'READ'),
  PurchaseController.getInvoice
);
router.post(
  '/invoices/:id/submit',
  authGuard,
  hasPermission('procurement', 'UPDATE'),
  PurchaseController.submitInvoice
);
router.post(
  '/invoices/:id/post',
  authGuard,
  hasPermission('procurement', 'APPROVE'),
  PurchaseController.postInvoice
);
router.get(
  '/payables/summary',
  authGuard,
  hasPermission('procurement', 'READ'),
  PurchaseController.getPayablesSummary
);

// ─── 5. SUPPLIER PAYMENTS ────────────────────────────────────────────────────
router.get(
  '/payments',
  authGuard,
  hasPermission('procurement', 'READ'),
  PurchaseController.listPayments
);
router.post(
  '/payments',
  authGuard,
  hasPermission('procurement', 'CREATE'),
  PurchaseController.createPayment
);
router.get(
  '/payments/:id',
  authGuard,
  hasPermission('procurement', 'READ'),
  PurchaseController.getPayment
);
router.post(
  '/payments/:id/post',
  authGuard,
  hasPermission('procurement', 'APPROVE'),
  PurchaseController.postPayment
);
router.post(
  '/payments/:id/reverse',
  authGuard,
  hasPermission('procurement', 'DELETE'),
  PurchaseController.reversePayment
);

// ─── 6. PURCHASE RETURNS ─────────────────────────────────────────────────────
router.get(
  '/returns',
  authGuard,
  hasPermission('procurement', 'READ'),
  PurchaseController.listReturns
);
router.post(
  '/returns',
  authGuard,
  hasPermission('procurement', 'CREATE'),
  PurchaseController.createReturn
);
router.get(
  '/returns/:id',
  authGuard,
  hasPermission('procurement', 'READ'),
  PurchaseController.getReturn
);
router.post(
  '/returns/:id/submit',
  authGuard,
  hasPermission('procurement', 'UPDATE'),
  PurchaseController.submitReturn
);
router.post(
  '/returns/:id/post',
  authGuard,
  hasPermission('procurement', 'APPROVE'),
  PurchaseController.postReturn
);

// ─── 7. SUPPLIER EXTENSIONS ──────────────────────────────────────────────────
router.get(
  '/suppliers/:id/ledger',
  authGuard,
  hasPermission('procurement', 'READ'),
  PurchaseController.getSupplierLedger
);
router.get(
  '/suppliers-stats',
  authGuard,
  hasPermission('procurement', 'READ'),
  PurchaseController.getSupplierStats
);
router.post(
  '/suppliers/check-duplicate',
  authGuard,
  hasPermission('procurement', 'READ'),
  PurchaseController.checkDuplicateSupplier
);

export default router;
