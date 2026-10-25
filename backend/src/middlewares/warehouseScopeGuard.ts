import { Request, Response, NextFunction } from 'express';
import { RoleModel } from '../models/Role';
import { ForbiddenError, UnauthorizedError } from '../errors/AppError';
import logger from '../config/logger';

/**
 * Warehouse / Branch Tenant Scope Guard Middleware.
 *
 * Enforces data tenancy for branch-bound and warehouse-bound users:
 * - If the authenticated user has a `branchId` or `warehouseId` assigned in
 *   their User record (i.e. they are a warehouse controller, branch cashier,
 *   or outlet staff), this middleware restricts mutation requests to their
 *   designated warehouse/branch scope.
 * - Users possessing the `ALL_WAREHOUSES` permission in their role bypass
 *   the scope restriction (e.g. Directors, central inventory controllers).
 * - SUPER_ADMIN and DIRECTOR user types bypass unconditionally.
 * - GET/HEAD/OPTIONS requests are not restricted (read access is governed
 *   by rbacGuard and application-level query filtering).
 *
 * The target warehouse is identified from `req.body.warehouseId` or
 * `req.params.warehouseId` on mutation requests (POST, PUT, PATCH, DELETE).
 *
 * References:
 * - PRD §4 (User Types and Access)
 * - PRD §22.5.2 (Role Permission Grid: Warehouse role scoped to own depot)
 * - Database-Schema.md §1.1 (users.branchId, users.warehouseId)
 * - Database-Schema.md §7.2 (warehouses)
 */

/** HTTP methods considered as mutations */
const MUTATION_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

export const warehouseScopeGuard = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // ─── 1. Ensure authGuard has run ───
    if (!req.user) {
      throw new UnauthorizedError(
        'Authentication required before warehouse scope check. Ensure authGuard middleware is applied first'
      );
    }

    const { userType, userId, branchId, warehouseId, roleId } = req.user;

    // ─── 2. Privileged user types bypass scope restrictions ───
    if (userType === 'SUPER_ADMIN' || userType === 'DIRECTOR') {
      return next();
    }

    // ─── 3. Only apply scope restrictions on mutation methods ───
    if (!MUTATION_METHODS.has(req.method.toUpperCase())) {
      return next();
    }

    // ─── 4. If user has no branch/warehouse binding, they are not scope-restricted ───
    const userBoundWarehouse = warehouseId || branchId;
    if (!userBoundWarehouse) {
      return next();
    }

    // ─── 5. Check for ALL_WAREHOUSES permission override ───
    if (roleId) {
      const role = await RoleModel.findById(roleId)
        .select('permissions isActive')
        .lean();

      if (role && role.isActive) {
        const hasAllWarehousesPermission = role.permissions.some(
          (perm) =>
            perm.module === 'ALL_WAREHOUSES' ||
            (perm.module === 'WAREHOUSE' && perm.actions.includes('ALL' as any))
        );

        if (hasAllWarehousesPermission) {
          return next();
        }
      }
    }

    // ─── 6. Extract target warehouse from the request ───
    const targetWarehouseId =
      req.body?.warehouseId || req.params?.warehouseId;

    // If no target warehouse is specified in the request, allow through
    // (the controller is responsible for defaulting to the user's warehouse)
    if (!targetWarehouseId) {
      return next();
    }

    // ─── 7. Compare target warehouse with user's assigned scope ───
    const targetId = targetWarehouseId.toString();
    const boundId = userBoundWarehouse.toString();

    if (targetId !== boundId) {
      logger.warn(
        `warehouseScopeGuard: User '${userId}' attempted mutation on warehouse '${targetId}' but is bound to '${boundId}'`,
        {
          userId,
          userType,
          boundWarehouse: boundId,
          targetWarehouse: targetId,
          path: req.originalUrl,
          method: req.method,
        }
      );

      throw new ForbiddenError(
        'Access denied: You are not authorized to perform operations on this warehouse. ' +
        'Your account is restricted to your assigned warehouse/branch scope'
      );
    }

    // ─── 8. Scope validated ───
    next();
  } catch (error) {
    if (
      error instanceof ForbiddenError ||
      error instanceof UnauthorizedError
    ) {
      return next(error);
    }

    logger.error(
      'warehouseScopeGuard: Unexpected error during scope check',
      {
        error: error instanceof Error ? error.message : String(error),
        userId: req.user?.userId,
        path: req.originalUrl,
        method: req.method,
      }
    );

    next(
      new ForbiddenError(
        'Access denied: Unable to verify warehouse scope authorization'
      )
    );
  }
};

export default warehouseScopeGuard;
