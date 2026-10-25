import { Router } from 'express';
import { InventoryController } from '../../controllers/InventoryController';
import { authGuard } from '../../middlewares/authGuard';
import { hasPermission } from '../../middlewares/rbacGuard';
import { warehouseScopeGuard } from '../../middlewares/warehouseScopeGuard';
import { validateRequest } from '../../middlewares/validateRequest';
import {
  createBatchSchema,
  stockMovementSchema,
  createSerialsSchema,
  bindSerialSchema,
} from '../../validators/inventory.validator';

const router = Router();

/**
 * @route   GET /api/v1/erp/inventory/batches
 * @desc    Lists product batches with FEFO sorting and near-expiry alerts
 * @access  Bearer JWT (inventory:READ)
 */
router.get(
  '/batches',
  authGuard,
  hasPermission('inventory', 'READ'),
  InventoryController.listBatches
);

/**
 * @route   POST /api/v1/erp/inventory/batches
 * @desc    Registers a new manufacturing or import batch
 * @access  Bearer JWT (inventory:CREATE)
 */
router.post(
  '/batches',
  authGuard,
  hasPermission('inventory', 'CREATE'),
  warehouseScopeGuard,
  validateRequest({ body: createBatchSchema }),
  InventoryController.createBatch
);

/**
 * @route   POST /api/v1/erp/inventory/movements
 * @desc    Executes an atomic stock movement and writes to immutable ledger
 * @access  Bearer JWT (inventory:CREATE)
 */
router.post(
  '/movements',
  authGuard,
  hasPermission('inventory', 'CREATE'),
  warehouseScopeGuard,
  validateRequest({ body: stockMovementSchema }),
  InventoryController.adjustStockMovement
);

/**
 * @route   GET /api/v1/erp/inventory/ledger
 * @desc    Retrieves stock movement audit ledger journal
 * @access  Bearer JWT (inventory:READ)
 */
router.get(
  '/ledger',
  authGuard,
  hasPermission('inventory', 'READ'),
  InventoryController.listLedgerHistory
);

/**
 * @route   GET /api/v1/erp/inventory/serials
 * @desc    Lists individual tracked medical equipment serials
 * @access  Bearer JWT (inventory:READ)
 */
router.get(
  '/serials',
  authGuard,
  hasPermission('inventory', 'READ'),
  InventoryController.listSerials
);

/**
 * @route   POST /api/v1/erp/inventory/serials
 * @desc    Registers tracked serials for a batch
 * @access  Bearer JWT (inventory:CREATE)
 */
router.post(
  '/serials',
  authGuard,
  hasPermission('inventory', 'CREATE'),
  validateRequest({ body: createSerialsSchema }),
  InventoryController.createSerials
);

/**
 * @route   POST /api/v1/erp/inventory/serials/bind
 * @desc    Binds serial to customer challan and activates warranty
 * @access  Bearer JWT (inventory:UPDATE)
 */
router.post(
  '/serials/bind',
  authGuard,
  hasPermission('inventory', 'UPDATE'),
  validateRequest({ body: bindSerialSchema }),
  InventoryController.bindSerial
);

export default router;
