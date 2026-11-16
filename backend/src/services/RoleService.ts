import { Types } from 'mongoose';
import { RoleModel, IRole } from '../models/Role';
import { UserModel } from '../models/User';
import { AuditLogService } from './AuditLogService';
import {
  NotFoundError,
  DuplicateKeyError,
  ValidationError,
} from '../errors/AppError';
import {
  PERMISSION_REGISTRY,
  STANDARD_ROLE_PRESETS,
  ModulePermissionDefinition,
} from '../config/permissionRegistry';

export interface CreateRoleDTO {
  roleName: string;
  slug?: string;
  description?: string;
  permissions?: Array<{
    module: string;
    actions: string[];
  }>;
  isSystemRole?: boolean;
  isActive?: boolean;
  assignedOrganizations?: string[];
}

export interface UpdateRoleDTO {
  roleName?: string;
  description?: string;
  permissions?: Array<{
    module: string;
    actions: string[];
  }>;
  isActive?: boolean;
  assignedOrganizations?: string[];
}

function getSafeActorId(actorId?: string): Types.ObjectId {
  if (actorId && Types.ObjectId.isValid(actorId) && actorId.length === 24) {
    return new Types.ObjectId(actorId);
  }
  return new Types.ObjectId('000000000000000000000001');
}

export class RoleService {
  /**
   * Returns full Permission Registry schema and available Standard Presets
   */
  public static getPermissionRegistry(): {
    registry: ModulePermissionDefinition[];
    presets: typeof STANDARD_ROLE_PRESETS;
  } {
    return {
      registry: PERMISSION_REGISTRY,
      presets: STANDARD_ROLE_PRESETS,
    };
  }

