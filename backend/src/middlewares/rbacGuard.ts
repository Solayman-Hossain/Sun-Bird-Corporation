import { Request, Response, NextFunction } from 'express';
import { RoleModel } from '../models/Role';
import { ForbiddenError, UnauthorizedError } from '../errors/AppError';
import logger from '../config/logger';

/**
 * RBAC Permission Guard Middleware Factory.
 *
 * Returns an Express middleware that checks whether the authenticated user
 * (already attached to `req.user` by authGuard) possesses the required
 * `module:action` permission.
 *
 * Authorization logic (per PRD §4 and Database-Schema.md §1.2):
 * 1. SUPER_ADMIN and DIRECTOR userTypes are granted unconditional access.
 * 2. For all other user types, the user's `roleId` is looked up in the
 *    `roles` collection and the `permissions[]` array is inspected for a
 *    matching `{ module, actions }` entry.
 * 3. If the permission is not found, a ForbiddenError (403) is thrown.
 *
 * Usage:
 * ```ts
 * router.post('/inventory', authGuard, hasPermission('INVENTORY', 'CREATE'), controller);
 * ```
 *
 * @param module  ERP module identifier (e.g. 'INVENTORY', 'SALES', 'ACCOUNTING')
 * @param action  CRUD action (e.g. 'CREATE', 'READ', 'UPDATE', 'DELETE', 'APPROVE', 'EXPORT')
 */
export const hasPermission = (module: string, action: string) => {
  return async (
    req: Request,
    _res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      // ─── 1. Ensure authGuard has run ───
      if (!req.user) {
        throw new UnauthorizedError(
          'Authentication required before permission check. Ensure authGuard middleware is applied first'
        );
      }

      const { userType, roleId, userId } = req.user;

      // ─── 2. Unconditional access for privileged user types ───
      // SUPER_ADMIN has system-wide access per PRD §4 line 30
      // DIRECTOR has full visibility per PRD §22.5.2 line 820
      if (userType === 'SUPER_ADMIN' || userType === 'DIRECTOR') {
        return next();
      }

      // ─── 3. Validate that a roleId is assigned ───
      if (!roleId) {
        logger.warn(
          `rbacGuard: User '${userId}' (type: ${userType}) attempted ${module}:${action} without an assigned role`,
          { userId, module, action }
        );
        throw new ForbiddenError(
          'Insufficient permissions for this resource'
        );
      }

      // ─── 4. Look up role and check permissions array ───
      const role = await RoleModel.findById(roleId)
        .select('permissions isActive')
        .lean();

      if (!role) {
        logger.warn(
          `rbacGuard: Role '${roleId}' assigned to user '${userId}' was not found in the roles collection`,
          { userId, roleId, module, action }
        );
        throw new ForbiddenError(
          'Insufficient permissions for this resource'
        );
      }

      if (!role.isActive) {
        logger.warn(
          `rbacGuard: Role '${roleId}' assigned to user '${userId}' is deactivated`,
          { userId, roleId, module, action }
        );
        throw new ForbiddenError(
          'Insufficient permissions for this resource'
        );
      }

      // ─── 5. Check if permissions array contains the required module:action ───
      const reqMod = module.toUpperCase();
      const reqAct = action.toUpperCase();

      const hasRequiredPermission = role.permissions.some((perm) => {
        const permMod = perm.module.toUpperCase();
        if (permMod !== reqMod && permMod !== '*') return false;
        return perm.actions.some((act) => {
          const a = act.toUpperCase();
          return (
            a === reqAct ||
            a === '*' ||
            a === 'MANAGE' ||
            (reqAct === 'MANAGE' && ['CREATE', 'UPDATE', 'DELETE'].includes(a))
          );
        });
      });

      if (!hasRequiredPermission) {
        logger.warn(
          `rbacGuard: User '${userId}' denied ${module}:${action} — permission not found in role '${roleId}'`,
          { userId, roleId, module, action }
        );
        throw new ForbiddenError(
          'Insufficient permissions for this resource'
        );
      }

      // ─── 6. Permission granted ───
      next();
    } catch (error) {
      if (
        error instanceof ForbiddenError ||
        error instanceof UnauthorizedError
      ) {
        return next(error);
      }

      logger.error('rbacGuard: Unexpected error during permission check', {
        error: error instanceof Error ? error.message : String(error),
        module,
        action,
        userId: req.user?.userId,
        path: req.originalUrl,
        method: req.method,
      });

      next(
        new ForbiddenError(
          'Insufficient permissions for this resource'
        )
      );
    }
  };
};

export default hasPermission;
