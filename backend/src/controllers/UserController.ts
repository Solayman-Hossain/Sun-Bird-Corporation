import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { Types } from 'mongoose';
import { UserModel } from '../models/User';
import { TokenService } from '../services/TokenService';
import {
  NotFoundError,
  DuplicateKeyError,
  ValidationError,
} from '../errors/AppError';

export class UserController {
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
      const { userType, branchId, warehouseId, isActive, search } = req.query;

      const filter: Record<string, any> = {};

      if (userType) {
        filter.userType = userType;
      }
      if (branchId) {
        filter.branchId = branchId;
      }
      if (warehouseId) {
        filter.warehouseId = warehouseId;
      }
      if (isActive !== undefined) {
        filter.isActive = String(isActive) === 'true';
      }
      if (search) {
        const searchRegex = new RegExp(String(search).trim(), 'i');
        filter.$or = [
          { fullName: searchRegex },
          { email: searchRegex },
          { mobile: searchRegex },
        ];
      }

      const page = Math.max(1, parseInt(String(req.query.page), 10) || 1);
      const limit = Math.min(
        100,
        Math.max(1, parseInt(String(req.query.limit), 10) || 20)
      );
      const skip = (page - 1) * limit;

      const [users, total] = await Promise.all([
        UserModel.find(filter)
          .select('-passwordHash -totpSecret')
          .populate('roleId', 'roleName slug permissions')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        UserModel.countDocuments(filter),
      ]);

      res.status(200).json({
        success: true,
        statusCode: 200,
        data: users,
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

      if (!Types.ObjectId.isValid(id)) {
        throw new NotFoundError('User', id);
      }

      const user = await UserModel.findById(id)
        .select('-passwordHash -totpSecret')
        .populate('roleId', 'roleName slug permissions')
        .lean();

      if (!user) {
        throw new NotFoundError('User', id);
      }

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
      const {
        fullName,
        email,
        mobile,
        password,
        userType,
        roleId,
        branchId,
        warehouseId,
        hardwareFingerprint,
      } = req.body;

      const normalizedEmail = email.toLowerCase().trim();
      const normalizedMobile = mobile.trim();

      // Check unique constraints before insertion
      const existingUser = await UserModel.findOne({
        $or: [{ email: normalizedEmail }, { mobile: normalizedMobile }],
      });

      if (existingUser) {
        if (existingUser.email === normalizedEmail) {
          throw new DuplicateKeyError('email', normalizedEmail);
        }
        if (existingUser.mobile === normalizedMobile) {
          throw new DuplicateKeyError('mobile', normalizedMobile);
        }
      }

      const passwordHash = await bcrypt.hash(password, 10);

      const user = await UserModel.create({
        fullName: fullName.trim(),
        email: normalizedEmail,
        mobile: normalizedMobile,
        passwordHash,
        userType,
        roleId: roleId ? new Types.ObjectId(roleId) : undefined,
        branchId: branchId ? new Types.ObjectId(branchId) : undefined,
        warehouseId: warehouseId ? new Types.ObjectId(warehouseId) : undefined,
        hardwareFingerprint: hardwareFingerprint?.trim(),
        isActive: true,
      });

      res.status(201).json({
        success: true,
        statusCode: 201,
        message: 'User created successfully',
        data: {
          _id: user._id.toString(),
          fullName: user.fullName,
          email: user.email,
          mobile: user.mobile,
          userType: user.userType,
          roleId: user.roleId?.toString(),
          branchId: user.branchId?.toString(),
          warehouseId: user.warehouseId?.toString(),
          isActive: user.isActive,
          createdAt: user.createdAt,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   PUT /api/v1/erp/users/:id
   * @desc    Updates user attributes, password, or role assignment
   * @access  Bearer JWT (users:UPDATE)
   */
  public static async updateUser(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = String(req.params.id);

      if (!Types.ObjectId.isValid(id)) {
        throw new NotFoundError('User', id);
      }

      const user = await UserModel.findById(id);
      if (!user) {
        throw new NotFoundError('User', id);
      }

      const {
        fullName,
        email,
        mobile,
        password,
        userType,
        roleId,
        branchId,
        warehouseId,
        hardwareFingerprint,
        isActive,
      } = req.body;

      // Check unique constraints if email is changing
      if (email && email.toLowerCase().trim() !== user.email) {
        const normalizedEmail = email.toLowerCase().trim();
        const existing = await UserModel.findOne({
          email: normalizedEmail,
          _id: { $ne: user._id },
        });
        if (existing) {
          throw new DuplicateKeyError('email', normalizedEmail);
        }
        user.email = normalizedEmail;
      }

      // Check unique constraints if mobile is changing
      if (mobile && mobile.trim() !== user.mobile) {
        const normalizedMobile = mobile.trim();
        const existing = await UserModel.findOne({
          mobile: normalizedMobile,
          _id: { $ne: user._id },
        });
        if (existing) {
          throw new DuplicateKeyError('mobile', normalizedMobile);
        }
        user.mobile = normalizedMobile;
      }

      if (fullName !== undefined) {
        user.fullName = fullName.trim();
      }

      if (password) {
        user.passwordHash = await bcrypt.hash(password, 10);
      }

      if (userType !== undefined) {
        user.userType = userType;
      }

      if (roleId !== undefined) {
        user.set('roleId', roleId ? new Types.ObjectId(roleId) : null);
      }

      if (branchId !== undefined) {
        user.set('branchId', branchId ? new Types.ObjectId(branchId) : null);
      }

      if (warehouseId !== undefined) {
        user.set('warehouseId', warehouseId ? new Types.ObjectId(warehouseId) : null);
      }

      if (hardwareFingerprint !== undefined) {
        user.hardwareFingerprint = hardwareFingerprint?.trim();
      }

      if (isActive !== undefined) {
        user.isActive = isActive;
        if (!isActive) {
          // Invalidate active refresh tokens on deactivation
          await TokenService.revokeUserSessions(user._id);
        }
      }

      await user.save();

      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'User updated successfully',
        data: {
          _id: user._id.toString(),
          fullName: user.fullName,
          email: user.email,
          mobile: user.mobile,
          userType: user.userType,
          roleId: user.roleId?.toString(),
          branchId: user.branchId?.toString(),
          warehouseId: user.warehouseId?.toString(),
          isActive: user.isActive,
          updatedAt: user.updatedAt,
        },
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

      if (!Types.ObjectId.isValid(id)) {
        throw new NotFoundError('User', id);
      }

      const user = await UserModel.findById(id);
      if (!user) {
        throw new NotFoundError('User', id);
      }

      user.isActive = false;
      await user.save();

      // Revoke all active sessions and refresh tokens for the user
      await TokenService.revokeUserSessions(user._id);

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