  /**
   * Lists roles with user counts and pagination
   */
  public static async listRoles(
    filterParams: {
      search?: string;
      isActive?: boolean;
      isSystemRole?: boolean;
    } = {},
    page: number = 1,
    limit: number = 50
  ): Promise<{
    roles: any[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const query: Record<string, any> = {};

    if (filterParams.isActive !== undefined) {
      query.isActive = filterParams.isActive;
    }
    if (filterParams.isSystemRole !== undefined) {
      query.isSystemRole = filterParams.isSystemRole;
    }
    if (filterParams.search) {
      const searchRegex = new RegExp(filterParams.search.trim(), 'i');
      query.$or = [
        { roleName: searchRegex },
        { slug: searchRegex },
        { description: searchRegex },
      ];
    }

    const safePage = Math.max(1, page);
    const safeLimit = Math.min(100, Math.max(1, limit));
    const skip = (safePage - 1) * safeLimit;

    const [roles, total] = await Promise.all([
      RoleModel.find(query).sort({ isSystemRole: -1, roleName: 1 }).skip(skip).limit(safeLimit).lean(),
      RoleModel.countDocuments(query),
    ]);

    // Attach user counts per role
    const rolesWithCounts = await Promise.all(
      roles.map(async (role) => {
        const assignedUsersCount = await UserModel.countDocuments({
          $or: [
            { roleId: role._id },
            { assignedRoles: role._id },
          ],
        });
        return {
          ...role,
          assignedUsersCount,
        };
      })
    );

    return {
      roles: rolesWithCounts,
      total,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.ceil(total / safeLimit),
    };
  }

  /**
   * Retrieves single role by ID with detailed assigned users
   */
  public static async getRoleById(roleId: string): Promise<any> {
    if (!Types.ObjectId.isValid(roleId)) {
      throw new NotFoundError('Role', roleId);
    }

    const role = await RoleModel.findById(roleId).lean();
    if (!role) {
      throw new NotFoundError('Role', roleId);
    }

    const assignedUsers = await UserModel.find({
      $or: [
        { roleId: role._id },
        { assignedRoles: role._id },
      ],
    })
      .select('fullName username email mobile status department designation profileImage')
      .lean();

    return {
      ...role,
      assignedUsers,
      assignedUsersCount: assignedUsers.length,
    };
  }

  /**
   * Creates a new RBAC role
   */
  public static async createRole(data: CreateRoleDTO, actorId?: string): Promise<IRole> {
    const trimmedRoleName = data.roleName.trim();
    const slug = (data.slug || trimmedRoleName.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')).trim();

    // Check unique slug and name
    const existing = await RoleModel.findOne({
      $or: [{ slug }, { roleName: trimmedRoleName }],
    });

    if (existing) {
      if (existing.slug === slug) {
        throw new DuplicateKeyError('slug', slug);
      }
      if (existing.roleName === trimmedRoleName) {
        throw new DuplicateKeyError('roleName', trimmedRoleName);
      }
    }

    const role = await RoleModel.create({
      roleName: trimmedRoleName,
      slug,
      description: data.description?.trim(),
      permissions: data.permissions || [],
      isSystemRole: data.isSystemRole || false,
      isActive: data.isActive !== undefined ? data.isActive : true,
      assignedOrganizations: data.assignedOrganizations?.map((id) => new Types.ObjectId(id)) || [],
    });

    await AuditLogService.logAction({
      action: 'ROLE_CREATE',
      actorId: getSafeActorId(actorId),
      actorRole: 'ADMIN',
      targetCollection: 'roles',
      targetId: role._id,
      notes: `Created role ${role.roleName} (${role.slug}), system: ${role.isSystemRole}, permissions: ${role.permissions.length}`,
    });

    return role;
  }

  /**
   * Updates an existing role
   */
  public static async updateRole(
    roleId: string,
    data: UpdateRoleDTO,
    actorId?: string
  ): Promise<IRole> {
    if (!Types.ObjectId.isValid(roleId)) {
      throw new NotFoundError('Role', roleId);
    }

    const role = await RoleModel.findById(roleId);
    if (!role) {
      throw new NotFoundError('Role', roleId);
    }

    if (data.roleName && data.roleName.trim() !== role.roleName) {
      const trimmedName = data.roleName.trim();
      const existing = await RoleModel.findOne({
        roleName: trimmedName,
        _id: { $ne: role._id },
      });
      if (existing) {
        throw new DuplicateKeyError('roleName', trimmedName);
      }
      role.roleName = trimmedName;
    }

    if (data.description !== undefined) {
      role.description = data.description.trim();
    }

    if (data.permissions !== undefined) {
      role.permissions = data.permissions;
    }

    if (data.isActive !== undefined) {
      if (role.isSystemRole && data.isActive === false) {
        throw new ValidationError('System-critical roles cannot be deactivated.');
      }
      role.isActive = data.isActive;
    }

    if (data.assignedOrganizations !== undefined) {
      role.assignedOrganizations = data.assignedOrganizations.map((id) => new Types.ObjectId(id));
    }

    await role.save();

    await AuditLogService.logAction({
      action: 'ROLE_UPDATE',
      actorId: getSafeActorId(actorId),
      actorRole: 'ADMIN',
      targetCollection: 'roles',
      targetId: role._id,
      notes: `Updated role ${role.roleName}, active: ${role.isActive}, permissions: ${role.permissions.length}`,
    });

    return role;
  }

  /**
   * Duplicates an existing role to quickly clone permissions
   */
  public static async duplicateRole(
    sourceRoleId: string,
    newRoleName: string,
    newSlug?: string,
    actorId?: string
  ): Promise<IRole> {
    if (!Types.ObjectId.isValid(sourceRoleId)) {
      throw new NotFoundError('Source Role', sourceRoleId);
    }

    const sourceRole = await RoleModel.findById(sourceRoleId).lean();
    if (!sourceRole) {
      throw new NotFoundError('Source Role', sourceRoleId);
    }

    const trimmedName = newRoleName.trim();
    const slug = (newSlug || trimmedName.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')).trim();

    const existing = await RoleModel.findOne({
      $or: [{ slug }, { roleName: trimmedName }],
    });
    if (existing) {
      if (existing.slug === slug) {
        throw new DuplicateKeyError('slug', slug);
      }
      throw new DuplicateKeyError('roleName', trimmedName);
    }

    const clonedRole = await RoleModel.create({
      roleName: trimmedName,
      slug,
      description: `Cloned from ${sourceRole.roleName}. ${sourceRole.description || ''}`.trim(),
      permissions: sourceRole.permissions,
      isSystemRole: false, // Never clone as system role
      isActive: true,
      assignedOrganizations: sourceRole.assignedOrganizations || [],
    });

    await AuditLogService.logAction({
      action: 'ROLE_DUPLICATE',
      actorId: getSafeActorId(actorId),
      actorRole: 'ADMIN',
      targetCollection: 'roles',
      targetId: clonedRole._id,
      notes: `Cloned role from ${sourceRole.roleName} to ${clonedRole.roleName}`,
    });

    return clonedRole;
  }

  /**
   * Deletes a role with protection against deleting system roles or roles currently in use
   */
  public static async deleteRole(roleId: string, actorId?: string): Promise<{ deleted: boolean; message: string }> {
    if (!Types.ObjectId.isValid(roleId)) {
      throw new NotFoundError('Role', roleId);
    }

    const role = await RoleModel.findById(roleId);
    if (!role) {
      throw new NotFoundError('Role', roleId);
    }

    if (role.isSystemRole) {
      throw new ValidationError(`System-critical role '${role.roleName}' cannot be deleted.`);
    }

    // Check if any users have this role assigned
    const assignedCount = await UserModel.countDocuments({
      $or: [
        { roleId: role._id },
        { assignedRoles: role._id },
      ],
    });

    if (assignedCount > 0) {
      throw new ValidationError(
        `Cannot delete role '${role.roleName}' because ${assignedCount} user(s) are currently assigned to it. Reassign them before deleting.`
      );
    }

    await RoleModel.findByIdAndDelete(roleId);

    await AuditLogService.logAction({
      action: 'ROLE_DELETE',
      actorId: getSafeActorId(actorId),
      actorRole: 'ADMIN',
      targetCollection: 'roles',
      targetId: new Types.ObjectId(roleId),
      notes: `Deleted role ${role.roleName} (${role.slug})`,
    });

    return {
      deleted: true,
      message: `Role '${role.roleName}' deleted successfully.`,
    };
  }

  /**
   * Directly updates permission matrix of a specific role
   */
  public static async updateRolePermissions(
    roleId: string,
    permissions: Array<{ module: string; actions: string[] }>,
    actorId?: string
  ): Promise<IRole> {
    if (!Types.ObjectId.isValid(roleId)) {
      throw new NotFoundError('Role', roleId);
    }

    const role = await RoleModel.findById(roleId);
    if (!role) {
      throw new NotFoundError('Role', roleId);
    }

    role.permissions = permissions;
    await role.save();

    await AuditLogService.logAction({
      action: 'ROLE_PERMISSIONS_UPDATE',
      actorId: getSafeActorId(actorId),
      actorRole: 'ADMIN',
      targetCollection: 'roles',
      targetId: role._id,
      notes: `Updated permissions for ${role.roleName}, total modules: ${permissions.length}`,
    });

    return role;
  }

  /**
   * Seeds standard roles into the database idempotently
   */
  public static async seedStandardRoles(actorId?: string): Promise<{
    created: string[];
    existing: string[];
  }> {
    const created: string[] = [];
    const existing: string[] = [];

    for (const preset of STANDARD_ROLE_PRESETS) {
      const found = await RoleModel.findOne({
        $or: [{ slug: preset.slug }, { roleName: preset.roleName }],
      });

      if (!found) {
        await RoleModel.create({
          roleName: preset.roleName,
          slug: preset.slug,
          description: preset.description,
          isSystemRole: preset.isSystemRole,
          isActive: true,
          permissions: preset.permissions,
        });
        created.push(preset.roleName);
      } else {
        existing.push(preset.roleName);
      }
    }

    if (created.length > 0) {
      await AuditLogService.logAction({
        action: 'ROLES_SEEDED',
        actorId: getSafeActorId(actorId),
        actorRole: 'SYSTEM',
        targetCollection: 'roles',
        targetId: new Types.ObjectId('000000000000000000000001'),
        notes: `Seeded standard enterprise roles. Created: ${created.join(', ')}`,
      });
    }

    return { created, existing };
  }
}

export default RoleService;

