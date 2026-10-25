import { Router } from 'express';
import { UserController } from '../../controllers/UserController';
import { authGuard } from '../../middlewares/authGuard';
import { hasPermission } from '../../middlewares/rbacGuard';
import { validateRequest } from '../../middlewares/validateRequest';
import {
  createUserSchema,
  updateUserSchema,
} from '../../validators/user.validator';

const router = Router();

/**
 * @route   GET /api/v1/erp/users
 * @desc    Lists all users with filtering, search, and pagination
 * @access  Bearer JWT (users:READ)
 */
router.get(
  '/',
  authGuard,
  hasPermission('users', 'READ'),
  UserController.listUsers
);

/**
 * @route   GET /api/v1/erp/users/:id
 * @desc    Retrieves a single user by MongoDB ObjectId
 * @access  Bearer JWT (users:READ)
 */
router.get(
  '/:id',
  authGuard,
  hasPermission('users', 'READ'),
  UserController.getUserById
);

/**
 * @route   POST /api/v1/erp/users
 * @desc    Creates a new user record
 * @access  Bearer JWT (users:CREATE)
 */
router.post(
  '/',
  authGuard,
  hasPermission('users', 'CREATE'),
  validateRequest({ body: createUserSchema }),
  UserController.createUser
);

/**
 * @route   PUT /api/v1/erp/users/:id
 * @desc    Updates an existing user record
 * @access  Bearer JWT (users:UPDATE)
 */
router.put(
  '/:id',
  authGuard,
  hasPermission('users', 'UPDATE'),
  validateRequest({ body: updateUserSchema }),
  UserController.updateUser
);

/**
 * @route   DELETE /api/v1/erp/users/:id
 * @desc    Deactivates a user and revokes their active sessions
 * @access  Bearer JWT (users:DELETE)
 */
router.delete(
  '/:id',
  authGuard,
  hasPermission('users', 'DELETE'),
  UserController.deactivateUser
);

/**
 * @route   PATCH /api/v1/erp/users/:id/deactivate
 * @desc    Alternate REST endpoint to deactivate user
 * @access  Bearer JWT (users:DELETE)
 */
router.patch(
  '/:id/deactivate',
  authGuard,
  hasPermission('users', 'DELETE'),
  UserController.deactivateUser
);

export default router;
