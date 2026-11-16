import { Request, Response, NextFunction } from 'express';
import { RoleService } from '../services/RoleService';
import { ValidationError } from '../errors/AppError';

export class RoleController {
  /**
   * @route   GET /api/v1/erp/roles/permission-registry
   * @desc    Returns the full permission registry modules and standard role presets
   * @access  Bearer JWT (roles:READ)
   */
  public static async getPermissionRegistry(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const data = RoleService.getPermissionRegistry();
      res.status(200).json({
        success: true,
        statusCode: 200,
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   GET /api/v1/erp/roles
   * @desc    Lists all RBAC roles with user counts and pagination
   * @access  Bearer JWT (roles:READ)
   */
  public static async listRoles(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { search, isActive, isSystemRole } = req.query;

      const page = Math.max(1, parseInt(String(req.query.page), 10) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit), 10) || 50));

      const result = await RoleService.listRoles(
        {
          search: search ? String(search) : undefined,
          isActive: isActive !== undefined ? String(isActive) === 'true' : undefined,
          isSystemRole: isSystemRole !== undefined ? String(isSystemRole) === 'true' : undefined,
        },
        page,
        limit
      );

      res.status(200).json({
        success: true,
        statusCode: 200,
        data: result.roles,
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
   * @route   GET /api/v1/erp/roles/:id
   * @desc    Retrieves a single role with assigned users list
   * @access  Bearer JWT (roles:READ)
   */
  public static async getRoleById(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = String(req.params.id);
      const role = await RoleService.getRoleById(id);

      res.status(200).json({
        success: true,
        statusCode: 200,
        data: role,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   POST /api/v1/erp/roles
   * @desc    Creates a new RBAC role with granular module:actions permissions
   * @access  Bearer JWT (roles:MANAGE or roles:CREATE)
   */
  public static async createRole(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const actorId = (req as any).user?._id?.toString() || (req as any).user?.id?.toString();
      const role = await RoleService.createRole(req.body, actorId);

      res.status(201).json({
        success: true,
        statusCode: 201,
        message: 'Role created successfully',
        data: role,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   PUT /api/v1/erp/roles/:id
   * @desc    Updates an existing role's permissions or configuration
   * @access  Bearer JWT (roles:MANAGE or roles:UPDATE)
   */
  public static async updateRole(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = String(req.params.id);
      const actorId = (req as any).user?._id?.toString() || (req as any).user?.id?.toString();
      const role = await RoleService.updateRole(id, req.body, actorId);

      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Role updated successfully',
        data: role,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   POST /api/v1/erp/roles/:id/duplicate
   * @desc    Clones an existing role's permissions into a new role
   * @access  Bearer JWT (roles:MANAGE or roles:CREATE)
   */
  public static async duplicateRole(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = String(req.params.id);
      const { newRoleName, newSlug } = req.body;
      const actorId = (req as any).user?._id?.toString() || (req as any).user?.id?.toString();

      if (!newRoleName || !newRoleName.trim()) {
        throw new ValidationError('newRoleName is required to duplicate a role.');
      }

      const clonedRole = await RoleService.duplicateRole(
        id,
        newRoleName.trim(),
        newSlug?.trim(),
        actorId
      );

      res.status(201).json({
        success: true,
        statusCode: 201,
        message: 'Role duplicated successfully',
        data: clonedRole,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   PUT /api/v1/erp/roles/:id/permissions
   * @desc    Updates the granular permission matrix for a role
   * @access  Bearer JWT (roles:MANAGE or roles:UPDATE)
   */
  public static async updateRolePermissions(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = String(req.params.id);
      const { permissions } = req.body;
      const actorId = (req as any).user?._id?.toString() || (req as any).user?.id?.toString();

      if (!Array.isArray(permissions)) {
        throw new ValidationError('permissions must be an array of module action objects.');
      }

      const role = await RoleService.updateRolePermissions(id, permissions, actorId);

      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Role permissions updated successfully',
        data: role,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   DELETE /api/v1/erp/roles/:id
   * @desc    Deletes a role (protected against system roles and assigned roles)
   * @access  Bearer JWT (roles:MANAGE or roles:DELETE)
   */
  public static async deleteRole(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = String(req.params.id);
      const actorId = (req as any).user?._id?.toString() || (req as any).user?.id?.toString();
      const result = await RoleService.deleteRole(id, actorId);

      res.status(200).json({
        success: true,
        statusCode: 200,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   POST /api/v1/erp/roles/seed
   * @desc    Seeds default enterprise roles idempotently
   * @access  Bearer JWT (roles:MANAGE)
   */
  public static async seedStandardRoles(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const actorId = (req as any).user?._id?.toString() || (req as any).user?.id?.toString();
      const result = await RoleService.seedStandardRoles(actorId);

      res.status(200).json({
        success: true,
        statusCode: 200,
        message: `Standard roles verified. Created: ${result.created.length}, Existing: ${result.existing.length}`,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default RoleController;
