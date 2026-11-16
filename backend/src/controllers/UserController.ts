import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { UserModel } from '../models/User';
import { TokenService } from '../services/TokenService';
import { UserService } from '../services/UserService';
import {
  NotFoundError,
  DuplicateKeyError,
  ValidationError,
} from '../errors/AppError';

export class UserController {
  /**
   * @route   GET /api/v1/erp/users/dashboard-stats
   * @desc    Live user & security statistics for user management dashboard
   * @access  Bearer JWT (users:READ or users:VIEW)
   */
  public static async getDashboardStats(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const stats = await UserService.getDashboardStats();
      res.status(200).json({
        success: true,
        statusCode: 200,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   GET /api/v1/erp/users
   * @desc    Lists users with filtering, search, and pagination
   * @access  Bearer JWT (users:READ)
   */
  public static async listUsers(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { userType, branchId, warehouseId, isActive, status, department, organizationId, search } = req.query;

      const page = Math.max(1, parseInt(String(req.query.page), 10) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit), 10) || 20));

      const result = await UserService.listUsers({
        search: search ? String(search) : undefined,
        status: status ? String(status) : undefined,
        isActive: isActive !== undefined ? String(isActive) === 'true' : undefined,
        userType: userType ? String(userType) : undefined,
        department: department ? String(department) : undefined,
        organizationId: organizationId ? String(organizationId) : undefined,
        branchId: branchId ? String(branchId) : undefined,
        warehouseId: warehouseId ? String(warehouseId) : undefined,
        page,
        limit,
      });

      res.status(200).json({
        success: true,
        statusCode: 200,
        data: result.users,
        meta: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: result.totalPages,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   GET /api/v1/erp/users/:id
   * @desc    Retrieves a single user by their MongoDB ObjectId
   * @access  Bearer JWT (users:READ)
   */
  public static async getUserById(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = String(req.params.id);
      const user = await UserService.getUserById(id);

      res.status(200).json({
        success: true,
        statusCode: 200,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   POST /api/v1/erp/users
   * @desc    Creates a new user record with bcrypt password hash
   * @access  Bearer JWT (users:CREATE)
   */
  public static async createUser(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const actorId = (req as any).user?._id?.toString() || (req as any).user?.id?.toString();
      const user = await UserService.createUser(req.body, actorId);

      res.status(201).json({
        success: true,
        statusCode: 201,
        message: 'User created successfully',
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   PUT /api/v1/erp/users/:id
   * @desc    Updates user attributes, profile, or role assignment
   * @access  Bearer JWT (users:UPDATE)
   */
  public static async updateUser(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = String(req.params.id);
      const actorId = (req as any).user?._id?.toString() || (req as any).user?.id?.toString();
      const user = await UserService.updateUser(id, req.body, actorId);

      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'User updated successfully',
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   PATCH /api/v1/erp/users/:id/status
   * @desc    Updates status (ACTIVE, INACTIVE, SUSPENDED, LOCKED)
   * @access  Bearer JWT (users:UPDATE or users:DELETE)
   */
  public static async setUserStatus(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = String(req.params.id);
      const { status } = req.body;
      const actorId = (req as any).user?._id?.toString() || (req as any).user?.id?.toString();

      if (!status || !['ACTIVE', 'INACTIVE', 'SUSPENDED', 'LOCKED'].includes(status)) {
        throw new ValidationError('Invalid user status. Allowed: ACTIVE, INACTIVE, SUSPENDED, LOCKED');
      }

      const user = await UserService.setUserStatus(id, status, actorId);

      res.status(200).json({
        success: true,
        statusCode: 200,
        message: `User status changed to ${status}`,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   POST /api/v1/erp/users/:id/unlock
   * @desc    Unlocks a locked account and resets failed attempts
   * @access  Bearer JWT (users:UPDATE)
   */
  public static async unlockUser(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = String(req.params.id);
      const actorId = (req as any).user?._id?.toString() || (req as any).user?.id?.toString();
      const user = await UserService.unlockUser(id, actorId);

      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'User account unlocked successfully',
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   POST /api/v1/erp/users/:id/reset-password
   * @desc    Admin resets user password with optional force-change flag
   * @access  Bearer JWT (users:UPDATE or users:RESET_PASSWORD)
   */
  public static async resetPassword(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = String(req.params.id);
      const { newPassword, forcePasswordChange } = req.body;
      const actorId = (req as any).user?._id?.toString() || (req as any).user?.id?.toString();

      if (!newPassword || newPassword.length < 6) {
        throw new ValidationError('Password must be at least 6 characters long');
      }

      await UserService.resetPassword(id, newPassword, forcePasswordChange ?? true, actorId);

      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Password reset successfully. Active sessions revoked.',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   PUT /api/v1/erp/users/:id/organizations
   * @desc    Assigns allowed organizations and sets default organization
   * @access  Bearer JWT (users:UPDATE)
   */
  public static async assignOrganizations(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = String(req.params.id);
      const { organizationIds, defaultOrganizationId } = req.body;
      const actorId = (req as any).user?._id?.toString() || (req as any).user?.id?.toString();

      if (!Array.isArray(organizationIds)) {
        throw new ValidationError('organizationIds must be an array of IDs');
      }

      const user = await UserService.assignOrganizations(
        id,
        organizationIds,
        defaultOrganizationId,
        actorId
      );

      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Assigned organizations updated successfully',
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   GET /api/v1/erp/users/:id/sessions
   * @desc    Retrieves active JWT sessions for a user
   * @access  Bearer JWT (users:READ)
   */
  public static async getUserSessions(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = String(req.params.id);
      const sessions = await UserService.getUserSessions(id);

      res.status(200).json({
        success: true,
        statusCode: 200,
        data: sessions,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   DELETE /api/v1/erp/users/:id/sessions
   * @desc    Revokes all active sessions for a user
   * @access  Bearer JWT (users:UPDATE or users:DELETE)
   */
  public static async revokeUserSessions(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = String(req.params.id);
      const actorId = (req as any).user?._id?.toString() || (req as any).user?.id?.toString();
      const count = await UserService.revokeUserSessions(id, actorId);

      res.status(200).json({
        success: true,
        statusCode: 200,
        message: `Successfully revoked ${count} active session(s)`,
        data: { revokedCount: count },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   GET /api/v1/erp/users/:id/login-history
   * @desc    Retrieves login history audit records for a user
   * @access  Bearer JWT (users:READ)
   */
  public static async getUserLoginHistory(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = String(req.params.id);
      const limit = parseInt(String(req.query.limit), 10) || 20;
      const history = await UserService.getUserLoginHistory(id, limit);

      res.status(200).json({
        success: true,
        statusCode: 200,
        data: history,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   DELETE /api/v1/erp/users/:id or PATCH /api/v1/erp/users/:id/deactivate
   * @desc    Deactivates user and terminates all active token sessions
   * @access  Bearer JWT (users:DELETE)
   */
  public static async deactivateUser(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = String(req.params.id);
      const actorId = (req as any).user?._id?.toString() || (req as any).user?.id?.toString();

      await UserService.setUserStatus(id, 'INACTIVE', actorId);

      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'User deactivated successfully and all active sessions revoked',
      });
    } catch (error) {
      next(error);
    }
  }
}

export default UserController;
