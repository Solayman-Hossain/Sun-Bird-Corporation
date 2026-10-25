import { Router } from 'express';
import { RoleController } from '../../controllers/RoleController';
import { authGuard } from '../../middlewares/authGuard';
import { hasPermission } from '../../middlewares/rbacGuard';
import { validateRequest } from '../../middlewares/validateRequest';
import {
  createRoleSchema,
  updateRoleSchema,
} from '../../validators/role.validator';

const router = Router();

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
 * @route   POST /api/v1/erp/roles
 * @desc    Creates a new RBAC role with permissions
 * @access  Bearer JWT (roles:MANAGE / roles:CREATE)
 */
router.post(
  '/',
  authGuard,
  hasPermission('roles', 'MANAGE'),
  validateRequest({ body: createRoleSchema }),
  RoleController.createRole
);

/**
 * @route   PUT /api/v1/erp/roles/:id
 * @desc    Updates an existing role
 * @access  Bearer JWT (roles:MANAGE / roles:UPDATE)
 */
router.put(
  '/:id',
  authGuard,
  hasPermission('roles', 'MANAGE'),
  validateRequest({ body: updateRoleSchema }),
  RoleController.updateRole
);

export default router;
