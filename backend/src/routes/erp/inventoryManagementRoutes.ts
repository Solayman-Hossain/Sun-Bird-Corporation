import { Router } from 'express';
import { InventoryManagementController } from '../../controllers/InventoryManagementController';
import { authGuard } from '../../middlewares/authGuard';
import { hasPermission } from '../../middlewares/rbacGuard';

const router = Router();

// ─── 01. DASHBOARD ──────────────────────────────────────────────────────────
router.get(
  '/dashboard',
  authGuard,
  hasPermission('inventory', 'READ'),
  InventoryManagementController.getDashboard
);

// ─── 02. STOCK OVERVIEW ─────────────────────────────────────────────────────
router.get(
  '/stock-overview',
  authGuard,
  hasPermission('inventory', 'READ'),
  InventoryManagementController.getStockOverview
);

// ─── 03. WAREHOUSES ─────────────────────────────────────────────────────────
router.get(
  '/warehouses',
  authGuard,
  hasPermission('inventory', 'READ'),
  InventoryManagementController.listWarehouses
);

// ─── 04. WAREHOUSE LOCATIONS / BINS ─────────────────────────────────────────
router.get(
  '/bins',
  authGuard,
  hasPermission('inventory', 'READ'),
  InventoryManagementController.listBins
);
router.post(
  '/bins',
  authGuard,
  hasPermission('inventory', 'CREATE'),
  InventoryManagementController.createBin
);
router.get(
  '/bins/occupancy/:warehouseId',
  authGuard,
  hasPermission('inventory', 'READ'),
  InventoryManagementController.getBinOccupancy
);
router.get(
  '/bins/:id',
  authGuard,
  hasPermission('inventory', 'READ'),
  InventoryManagementController.getBin
);
router.put(
  '/bins/:id',
  authGuard,
  hasPermission('inventory', 'UPDATE'),
  InventoryManagementController.updateBin
);
router.delete(
  '/bins/:id',
  authGuard,
  hasPermission('inventory', 'DELETE'),
  InventoryManagementController.deleteBin
);

// ─── 05. BATCH / LOT MANAGEMENT ─────────────────────────────────────────────
router.get(
  '/batches',
  authGuard,
  hasPermission('inventory', 'READ'),
  InventoryManagementController.listBatches
);
router.get(
  '/batches/:id',
  authGuard,
  hasPermission('inventory', 'READ'),
  InventoryManagementController.getBatch
);

// ─── 06. EXPIRY MANAGEMENT ──────────────────────────────────────────────────
router.get(
  '/expiry',
  authGuard,
  hasPermission('inventory', 'READ'),
  InventoryManagementController.getExpiryManagement
);

// ─── 07. FEFO / FIFO ALLOCATION ─────────────────────────────────────────────
router.post(
  '/allocation/allocate',
  authGuard,
  hasPermission('inventory', 'READ'),
  InventoryManagementController.allocateStock
);

// ─── 08. STOCK RESERVATION ──────────────────────────────────────────────────
router.post(
  '/reservation/reserve',
  authGuard,
  hasPermission('inventory', 'CREATE'),
  InventoryManagementController.reserveStock
);
router.post(
  '/reservation/release',
  authGuard,
  hasPermission('inventory', 'UPDATE'),
  InventoryManagementController.releaseReservation
);

// ─── 09. STOCK TRANSFERS ────────────────────────────────────────────────────
router.get(
  '/transfers',
  authGuard,
  hasPermission('inventory', 'READ'),
  InventoryManagementController.listTransfers
);
router.post(
  '/transfers',
  authGuard,
  hasPermission('inventory', 'CREATE'),
  InventoryManagementController.createTransfer
);
router.get(
  '/transfers/:id',
  authGuard,
  hasPermission('inventory', 'READ'),
  InventoryManagementController.getTransfer
);
router.post(
  '/transfers/:id/submit',
  authGuard,
  hasPermission('inventory', 'UPDATE'),
  InventoryManagementController.submitTransfer
);
router.post(
  '/transfers/:id/approve',
  authGuard,
  hasPermission('inventory', 'APPROVE'),
  InventoryManagementController.approveTransfer
);
router.post(
  '/transfers/:id/dispatch',
  authGuard,
  hasPermission('inventory', 'UPDATE'),
  InventoryManagementController.dispatchTransfer
);
router.post(
  '/transfers/:id/receive',
  authGuard,
  hasPermission('inventory', 'UPDATE'),
  InventoryManagementController.receiveTransfer
);
router.post(
  '/transfers/:id/cancel',
  authGuard,
  hasPermission('inventory', 'UPDATE'),
  InventoryManagementController.cancelTransfer
);

