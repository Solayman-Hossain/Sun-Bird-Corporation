import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { generateSecret, generateURI, verifySync } from 'otplib';
import env from '../config/env';
import logger from '../config/logger';
import { UserModel } from '../models/User';
import { RoleModel } from '../models/Role';
import { RefreshTokenModel } from '../models/RefreshToken';
import { OtpService } from '../services/OtpService';
import { CustomerAuthService } from '../services/CustomerAuthService';
import { TokenService } from '../services/TokenService';
import {
  UnauthorizedError,
  ForbiddenError,
  ValidationError,
  NotFoundError,
} from '../errors/AppError';

export const REFRESH_COOKIE_NAME = 'refreshToken';

export const getRefreshCookieOptions = () => ({
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/api/v1/auth',
});

export class AuthController {
  /**
   * @route   POST /api/v1/public/auth/send-otp
   * @desc    Dispatches 6-digit OTP to mobile via SMS gateway
   * @access  Public
   */
  public static async sendOtp(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { mobile, purpose } = req.body;
      const result = await OtpService.sendOtp(mobile, purpose);

      res.status(200).json({
        success: true,
        statusCode: 200,
        message: `OTP sent successfully to ${result.mobile}`,
        data: {
          mobile: result.mobile,
          expiresInSeconds: result.expiresInSeconds,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   POST /api/v1/public/auth/verify-otp
   * @desc    Verifies OTP, authenticates/creates customer, returns access token + refresh cookie
   * @access  Public
   */
  public static async verifyOtp(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { mobile, otp, fullName } = req.body;
      const ipAddress = req.ip || (req.headers['x-forwarded-for'] as string);
      const userAgent = req.headers['user-agent'];

      const result = await CustomerAuthService.verifyAndAuthenticate({
        mobile,
        otp,
        fullName,
        ipAddress,
        userAgent,
      });

      res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, getRefreshCookieOptions());

      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Authentication successful',
        data: {
          accessToken: result.accessToken,
          user: result.user,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   POST /api/v1/erp/auth/login
   * @desc    Authenticates ERP staff/directors with password + MFA/hardware checks
   * @access  Public (ERP Gateway)
   */
  public static async erpLogin(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { email, password, totpCode, hardwareFingerprint } = req.body;
      const ipAddress = req.ip || (req.headers['x-forwarded-for'] as string);
      const userAgent = req.headers['user-agent'];

      const normalizedIdentifier = email.toLowerCase().trim();

      // Look up user by email or mobile
      const user = await UserModel.findOne({
        $or: [{ email: normalizedIdentifier }, { mobile: email.trim() }],
      });

      if (!user) {
        throw new UnauthorizedError('Invalid credentials');
      }

      if (!user.isActive) {
        throw new UnauthorizedError(
          'User account has been deactivated. Please contact your administrator'
        );
      }

      // Customer accounts must use OTP storefront flow
      if (user.userType === 'CUSTOMER') {
        throw new UnauthorizedError(
          'Customer accounts must authenticate via OTP storefront login'
        );
      }

      // Validate bcrypt password
      if (!user.passwordHash) {
        throw new UnauthorizedError('Invalid credentials: no password configured for this user');
      }

      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
      if (!isPasswordValid) {
        throw new UnauthorizedError('Invalid credentials');
      }

      // Check MFA TOTP for Director or SuperAdmin
      const isDirectorOrAdmin =
        user.userType === 'DIRECTOR' || user.userType === 'SUPER_ADMIN';

      if (isDirectorOrAdmin && user.totpSecret) {
        const headerTotp =
          (req.headers['x-mfa-code'] as string) ||
          (req.headers['x-totp-code'] as string);
        const codeToVerify = totpCode || headerTotp;

        if (!codeToVerify) {
          res.status(200).json({
            success: false,
            statusCode: 200,
            message: 'MFA verification required',
            data: {
              mfaRequired: true,
              userId: user._id.toString(),
            },
          });
          return;
        }

        const totpResult = verifySync({
          token: String(codeToVerify).trim(),
          secret: user.totpSecret,
          epochTolerance: 30,
        });

        if (!totpResult || !totpResult.valid) {
          throw new UnauthorizedError('Invalid MFA verification code');
        }
      }

      // Check hardware device binding fingerprint for Directors
      if (user.userType === 'DIRECTOR' && user.hardwareFingerprint) {
        const clientFingerprint =
          (req.headers['x-device-fingerprint'] as string) ||
          hardwareFingerprint;

        if (!clientFingerprint || clientFingerprint !== user.hardwareFingerprint) {
          logger.warn(
            `Director login hardware fingerprint mismatch for user ${user._id}`,
            {
              userId: user._id,
              expected: user.hardwareFingerprint,
              received: clientFingerprint,
            }
          );
          throw new ForbiddenError('Unrecognized device for Director approval');
        }
      }

      // Issue JWT access token and rotating refresh token
      const accessToken = TokenService.generateAccessToken(user);
      const refreshToken = await TokenService.generateRefreshToken(
        user,
        ipAddress,
        userAgent
      );

      // Transmit refresh token via secure HttpOnly cookie
      res.cookie(REFRESH_COOKIE_NAME, refreshToken, getRefreshCookieOptions());

      // Update lastLoginAt
      user.lastLoginAt = new Date();
      await user.save();

      // Retrieve role information
      let roleInfo: { roleName: string; slug: string } | undefined = undefined;
      if (user.roleId) {
        const role = await RoleModel.findById(user.roleId).select('roleName slug').lean();
        if (role) {
          roleInfo = {
            roleName: role.roleName,
            slug: role.slug,
          };
        }
      }

      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'ERP Login successful',
        data: {
          accessToken,
          user: {
            _id: user._id.toString(),
            fullName: user.fullName,
            email: user.email,
            userType: user.userType,
            role: roleInfo,
            branchId: user.branchId?.toString(),
            warehouseId: user.warehouseId?.toString(),
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   POST /api/v1/auth/refresh-token or POST /api/v1/erp/auth/refresh-token
   * @desc    Rotates refresh token family, emits new access token & refresh cookie
   * @access  Public (Cookie / Token)
   */
  public static async refreshToken(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const rawToken =
        req.cookies?.[REFRESH_COOKIE_NAME] ||
        req.body?.refreshToken ||
        (req.headers['x-refresh-token'] as string);

      if (!rawToken) {
        throw new UnauthorizedError('Refresh token required in cookie or request body');
      }

      const ipAddress = req.ip || (req.headers['x-forwarded-for'] as string);
      const userAgent = req.headers['user-agent'];

      const newPair = await TokenService.rotateRefreshToken(
        rawToken,
        ipAddress,
        userAgent
      );

      // Re-set updated rotating refresh token cookie
      res.cookie(REFRESH_COOKIE_NAME, newPair.refreshToken, getRefreshCookieOptions());

      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Token refreshed successfully',
        data: {
          accessToken: newPair.accessToken,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   POST /api/v1/auth/logout or POST /api/v1/erp/auth/logout
   * @desc    Revokes refresh token session and clears HTTP-Only cookie
   * @access  Public / Authenticated
   */
  public static async logout(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const rawToken =
        req.cookies?.[REFRESH_COOKIE_NAME] ||
        req.body?.refreshToken ||
        (req.headers['x-refresh-token'] as string);

      if (rawToken) {
        const tokenHash = TokenService.hashToken(rawToken.trim());
        await RefreshTokenModel.updateOne(
          { tokenHash },
          { isRevoked: true, revokedAt: new Date() }
        );
      }

      // If user is authenticated via Bearer token, revoke user's sessions
      if (req.user?.userId) {
        await TokenService.revokeUserSessions(req.user.userId);
      }

      // Clear refresh token cookies
      res.clearCookie(REFRESH_COOKIE_NAME, getRefreshCookieOptions());
      res.clearCookie(REFRESH_COOKIE_NAME, { path: '/' });

      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Session terminated successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   POST /api/v1/erp/auth/setup-mfa
   * @desc    Generates TOTP secret and otpauth URI for authenticator app
   * @access  Authenticated (Staff / Director)
   */
  public static async setupMfa(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user?.userId || req.body?.userId;
      if (!userId) {
        throw new UnauthorizedError('Authentication required to set up MFA');
      }

      const user = await UserModel.findById(userId);
      if (!user) {
        throw new NotFoundError('User', userId);
      }

      const secret = generateSecret({ length: 20 });
      const otpAuthUrl = generateURI({
        issuer: 'Sun Bird Corporation',
        label: user.email,
        secret,
      });

      user.totpSecret = secret;
      await user.save();

      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'MFA setup initiated. Configure your authenticator application.',
        data: {
          secret,
          otpAuthUrl,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   POST /api/v1/erp/auth/verify-mfa
   * @desc    Verifies TOTP code against registered secret to confirm MFA setup
   * @access  Authenticated (Staff / Director)
   */
  public static async verifyMfa(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user?.userId || req.body?.userId;
      const { totpCode } = req.body;

      if (!userId) {
        throw new UnauthorizedError('Authentication required to verify MFA');
      }

      if (!totpCode) {
        throw new ValidationError('TOTP code is required');
      }

      const user = await UserModel.findById(userId);
      if (!user) {
        throw new NotFoundError('User', userId);
      }

      if (!user.totpSecret) {
        throw new ValidationError('MFA has not been initiated for this account');
      }

      const totpResult = verifySync({
        token: String(totpCode).trim(),
        secret: user.totpSecret,
        epochTolerance: 30,
      });

      if (!totpResult || !totpResult.valid) {
        throw new UnauthorizedError('Invalid MFA verification code');
      }

      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'MFA verified and enabled successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

export default AuthController;
