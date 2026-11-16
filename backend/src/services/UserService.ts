import bcrypt from 'bcryptjs';
import { Types } from 'mongoose';
import { UserModel, IUser } from '../models/User';
import { RoleModel } from '../models/Role';
import { RefreshTokenModel } from '../models/RefreshToken';
import { LoginHistoryModel } from '../models/LoginHistory';
import { AuditLogModel } from '../models/AuditLog';
import { AuditLogService } from './AuditLogService';
import { OrganizationModel } from '../models/Organization';
import {
  NotFoundError,
  DuplicateKeyError,
  ValidationError,
  ForbiddenError,
} from '../errors/AppError';
import logger from '../config/logger';

export interface UserDashboardStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  suspendedUsers: number;
  lockedUsers: number;
  totalRoles: number;
  activeSessions: number;
  failedLoginAttemptsCount: number;
  usersByDepartment: Array<{ department: string; count: number }>;
  usersByRole: Array<{ roleName: string; count: number }>;
  recentLogins: any[];
  recentlyCreatedUsers: any[];
}

export class UserService {
  private static getSafeActorId(actorId?: string | Types.ObjectId): Types.ObjectId {
    if (actorId && Types.ObjectId.isValid(actorId.toString())) {
      return new Types.ObjectId(actorId.toString());
    }
    return new Types.ObjectId('000000000000000000000001');
  }

