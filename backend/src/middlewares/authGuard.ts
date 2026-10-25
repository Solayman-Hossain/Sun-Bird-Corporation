import { Request, Response, NextFunction } from 'express';
import { TokenService } from '../services/TokenService';
import { UserModel } from '../models/User';
import { UnauthorizedError } from '../errors/AppError';
import logger from '../config/logger';

/**
 * JWT Authentication Guard Middleware.
 *
 * 1. Extracts Bearer JWT from the `Authorization` header.
 * 2. Verifies the token's HS256 signature and expiry via TokenService.
 * 3. Validates the user exists and is still active in the database.
 * 4. Attaches the authenticated user context to `req.user` for downstream
 *    RBAC and warehouse-scope guards.
 *
 * @throws UnauthorizedError (401) if token is missing, malformed, expired,
 *         or the associated user account is inactive/deleted.
 *
 * References:
 * - PRD §4 (User Types and Access)
 * - Database-Schema.md §1.1 (users)
 * - api-spec.md §1.2 (Dual-Token JWT)
 */
export const authGuard = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // ─── 1. Extract Bearer token from Authorization header ───
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError(
        'Missing or malformed Authorization header. Expected format: Bearer <token>'
      );
    }

    const token = authHeader.split(' ')[1];

    if (!token || token.trim().length === 0) {
      throw new UnauthorizedError(
        'Empty access token provided in Authorization header'
      );
    }

    // ─── 2. Verify JWT signature and expiry ───
    const decoded = TokenService.verifyAccessToken(token);

    if (!decoded.sub) {
      throw new UnauthorizedError(
        'Malformed access token: missing subject claim'
      );
    }

    // ─── 3. Validate user exists and is active ───
    const user = await UserModel.findById(decoded.sub)
      .select('_id userType roleId branchId warehouseId isActive')
      .lean();

    if (!user) {
      throw new UnauthorizedError(
        'User account associated with this token no longer exists'
      );
    }

    if (!user.isActive) {
      throw new UnauthorizedError(
        'User account has been deactivated. Please contact your administrator'
      );
    }

    // ─── 4. Attach authenticated user context to req.user ───
    req.user = {
      userId: user._id.toString(),
      userType: user.userType,
      roleId: user.roleId?.toString(),
      branchId: user.branchId?.toString(),
      warehouseId: user.warehouseId?.toString(),
      isActive: user.isActive,
    };

    next();
  } catch (error) {
    // Re-throw UnauthorizedError instances directly into the error handler
    if (error instanceof UnauthorizedError) {
      return next(error);
    }

    // Wrap unexpected errors with context for debugging
    logger.error('authGuard: Unexpected error during authentication', {
      error: error instanceof Error ? error.message : String(error),
      path: req.originalUrl,
      method: req.method,
    });

    next(
      new UnauthorizedError(
        'Authentication failed due to an internal error'
      )
    );
  }
};

export default authGuard;
