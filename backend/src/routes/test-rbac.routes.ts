import { Router, Request, Response } from 'express';
import { authGuard } from '../middlewares/authGuard';
import { hasPermission } from '../middlewares/rbacGuard';
import { warehouseScopeGuard } from '../middlewares/warehouseScopeGuard';

/**
 * Protected test routes for verifying RBAC middleware chain.
 * These endpoints demonstrate the authGuard → rbacGuard → warehouseScopeGuard pipeline
 * and are used for verification testing per PRD §4 and prompt specification.
 */
const rbacTestRouter = Router();

/**
 * GET /api/v1/test-rbac/inventory
 * Requires: INVENTORY:READ permission
 * Purpose: Verify that users with INVENTORY:READ can access read endpoints.
 */
rbacTestRouter.get(
  '/inventory',
  authGuard,
  hasPermission('INVENTORY', 'READ'),
  (req: Request, res: Response) => {
    res.status(200).json({
      success: true,
      message: 'INVENTORY:READ access granted',
      user: req.user,
      timestamp: new Date().toISOString(),
    });
  }
);

/**
 * POST /api/v1/test-rbac/inventory
 * Requires: INVENTORY:CREATE permission
 * Purpose: Verify that users WITHOUT INVENTORY:CREATE receive 403 Forbidden.
 */
rbacTestRouter.post(
  '/inventory',
  authGuard,
  hasPermission('INVENTORY', 'CREATE'),
  warehouseScopeGuard,
  (req: Request, res: Response) => {
    res.status(201).json({
      success: true,
      message: 'INVENTORY:CREATE access granted',
      user: req.user,
      timestamp: new Date().toISOString(),
    });
  }
);

/**
 * POST /api/v1/test-rbac/warehouse/:warehouseId/stock
 * Requires: INVENTORY:CREATE permission + warehouse scope
 * Purpose: Verify warehouse scope guard restricts cross-warehouse mutations.
 */
rbacTestRouter.post(
  '/warehouse/:warehouseId/stock',
  authGuard,
  hasPermission('INVENTORY', 'CREATE'),
  warehouseScopeGuard,
  (req: Request, res: Response) => {
    res.status(201).json({
      success: true,
      message: 'INVENTORY:CREATE within warehouse scope granted',
      user: req.user,
      targetWarehouse: req.params.warehouseId,
      timestamp: new Date().toISOString(),
    });
  }
);

export default rbacTestRouter;