  /**
   * List users with search, role, status and organization filtering
   */
  public static async listUsers(params: {
    search?: string;
    status?: string;
    isActive?: boolean;
    userType?: string;
    roleId?: string;
    department?: string;
    organizationId?: string;
    branchId?: string;
    warehouseId?: string;
    page?: number;
    limit?: number;
  }) {
    const filter: Record<string, any> = {};

    if (params.isActive !== undefined) {
      filter.isActive = params.isActive;
    }

    if (params.department) {
      filter.department = params.department;
    }

    if (params.branchId && Types.ObjectId.isValid(params.branchId)) {
      filter.branchId = new Types.ObjectId(params.branchId);
    }

    if (params.warehouseId && Types.ObjectId.isValid(params.warehouseId)) {
      filter.warehouseId = new Types.ObjectId(params.warehouseId);
    }

    if (params.status) {
      if (params.status === 'ACTIVE') {
        filter.$or = [{ status: 'ACTIVE' }, { isActive: true }];
      } else {
        filter.status = params.status;
      }
    }

    if (params.userType) {
      filter.userType = params.userType;
    }

    if (params.roleId && Types.ObjectId.isValid(params.roleId)) {
      filter.roleId = new Types.ObjectId(params.roleId);
    }

    if (params.organizationId && Types.ObjectId.isValid(params.organizationId)) {
      filter.authorizedOrganizations = new Types.ObjectId(params.organizationId);
    }

    if (params.search && params.search.trim()) {
      const q = params.search.trim();
      const searchRegex = new RegExp(q, 'i');
      filter.$or = [
        { fullName: searchRegex },
        { email: searchRegex },
        { mobile: searchRegex },
        { username: searchRegex },
        { employeeId: searchRegex },
        { department: searchRegex },
        { designation: searchRegex },
      ];
    }

    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 20));
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      UserModel.find(filter)
        .select('-passwordHash -totpSecret')
        .populate('roleId', 'roleName slug permissions isSystemRole')
        .populate('authorizedOrganizations', 'organizationCode displayName legalName')
        .populate('defaultOrganizationId', 'organizationCode displayName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      UserModel.countDocuments(filter),
    ]);

    return {
      users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get single user by ID
   */
  public static async getUserById(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new ValidationError(`Invalid user ObjectId format: '${id}'`);
    }

    const user = await UserModel.findById(id)
      .select('-passwordHash -totpSecret')
      .populate('roleId', 'roleName slug permissions isSystemRole')
      .populate('assignedRoles', 'roleName slug permissions')
      .populate('authorizedOrganizations', 'organizationCode displayName legalName')
      .populate('defaultOrganizationId', 'organizationCode displayName');

    if (!user) {
      throw new NotFoundError(`User with ID '${id}' not found`);
    }

    return user;
  }

  /**
   * Create new user with secure password hash and validation
   */
  public static async createUser(
    data: any,
    actorId: string | Types.ObjectId = 'SYSTEM',
    actorRole: string = 'SUPER_ADMIN'
  ) {
    const email = data.email.toLowerCase().trim();
    const mobile = data.mobile.trim();

    // Check email uniqueness
    const emailExists = await UserModel.findOne({ email });
    if (emailExists) {
      throw new DuplicateKeyError('email', email);
    }

    // Check mobile uniqueness
    const mobileExists = await UserModel.findOne({ mobile });
    if (mobileExists) {
      throw new DuplicateKeyError('mobile', mobile);
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(data.password, saltRounds);

    // Validate role if passed
    if (data.roleId) {
      const role = await RoleModel.findById(data.roleId);
      if (!role) {
        throw new NotFoundError(`Assigned role '${data.roleId}' does not exist`);
      }
    }

    // Privilege escalation prevention: non-SUPER_ADMIN cannot create SUPER_ADMIN users
    if (data.userType === 'SUPER_ADMIN' && actorRole !== 'SUPER_ADMIN') {
      throw new ForbiddenError('Only a Super Administrator can create SUPER_ADMIN accounts');
    }

    const newUser = new UserModel({
      ...data,
      userType: data.userType || 'STAFF',
      email,
      mobile,
      passwordHash,
      status: data.status || 'ACTIVE',
      isActive: data.status ? data.status === 'ACTIVE' : true,
      createdBy: Types.ObjectId.isValid(actorId) ? new Types.ObjectId(actorId) : undefined,
    });

    await newUser.save();

    await AuditLogService.logAction({
      actorId: this.getSafeActorId(actorId),
      actorRole,
      action: 'USER_CREATE',
      targetCollection: 'users',
      targetId: newUser._id,
      afterSnapshot: {
        userId: newUser._id,
        fullName: newUser.fullName,
        email: newUser.email,
        userType: newUser.userType,
        roleId: newUser.roleId,
      },
      notes: `Created user ${newUser.fullName} (${newUser.email})`,
    });

    return this.getUserById(newUser._id.toString());
  }

  /**
   * Update user profile, roles, and organizations
   */
  public static async updateUser(
    id: string,
    data: any,
    actorId: string | Types.ObjectId = 'SYSTEM',
    actorRole: string = 'SUPER_ADMIN'
  ) {
    if (!Types.ObjectId.isValid(id)) {
      throw new ValidationError(`Invalid user ObjectId format: '${id}'`);
    }

    const user = await UserModel.findById(id);
    if (!user) {
      throw new NotFoundError(`User '${id}' not found`);
    }

    const beforeSnapshot = {
      fullName: user.fullName,
      email: user.email,
      roleId: user.roleId,
      status: user.status,
      isActive: user.isActive,
    };

    // Email collision check
    if (data.email && data.email.toLowerCase().trim() !== user.email) {
      const email = data.email.toLowerCase().trim();
      const existing = await UserModel.findOne({ email, _id: { $ne: user._id } });
      if (existing) {
        throw new DuplicateKeyError('email', email);
      }
      user.email = email;
    }

    // Mobile collision check
    if (data.mobile && data.mobile.trim() !== user.mobile) {
      const mobile = data.mobile.trim();
      const existing = await UserModel.findOne({ mobile, _id: { $ne: user._id } });
      if (existing) {
        throw new DuplicateKeyError('mobile', mobile);
      }
      user.mobile = mobile;
    }

    // Privilege escalation check
    if (data.userType === 'SUPER_ADMIN' && user.userType !== 'SUPER_ADMIN' && actorRole !== 'SUPER_ADMIN') {
      throw new ForbiddenError('Only a Super Administrator can promote accounts to SUPER_ADMIN');
    }

    // Password update if provided
    if (data.password && data.password.trim()) {
      user.passwordHash = await bcrypt.hash(data.password.trim(), 12);
    }

    if (data.fullName) user.fullName = data.fullName.trim();
    if (data.username !== undefined) user.username = data.username ? data.username.trim() : undefined;
    if (data.employeeId !== undefined) user.employeeId = data.employeeId;
    if (data.profileImage !== undefined) user.profileImage = data.profileImage;
    if (data.department !== undefined) user.department = data.department;
    if (data.designation !== undefined) user.designation = data.designation;
    if (data.userType) user.userType = data.userType;
    if (data.roleId) user.roleId = new Types.ObjectId(data.roleId);
    if (data.assignedRoles) {
      user.assignedRoles = data.assignedRoles.map((r: string) => new Types.ObjectId(r));
    }
    if (data.authorizedOrganizations) {
      user.authorizedOrganizations = data.authorizedOrganizations.map(
        (o: string) => new Types.ObjectId(o)
      );
    }
    if (data.defaultOrganizationId) {
      user.defaultOrganizationId = new Types.ObjectId(data.defaultOrganizationId);
    }
    if (data.status) {
      user.status = data.status;
      user.isActive = data.status === 'ACTIVE';
      if (data.status !== 'ACTIVE') {
        // Revoke active sessions immediately
        await RefreshTokenModel.updateMany(
          { userId: user._id, isRevoked: false },
          { $set: { isRevoked: true, revokedAt: new Date() } }
        );
      }
    } else if (data.isActive !== undefined) {
      user.isActive = data.isActive;
      user.status = data.isActive ? 'ACTIVE' : 'INACTIVE';
    }

    await user.save();

    await AuditLogService.logAction({
      actorId: this.getSafeActorId(actorId),
      actorRole,
      action: 'USER_UPDATE',
      targetCollection: 'users',
      targetId: user._id,
      beforeSnapshot,
      afterSnapshot: {
        fullName: user.fullName,
        email: user.email,
        roleId: user.roleId,
        status: user.status,
        isActive: user.isActive,
      },
      notes: `Updated user profile for ${user.fullName}`,
    });

    return this.getUserById(user._id.toString());
  }

  /**
   * Set user status ('ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'LOCKED')
   */
  public static async setStatus(
    id: string,
    status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'LOCKED',
    actorId: string | Types.ObjectId = 'SYSTEM',
    actorRole: string = 'SUPER_ADMIN'
  ) {
    const user = await UserModel.findById(id);
    if (!user) {
      throw new NotFoundError(`User '${id}' not found`);
    }

    const previousStatus = user.status || (user.isActive ? 'ACTIVE' : 'INACTIVE');
    user.status = status;
    user.isActive = status === 'ACTIVE';

    if (status === 'ACTIVE') {
      user.failedLoginAttempts = 0;
      user.lockoutUntil = undefined;
    } else {
      // Inactive / Suspended / Locked -> Revoke all active sessions
      await RefreshTokenModel.updateMany(
        { userId: user._id, isRevoked: false },
        { $set: { isRevoked: true, revokedAt: new Date() } }
      );
    }

    await user.save();

    await AuditLogService.logAction({
      actorId: this.getSafeActorId(actorId),
      actorRole,
      action: 'USER_STATUS_CHANGE',
      targetCollection: 'users',
      targetId: user._id,
      beforeSnapshot: { status: previousStatus },
      afterSnapshot: { status },
      notes: `Changed user status to ${status}`,
    });

    return this.getUserById(user._id.toString());
  }

  public static async setUserStatus(
    id: string,
    status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'LOCKED',
    actorId: string | Types.ObjectId = 'SYSTEM',
    actorRole: string = 'SUPER_ADMIN'
  ) {
    return this.setStatus(id, status, actorId, actorRole);
  }

  /**
   * Unlock locked or suspended user account
   */
  public static async unlockUser(
    id: string,
    actorId: string | Types.ObjectId = 'SYSTEM',
    actorRole: string = 'SUPER_ADMIN'
  ) {
    return this.setStatus(id, 'ACTIVE', actorId, actorRole);
  }

  /**
   * Admin-initiated secure password reset
   */
  public static async resetPassword(
    id: string,
    newPassword: string,
    forceChangeOnLogin: boolean = false,
    actorId: string | Types.ObjectId = 'SYSTEM',
    actorRole: string = 'SUPER_ADMIN'
  ) {
    if (!newPassword || newPassword.length < 6) {
      throw new ValidationError('New password must be at least 6 characters');
    }

    const user = await UserModel.findById(id);
    if (!user) {
      throw new NotFoundError(`User '${id}' not found`);
    }

    user.passwordHash = await bcrypt.hash(newPassword, 12);
    user.forcePasswordChange = forceChangeOnLogin;
    user.failedLoginAttempts = 0;
    user.lockoutUntil = undefined;

    // Invalidate all existing sessions upon password reset
    await RefreshTokenModel.updateMany(
      { userId: user._id, isRevoked: false },
      { $set: { isRevoked: true, revokedAt: new Date() } }
    );

    await user.save();

    await AuditLogService.logAction({
      actorId: this.getSafeActorId(actorId),
      actorRole,
      action: 'USER_PASSWORD_RESET',
      targetCollection: 'users',
      targetId: user._id,
      notes: `Password reset performed for ${user.email} (forceChange: ${forceChangeOnLogin})`,
    });

    return { message: 'Password has been successfully reset and existing sessions revoked' };
  }

  /**
   * Update organization assignments for user
   */
  public static async assignOrganizations(
    id: string,
    organizationIds: string[],
    defaultOrganizationId?: string,
    actorId: string | Types.ObjectId = 'SYSTEM',
    actorRole: string = 'SUPER_ADMIN'
  ) {
    const user = await UserModel.findById(id);
    if (!user) {
      throw new NotFoundError(`User '${id}' not found`);
    }

    // Validate that organization IDs exist
    const validOrgs = await OrganizationModel.find({
      _id: { $in: organizationIds.map((o) => new Types.ObjectId(o)) },
    }).select('_id');

    user.authorizedOrganizations = validOrgs.map((o) => o._id);

    if (defaultOrganizationId && Types.ObjectId.isValid(defaultOrganizationId)) {
      user.defaultOrganizationId = new Types.ObjectId(defaultOrganizationId);
    } else if (validOrgs.length > 0) {
      user.defaultOrganizationId = validOrgs[0]._id;
    }

    await user.save();

    await AuditLogService.logAction({
      actorId: this.getSafeActorId(actorId),
      actorRole,
      action: 'USER_ORGS_ASSIGN',
      targetCollection: 'users',
      targetId: user._id,
      afterSnapshot: {
        authorizedOrganizations: user.authorizedOrganizations,
        defaultOrganizationId: user.defaultOrganizationId,
      },
      notes: `Assigned ${validOrgs.length} organizations to ${user.fullName}`,
    });

    return this.getUserById(user._id.toString());
  }

  /**
   * Active sessions management for user
   */
  public static async getUserSessions(userId: string) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new ValidationError(`Invalid userId: '${userId}'`);
    }

    const sessions = await RefreshTokenModel.find({
      userId: new Types.ObjectId(userId),
      isRevoked: false,
      expiresAt: { $gt: new Date() },
    })
      .sort({ createdAt: -1 })
      .lean();

    return sessions;
  }

  /**
   * Revoke all active sessions for a user
   */
  public static async revokeUserSessions(
    userId: string,
    actorId: string | Types.ObjectId = 'SYSTEM',
    actorRole: string = 'SUPER_ADMIN'
  ) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new ValidationError(`Invalid userId: '${userId}'`);
    }

    const result = await RefreshTokenModel.updateMany(
      { userId: new Types.ObjectId(userId), isRevoked: false },
      { $set: { isRevoked: true, revokedAt: new Date() } }
    );

    await AuditLogService.logAction({
      actorId: this.getSafeActorId(actorId),
      actorRole,
      action: 'USER_SESSIONS_REVOKE',
      targetCollection: 'users',
      targetId: new Types.ObjectId(userId),
      notes: `Revoked ${result.modifiedCount} active sessions`,
    });

    return { revokedCount: result.modifiedCount };
  }

  /**
   * Get login history for user
   */
  public static async getUserLoginHistory(userId: string, limit: number = 50) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new ValidationError(`Invalid userId: '${userId}'`);
    }

    const history = await LoginHistoryModel.find({
      userId: new Types.ObjectId(userId),
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return history;
  }

  /**
   * User management dashboard statistics from live database records
   */
  public static async getDashboardStats(): Promise<UserDashboardStats> {
    const [
      totalUsers,
      activeUsers,
      inactiveUsers,
      suspendedUsers,
      lockedUsers,
      totalRoles,
      activeSessions,
      failedAttempts,
      recentLogins,
      recentlyCreatedUsers,
      deptAgg,
      roleAgg,
    ] = await Promise.all([
      UserModel.countDocuments(),
      UserModel.countDocuments({ $or: [{ status: 'ACTIVE' }, { isActive: true }] }),
      UserModel.countDocuments({ status: 'INACTIVE', isActive: false }),
      UserModel.countDocuments({ status: 'SUSPENDED' }),
      UserModel.countDocuments({ status: 'LOCKED' }),
      RoleModel.countDocuments(),
      RefreshTokenModel.countDocuments({ isRevoked: false, expiresAt: { $gt: new Date() } }),
      LoginHistoryModel.countDocuments({ status: { $in: ['FAILED', 'BLOCKED'] } }),
      LoginHistoryModel.find().sort({ createdAt: -1 }).limit(10).lean(),
      UserModel.find()
        .select('fullName email mobile userType status createdAt')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
      UserModel.aggregate([
        { $match: { department: { $exists: true, $ne: '' } } },
        { $group: { _id: '$department', count: { $sum: 1 } } },
        { $project: { department: '$_id', count: 1, _id: 0 } },
        { $sort: { count: -1 } },
      ]),
      UserModel.aggregate([
        { $match: { roleId: { $exists: true, $ne: null } } },
        { $lookup: { from: 'roles', localField: 'roleId', foreignField: '_id', as: 'roleDoc' } },
        { $unwind: { path: '$roleDoc', preserveNullAndEmptyArrays: true } },
        { $group: { _id: '$roleDoc.roleName', count: { $sum: 1 } } },
        { $project: { roleName: { $ifNull: ['$_id', 'Unassigned'] }, count: 1, _id: 0 } },
        { $sort: { count: -1 } },
      ]),
    ]);

    return {
      totalUsers,
      activeUsers,
      inactiveUsers,
      suspendedUsers,
      lockedUsers,
      totalRoles,
      activeSessions,
      failedLoginAttemptsCount: failedAttempts,
      usersByDepartment: deptAgg,
      usersByRole: roleAgg,
      recentLogins,
      recentlyCreatedUsers,
    };
  }
}

export default UserService;
