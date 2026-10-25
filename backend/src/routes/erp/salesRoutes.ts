import { Router } from 'express';
import { SalesController } from '../../controllers/SalesController';
import { authGuard } from '../../middlewares/authGuard';
import { hasPermission } from '../../middlewares/rbacGuard';
import { validateRequest } from '../../middlewares/validateRequest';
import {
  updateCreditProfileSchema,
  directorOverrideCreditSchema,
  createChallanSchema,
  createInvoiceSchema,
} from '../../validators/sales.validator';

const router = Router();

// ── B2B Customer Credit Profiles (§5.2) ─────────────────────────────────────
router.get(
  '/credit-profiles/:customerId',
  authGuard,
  hasPermission('sales', 'READ'),
  SalesController.getCreditProfile
);

router.put(
  '/credit-profiles/:customerId',
  authGuard,
  hasPermission('sales', 'UPDATE'),
  validateRequest({ body: updateCreditProfileSchema }),
  SalesController.updateCreditProfile
);

router.post(
  '/credit-profiles/:customerId/override',
  authGuard,
  validateRequest({ body: directorOverrideCreditSchema }),
  SalesController.overrideCreditLock
);

// ── NBR Mushak-6.3 Delivery Challans (§5.4) ─────────────────────────────────
router.post(
  '/challans',
  authGuard,
  hasPermission('sales', 'CREATE'),
  validateRequest({ body: createChallanSchema }),
  SalesController.createChallan
);

router.get(
  '/challans/:id',
  authGuard,
  hasPermission('sales', 'READ'),
  SalesController.getChallanById
);

router.get(
  '/challans/:id/print-mushak63',
  authGuard,
  hasPermission('sales', 'READ'),
  SalesController.printMushak63Challan
);

// ── Sales Invoices ──────────────────────────────────────────────────────────
router.post(
  '/invoices',
  authGuard,
  hasPermission('sales', 'CREATE'),
  validateRequest({ body: createInvoiceSchema }),
  SalesController.createInvoice
);

router.get(
  '/invoices/:id',
  authGuard,
  hasPermission('sales', 'READ'),
  SalesController.getInvoiceById
);

// ── Orders ──────────────────────────────────────────────────────────────────
router.get(
  '/orders',
  authGuard,
  hasPermission('sales', 'READ'),
  SalesController.listOrders
);

router.get(
  '/orders/:id',
  authGuard,
  hasPermission('sales', 'READ'),
  SalesController.getOrderById
);

export default router;
