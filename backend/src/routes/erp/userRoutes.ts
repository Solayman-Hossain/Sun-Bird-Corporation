import { Router } from 'express';
import { UserController } from '../../controllers/UserController';
import { authGuard } from '../../middlewares/authGuard';
import { hasPermission } from '../../middlewares/rbacGuard';

const router = Router();

/**
 * @route   GET /api/v1/erp/users/dashboard-stats
 * @desc    Get dashboard metrics for user management
 * @access  Bearer JWT (users:READ or users:VIEW)
 */
router.get(
  '/dashboard-stats',
  authGuard,
  hasPermission('users', 'READ'),
  UserController.getDashboardStats
);

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
 * @route   GET /api/v1/erp/users/:id/sessions
 * @desc    Retrieves active JWT sessions for a user
 * @access  Bearer JWT (users:READ)
 */
router.get(
  '/:id/sessions',
  authGuard,
  hasPermission('users', 'READ'),
  UserController.getUserSessions
);

/**
 * @route   DELETE /api/v1/erp/users/:id/sessions
 * @desc    Revokes all active sessions for a user
 * @access  Bearer JWT (users:UPDATE or users:DELETE)
 */
router.delete(
  '/:id/sessions',
  authGuard,
  hasPermission('users', 'UPDATE'),
  UserController.revokeUserSessions
);

/**
 * @route   GET /api/v1/erp/users/:id/login-history
 * @desc    Retrieves login history audit records for a user
 * @access  Bearer JWT (users:READ)
 */
router.get(
  '/:id/login-history',
  authGuard,
  hasPermission('users', 'READ'),
  UserController.getUserLoginHistory
);

/**
 * @route   PATCH /api/v1/erp/users/:id/status
 * @desc    Updates status (ACTIVE, INACTIVE, SUSPENDED, LOCKED)
 * @access  Bearer JWT (users:UPDATE)
 */
router.patch(
  '/:id/status',
  authGuard,
  hasPermission('users', 'UPDATE'),
  UserController.setUserStatus
);

/**
 * @route   POST /api/v1/erp/users/:id/unlock
 * @desc    Unlocks a locked account
 * @access  Bearer JWT (users:UPDATE)
 */
router.post(
  '/:id/unlock',
  authGuard,
  hasPermission('users', 'UPDATE'),
  UserController.unlockUser
);

/**
 * @route   POST /api/v1/erp/users/:id/reset-password
 * @desc    Resets a user password with optional force-change flag
 * @access  Bearer JWT (users:UPDATE)
 */
router.post(
  '/:id/reset-password',
  authGuard,
  hasPermission('users', 'UPDATE'),
  UserController.resetPassword
);

/**
 * @route   PUT /api/v1/erp/users/:id/organizations
 * @desc    Assigns allowed organizations and sets default organization
 * @access  Bearer JWT (users:UPDATE)
 */
router.put(
  '/:id/organizations',
  authGuard,
  hasPermission('users', 'UPDATE'),
  UserController.assignOrganizations
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
