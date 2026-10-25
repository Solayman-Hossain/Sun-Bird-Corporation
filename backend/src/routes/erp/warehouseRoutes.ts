import { Router } from 'express';
import { WarehouseController } from '../../controllers/WarehouseController';
import { authGuard } from '../../middlewares/authGuard';
import { hasPermission } from '../../middlewares/rbacGuard';
import { validateRequest } from '../../middlewares/validateRequest';
import {
  createWarehouseSchema,
  updateWarehouseSchema,
} from '../../validators/system-aux.validator';

const router = Router();

// ── Multi-Warehouse Directory & Regional Coverage (§5.1 & §12) ──────────────

router.post(
  '/',
  authGuard,
  hasPermission('warehouses', 'CREATE'),
  validateRequest({ body: createWarehouseSchema }),
  WarehouseController.createWarehouse
);

router.get(
  '/',
  authGuard,
  hasPermission('warehouses', 'READ'),
  WarehouseController.getWarehouses
);

router.get(
  '/:id',
  authGuard,
  hasPermission('warehouses', 'READ'),
  WarehouseController.getWarehouseById
);

router.put(
  '/:id',
  authGuard,
  hasPermission('warehouses', 'UPDATE'),
  validateRequest({ body: updateWarehouseSchema }),
  WarehouseController.updateWarehouse
);

router.get(
  '/district/:district',
  authGuard,
  hasPermission('warehouses', 'READ'),
  WarehouseController.getByDistrict
);

export default router;
