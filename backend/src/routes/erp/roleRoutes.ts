import { Router } from 'express';
import { RoleController } from '../../controllers/RoleController';
import { authGuard } from '../../middlewares/authGuard';
import { hasPermission } from '../../middlewares/rbacGuard';

const router = Router();

/**
 * @route   GET /api/v1/erp/roles/permission-registry
 * @desc    Retrieves permission registry and role templates
 * @access  Bearer JWT (roles:READ)
 */
router.get(
  '/permission-registry',
  authGuard,
  hasPermission('roles', 'READ'),
  RoleController.getPermissionRegistry
);

/**
 * @route   POST /api/v1/erp/roles/seed
 * @desc    Seeds default enterprise roles idempotently
 * @access  Bearer JWT (roles:MANAGE)
 */
router.post(
  '/seed',
  authGuard,
  hasPermission('roles', 'MANAGE'),
  RoleController.seedStandardRoles
);

/**
 * @route   GET /api/v1/erp/roles
 * @desc    Lists all roles with filtering and pagination
 * @access  Bearer JWT (roles:READ)
 */
router.get(
  '/',
  authGuard,
  hasPermission('roles', 'READ'),
  RoleController.listRoles
);

/**
 * @route   GET /api/v1/erp/roles/:id
 * @desc    Retrieves single role with assigned users
 * @access  Bearer JWT (roles:READ)
 */
router.get(
  '/:id',
  authGuard,
  hasPermission('roles', 'READ'),
  RoleController.getRoleById
);

/**
 * @route   POST /api/v1/erp/roles
 * @desc    Creates a new RBAC role with permissions
 * @access  Bearer JWT (roles:MANAGE)
 */
router.post(
  '/',
  authGuard,
  hasPermission('roles', 'MANAGE'),
  RoleController.createRole
);

/**
 * @route   POST /api/v1/erp/roles/:id/duplicate
 * @desc    Clones an existing role's permissions into a new role
 * @access  Bearer JWT (roles:MANAGE)
 */
router.post(
  '/:id/duplicate',
  authGuard,
  hasPermission('roles', 'MANAGE'),
  RoleController.duplicateRole
);

/**
 * @route   PUT /api/v1/erp/roles/:id/permissions
 * @desc    Updates the granular permission matrix for a role
 * @access  Bearer JWT (roles:MANAGE)
 */
router.put(
  '/:id/permissions',
  authGuard,
  hasPermission('roles', 'MANAGE'),
  RoleController.updateRolePermissions
);

/**
 * @route   PUT /api/v1/erp/roles/:id
 * @desc    Updates an existing role
 * @access  Bearer JWT (roles:MANAGE)
 */
router.put(
  '/:id',
  authGuard,
  hasPermission('roles', 'MANAGE'),
  RoleController.updateRole
);

/**
 * @route   DELETE /api/v1/erp/roles/:id
 * @desc    Deletes an existing role
 * @access  Bearer JWT (roles:MANAGE)
 */
router.delete(
  '/:id',
  authGuard,
  hasPermission('roles', 'MANAGE'),
  RoleController.deleteRole
);

export default router;
