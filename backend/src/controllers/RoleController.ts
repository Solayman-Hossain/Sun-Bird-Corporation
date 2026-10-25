import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { RoleModel } from '../models/Role';
import {
  NotFoundError,
  DuplicateKeyError,
  ValidationError,
} from '../errors/AppError';

export class RoleController {
  /**
   * @route   GET /api/v1/erp/roles
   * @desc    Lists all RBAC roles with optional filtering and pagination
   * @access  Bearer JWT (roles:READ)
   */
  public static async listRoles(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { search, isActive } = req.query;

      const filter: Record<string, any> = {};

      if (isActive !== undefined) {
        filter.isActive = String(isActive) === 'true';
      }

      if (search) {
        const searchRegex = new RegExp(String(search).trim(), 'i');
        filter.$or = [
          { roleName: searchRegex },
          { slug: searchRegex },
          { description: searchRegex },
        ];
      }

      const page = Math.max(1, parseInt(String(req.query.page), 10) || 1);
      const limit = Math.min(
        100,
        Math.max(1, parseInt(String(req.query.limit), 10) || 50)
      );
      const skip = (page - 1) * limit;

      const [roles, total] = await Promise.all([
        RoleModel.find(filter)
          .sort({ roleName: 1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        RoleModel.countDocuments(filter),
      ]);

      res.status(200).json({
        success: true,
        statusCode: 200,
        data: roles,
        meta: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
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
      const {
        roleName,
        slug,
        description,
        permissions,
        isSystemRole,
        isActive,
      } = req.body;

      const normalizedSlug = slug.toLowerCase().trim();
      const trimmedRoleName = roleName.trim();

      const existingRole = await RoleModel.findOne({
        $or: [{ slug: normalizedSlug }, { roleName: trimmedRoleName }],
      });

      if (existingRole) {
        if (existingRole.slug === normalizedSlug) {
          throw new DuplicateKeyError('slug', normalizedSlug);
        }
        if (existingRole.roleName === trimmedRoleName) {
          throw new DuplicateKeyError('roleName', trimmedRoleName);
        }
      }

      const role = await RoleModel.create({
        roleName: trimmedRoleName,
        slug: normalizedSlug,
        description: description?.trim(),
        permissions: permissions || [],
        isSystemRole: isSystemRole || false,
        isActive: isActive !== undefined ? isActive : true,
      });

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

      if (!Types.ObjectId.isValid(id)) {
        throw new NotFoundError('Role', id);
      }

      const role = await RoleModel.findById(id);
      if (!role) {
        throw new NotFoundError('Role', id);
      }

      const { roleName, description, permissions, isActive } = req.body;

      if (roleName && roleName.trim() !== role.roleName) {
        const trimmed = roleName.trim();
        const existing = await RoleModel.findOne({
          roleName: trimmed,
          _id: { $ne: role._id },
        });
        if (existing) {
          throw new DuplicateKeyError('roleName', trimmed);
        }
        role.roleName = trimmed;
      }

      if (description !== undefined) {
        role.description = description?.trim();
      }

      if (permissions !== undefined) {
        role.permissions = permissions;
      }

      if (isActive !== undefined) {
        role.isActive = isActive;
      }

      await role.save();

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
}

export default RoleController;
