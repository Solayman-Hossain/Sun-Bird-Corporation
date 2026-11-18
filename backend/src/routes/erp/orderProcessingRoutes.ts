import { Router } from 'express';
import { OrderProcessingController } from '../../controllers/OrderProcessingController';
import { authGuard } from '../../middlewares/authGuard';
import { hasPermission } from '../../middlewares/rbacGuard';

const router = Router();

// Apply authGuard to all ERP order routes
router.use(authGuard);

// ── Dashboard & Metrics ──────────────────────────────────────────────────────
router.get('/dashboard', hasPermission('orders', 'READ'), OrderProcessingController.getDashboard);

// ── Settings & Configuration ─────────────────────────────────────────────────
router.get('/settings', hasPermission('orders', 'READ'), OrderProcessingController.getSettings);
router.put('/settings', hasPermission('orders', 'UPDATE'), OrderProcessingController.updateSettings);

// ── Reports ──────────────────────────────────────────────────────────────────
router.get('/reports/:reportType', hasPermission('orders', 'READ'), OrderProcessingController.getReports);

// ── Customer Order History ───────────────────────────────────────────────────
router.get('/customer/:customerId/history', hasPermission('orders', 'READ'), OrderProcessingController.getCustomerHistory);

// ── Order CRUD & Listing ─────────────────────────────────────────────────────
router.get('/', hasPermission('orders', 'READ'), OrderProcessingController.listOrders);
router.post('/', hasPermission('orders', 'CREATE'), OrderProcessingController.createManualOrder);
router.get('/:id', hasPermission('orders', 'READ'), OrderProcessingController.getOrderById);

// ── Status & Workflow Transitions ───────────────────────────────────────────
router.patch('/:id/status', hasPermission('orders', 'UPDATE'), OrderProcessingController.updateStatus);
router.post('/:id/confirm', hasPermission('orders', 'UPDATE'), OrderProcessingController.confirmOrder);
router.post('/:id/hold', hasPermission('orders', 'UPDATE'), OrderProcessingController.holdOrder);
router.post('/:id/release-hold', hasPermission('orders', 'UPDATE'), OrderProcessingController.releaseHold);
router.post('/:id/cancel', hasPermission('orders', 'DELETE'), OrderProcessingController.cancelOrder);

// ── Payments & COD ───────────────────────────────────────────────────────────
router.post('/:id/payments', hasPermission('orders', 'UPDATE'), OrderProcessingController.recordPayment);
router.post('/:id/payments/:paymentNumber/verify', hasPermission('orders', 'APPROVE'), OrderProcessingController.verifyPayment);
router.post('/:id/payments/:paymentNumber/reject', hasPermission('orders', 'APPROVE'), OrderProcessingController.rejectPayment);
router.post('/:id/cod/collect', hasPermission('orders', 'UPDATE'), OrderProcessingController.recordCodCollection);

// ── Stock Availability & Reservation ─────────────────────────────────────────
router.get('/:id/stock-availability', hasPermission('orders', 'READ'), OrderProcessingController.checkStockAvailability);
router.post('/:id/reserve', hasPermission('orders', 'UPDATE'), OrderProcessingController.reserveStock);
router.post('/:id/release-reservation', hasPermission('orders', 'UPDATE'), OrderProcessingController.releaseReservation);

// ── Picking & Packing ────────────────────────────────────────────────────────
router.post('/:id/picking', hasPermission('orders', 'UPDATE'), OrderProcessingController.createPickingList);
router.post('/:id/picking/:pickingId/complete', hasPermission('orders', 'UPDATE'), OrderProcessingController.completePicking);
router.post('/:id/packing', hasPermission('orders', 'UPDATE'), OrderProcessingController.createPacking);

// ── Dispatch & Delivery ──────────────────────────────────────────────────────
router.post('/:id/dispatch', hasPermission('orders', 'UPDATE'), OrderProcessingController.dispatchOrder);
router.post('/:id/delivery', hasPermission('orders', 'UPDATE'), OrderProcessingController.confirmDelivery);
router.post('/:id/partial-delivery', hasPermission('orders', 'UPDATE'), OrderProcessingController.recordPartialDelivery);

// ── Challan & Invoice Documents Integration ──────────────────────────────────
router.post('/:id/generate-challan', hasPermission('orders', 'CREATE'), OrderProcessingController.generateChallan);
router.post('/:id/generate-invoice', hasPermission('orders', 'CREATE'), OrderProcessingController.generateInvoice);

// ── Timeline ─────────────────────────────────────────────────────────────────
router.get('/:id/timeline', hasPermission('orders', 'READ'), OrderProcessingController.getTimeline);

export default router;