// ─── 10. STOCK ADJUSTMENTS ──────────────────────────────────────────────────
router.get(
  '/adjustments',
  authGuard,
  hasPermission('inventory', 'READ'),
  InventoryManagementController.listAdjustments
);
router.post(
  '/adjustments',
  authGuard,
  hasPermission('inventory', 'CREATE'),
  InventoryManagementController.createAdjustment
);
router.get(
  '/adjustments/:id',
  authGuard,
  hasPermission('inventory', 'READ'),
  InventoryManagementController.getAdjustment
);
router.post(
  '/adjustments/:id/submit',
  authGuard,
  hasPermission('inventory', 'UPDATE'),
  InventoryManagementController.submitAdjustment
);
router.post(
  '/adjustments/:id/approve',
  authGuard,
  hasPermission('inventory', 'APPROVE'),
  InventoryManagementController.approveAdjustment
);
router.post(
  '/adjustments/:id/post',
  authGuard,
  hasPermission('inventory', 'APPROVE'),
  InventoryManagementController.postAdjustment
);
router.post(
  '/adjustments/:id/reject',
  authGuard,
  hasPermission('inventory', 'APPROVE'),
  InventoryManagementController.rejectAdjustment
);

// ─── 11 & 12. PHYSICAL STOCK COUNT & RECONCILIATION ─────────────────────────
router.get(
  '/physical-counts',
  authGuard,
  hasPermission('inventory', 'READ'),
  InventoryManagementController.listCounts
);
router.post(
  '/physical-counts',
  authGuard,
  hasPermission('inventory', 'CREATE'),
  InventoryManagementController.createCount
);
router.get(
  '/physical-counts/:id',
  authGuard,
  hasPermission('inventory', 'READ'),
  InventoryManagementController.getCount
);
router.post(
  '/physical-counts/:id/record',
  authGuard,
  hasPermission('inventory', 'UPDATE'),
  InventoryManagementController.recordCounts
);
router.post(
  '/physical-counts/:id/reconcile',
  authGuard,
  hasPermission('inventory', 'APPROVE'),
  InventoryManagementController.reconcileCount
);

// ─── 13. DAMAGED / EXPIRED STOCK ────────────────────────────────────────────
router.get(
  '/damaged-expired',
  authGuard,
  hasPermission('inventory', 'READ'),
  InventoryManagementController.getDamagedAndExpired
);

// ─── 14. STOCK MOVEMENT HISTORY ─────────────────────────────────────────────
router.get(
  '/movements/history',
  authGuard,
  hasPermission('inventory', 'READ'),
  InventoryManagementController.getMovementHistory
);

// ─── 15. REORDER & LOW STOCK ALERTS ─────────────────────────────────────────
router.get(
  '/alerts/reorder',
  authGuard,
  hasPermission('inventory', 'READ'),
  InventoryManagementController.getReorderAlerts
);

// ─── 16. INVENTORY REPORTS ──────────────────────────────────────────────────
router.get(
  '/reports',
  authGuard,
  hasPermission('inventory', 'READ'),
  InventoryManagementController.getReports
);

// ─── 17. INVENTORY SETTINGS ─────────────────────────────────────────────────
router.get(
  '/settings',
  authGuard,
  hasPermission('inventory', 'READ'),
  InventoryManagementController.getSettings
);
router.post(
  '/settings',
  authGuard,
  hasPermission('inventory', 'UPDATE'),
  InventoryManagementController.updateSettings
);

// ─── 18. ACTIVITY LOGS ──────────────────────────────────────────────────────
router.get(
  '/activity-logs',
  authGuard,
  hasPermission('inventory', 'READ'),
  InventoryManagementController.getActivityLogs
);

export default router;
