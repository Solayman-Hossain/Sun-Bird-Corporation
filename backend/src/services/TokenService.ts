import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';
import env from '../config/env';
import logger from '../config/logger';
import { IUser, UserModel } from '../models/User';
import { IRefreshToken, RefreshTokenModel } from '../models/RefreshToken';
import { UnauthorizedError } from '../errors/AppError';

export interface AccessTokenPayload {
  sub: string;
  userType: string;
  roleId?: string;
  branchId?: string;
  [key: string]: any;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

/**
 * Enterprise Token Management Service.
 * Implements cryptographic JWT access tokens (15m validity) and SHA-256 hashed
 * rotating refresh token families (7-day validity) with automated breach reuse detection.
 * Aligns with api-spec.md §1.2 & §2.4 and Database-Schema.md §1.3.
 */
export class TokenService {
  /**
   * Generates a SHA-256 hash of a raw token string for secure storage.
   */
  public static hashToken(rawToken: string): string {
    return crypto.createHash('sha256').update(rawToken).digest('hex');
  }

  /**
   * Generates a short-lived (15-minute) signed JWT Access Token.
   *
   * @param user User document or object containing identity attributes
   * @returns Signed JWT string
   */
  public static generateAccessToken(user: IUser | Partial<IUser>): string {
    const userId = user._id ? user._id.toString() : (user as any).id?.toString();
    const roleId = user.roleId ? user.roleId.toString() : undefined;
    const branchId = user.branchId ? user.branchId.toString() : undefined;

    const payload: AccessTokenPayload = {
      sub: userId,
      userType: user.userType || 'CUSTOMER',
      ...(roleId && { roleId }),
      ...(branchId && { branchId }),
    };

    return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
      expiresIn: '15m',
      algorithm: 'HS256',
    });
  }

  /**
   * Generates a cryptographically random 64-byte hex Refresh Token,
   * stores its SHA-256 hash in MongoDB with a 7-day TTL, and returns the raw token string.
   *
   * @param user Target user
   * @param ipAddress Client IP address
   * @param userAgent Client User-Agent string
   * @returns Raw 64-byte hex token string
   */
  public static async generateRefreshToken(
    user: IUser | Partial<IUser>,
    ipAddress?: string,
    userAgent?: string
  ): Promise<string> {
    const rawToken = crypto.randomBytes(64).toString('hex');
    const tokenHash = this.hashToken(rawToken);
    const userId = (user._id || (user as any).id) as Types.ObjectId;
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await RefreshTokenModel.create({
      userId,
      tokenHash,
      expiresAt,
      isRevoked: false,
      ipAddress,
      userAgent,
    });

    return rawToken;
  }

  /**
   * Rotates a refresh token family:
   * 1. Hashes incoming raw token and finds it in refresh_tokens collection.
   * 2. REUSE DETECTION: If token is already revoked (isRevoked === true),
   *    flags a security breach, immediately revokes ALL tokens for that userId,
   *    and throws UnauthorizedError('Token family breach detected').
   * 3. Validates expiration: If expired, throws UnauthorizedError.
   * 4. Otherwise, marks current token revoked, creates new refresh token,
   *    links replacedByToken, and issues a new access token & refresh token pair.
   *
   * @param rawToken Incoming raw 64-byte refresh token
   * @param ipAddress Client IP address
   * @param userAgent Client User-Agent header
   * @returns New TokenPair { accessToken, refreshToken }
   */
  public static async rotateRefreshToken(
    rawToken: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<TokenPair> {
    if (!rawToken || typeof rawToken !== 'string') {
      throw new UnauthorizedError('Refresh token required');
    }

    const tokenHash = this.hashToken(rawToken.trim());
    const existingToken = await RefreshTokenModel.findOne({ tokenHash });

    if (!existingToken) {
      throw new UnauthorizedError('Invalid refresh token');
    }

    // === CRITICAL SECURITY: Token Reuse Detection ===
    if (existingToken.isRevoked) {
      logger.error('CRITICAL: Refresh token reuse detected! Suspected token hijacking.', {
        userId: existingToken.userId,
        compromisedTokenHash: tokenHash,
        ipAddress,
        userAgent,
      });

      // Revoke ALL active sessions for this compromised user account
      await RefreshTokenModel.updateMany(
        { userId: existingToken.userId },
        { isRevoked: true, revokedAt: new Date() }
      );

      throw new UnauthorizedError('Token family breach detected: All active sessions revoked for security');
    }

    // Check expiration
    if (existingToken.expiresAt.getTime() <= Date.now()) {
      existingToken.isRevoked = true;
      existingToken.revokedAt = new Date();
      await existingToken.save();
      throw new UnauthorizedError('Refresh token expired');
    }

    // Retrieve user details
    const user = await UserModel.findById(existingToken.userId);
    if (!user || !user.isActive) {
      throw new UnauthorizedError('Associated user account is inactive or not found');
    }

    // Generate new raw refresh token and hash
    const newRawRefreshToken = crypto.randomBytes(64).toString('hex');
    const newTokenHash = this.hashToken(newRawRefreshToken);
    const newExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // Link and revoke current token
    existingToken.isRevoked = true;
    existingToken.revokedAt = new Date();
    existingToken.replacedByToken = newTokenHash;
    await existingToken.save();

    // Persist new refresh token in collection
    await RefreshTokenModel.create({
      userId: existingToken.userId,
      tokenHash: newTokenHash,
      expiresAt: newExpiresAt,
      isRevoked: false,
      ipAddress,
      userAgent,
    });

    // Generate new 15m Access Token
    const accessToken = this.generateAccessToken(user);

    return {
      accessToken,
      refreshToken: newRawRefreshToken,
    };
  }

  /**
   * Revokes all active sessions and refresh tokens for a user (e.g. on password reset or global logout).
   *
   * @param userId User's ObjectId or string ID
   */
  public static async revokeUserSessions(userId: string | Types.ObjectId): Promise<number> {
    const result = await RefreshTokenModel.updateMany(
      { userId, isRevoked: false },
      { isRevoked: true, revokedAt: new Date() }
    );
    return result.modifiedCount;
  }

  /**
   * Verifies a JWT access token's signature and expiration.
   */
  public static verifyAccessToken(token: string): AccessTokenPayload {
    try {
      return jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Invalid access token';
      throw new UnauthorizedError(`Access token verification failed: ${message}`);
    }
  }
}

export default TokenService;
