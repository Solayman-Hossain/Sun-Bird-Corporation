import crypto from 'crypto';
import { get, set, del, ttl } from '../config/redis';
import { SmsGateway, normalizeMobileNumber } from '../integrations/smsGateway';
import { RateLimitExceededError } from '../errors/AppError';
import logger from '../config/logger';

export interface SendOtpResult {
  mobile: string;
  expiresInSeconds: number;
}

/**
 * Enterprise OTP Service for Customer Mobile Verification.
 * - Cryptographically random 6-digit numeric OTP generation.
 * - Redis storage with 180-second TTL (3 minutes).
 * - Hourly rate limiting (max 3 OTP dispatches per mobile per hour).
 * - Multi-provider SMS dispatch via BulkSMSBD with Greenweb fallback.
 */
export class OtpService {
  public static readonly OTP_TTL_SECONDS = 180; // 3 minutes
  public static readonly RATE_LIMIT_MAX_ATTEMPTS = 3;
  public static readonly RATE_LIMIT_WINDOW_SECONDS = 3600; // 1 hour

  /**
   * Generates a cryptographically secure 6-digit numeric OTP code (100000 - 999999).
   */
  public static generateSecureCode(): string {
    return crypto.randomInt(100000, 1000000).toString();
  }

  /**
   * Dispatches an OTP to the given mobile number.
   * Enforces 3 attempts / hour rate limiting and persists code to Redis with 180s TTL.
   *
   * @param rawMobile Bangladeshi mobile number
   * @param purpose Reason for OTP (e.g. 'LOGIN', 'CHECKOUT')
   * @returns Metadata including mobile and remaining TTL
   */
  public static async sendOtp(rawMobile: string, purpose: string = 'LOGIN'): Promise<SendOtpResult> {
    const { local: mobile } = normalizeMobileNumber(rawMobile);
    const rateKey = `otp_rate:${mobile}`;
    const otpKey = `otp:${mobile}`;

    // 1. Rate Limiting Check: Max 3 requests per mobile per hour
    const currentRateCount = await get<number>(rateKey);
    if (typeof currentRateCount === 'number' && currentRateCount >= this.RATE_LIMIT_MAX_ATTEMPTS) {
      const remainingSeconds = await ttl(rateKey);
      const retryAfter = remainingSeconds > 0 ? remainingSeconds : this.RATE_LIMIT_WINDOW_SECONDS;
      logger.warn(`OTP rate limit exceeded for mobile: ${mobile} (Attempts: ${currentRateCount})`);
      throw new RateLimitExceededError(
        retryAfter,
        `Maximum ${this.RATE_LIMIT_MAX_ATTEMPTS} OTP requests per hour exceeded for mobile ${mobile}. Please try again later.`
      );
    }

    // 2. Generate secure 6-digit OTP
    const otp = this.generateSecureCode();

    // 3. Persist OTP in Redis with 180s TTL
    await set(otpKey, otp, this.OTP_TTL_SECONDS);

    // 4. Update rate limit counter in Redis
    const newRateCount = (typeof currentRateCount === 'number' ? currentRateCount : 0) + 1;
    const existingRateTtl = await ttl(rateKey);
    const rateTtlToApply = existingRateTtl > 0 ? existingRateTtl : this.RATE_LIMIT_WINDOW_SECONDS;
    await set(rateKey, newRateCount, rateTtlToApply);

    // 5. Dispatch SMS via SMS Gateway
    const smsMessage = `Your Sun Bird Corporation verification code is ${otp}. Valid for 3 minutes. Do not share this code.`;
    await SmsGateway.sendSms({
      mobile,
      message: smsMessage,
    });

    logger.info(`OTP successfully generated and dispatched to ${mobile} (Purpose: ${purpose})`);

    return {
      mobile,
      expiresInSeconds: this.OTP_TTL_SECONDS,
    };
  }

  /**
   * Verifies an OTP code against Redis.
   * On successful match, immediately deletes the key to prevent replay attacks and returns true.
   *
   * @param rawMobile Bangladeshi mobile number
   * @param incomingOtp 6-digit OTP code to verify
   * @returns true if valid match, false otherwise
   */
  public static async verifyOtp(rawMobile: string, incomingOtp: string): Promise<boolean> {
    if (!incomingOtp || typeof incomingOtp !== 'string' || incomingOtp.trim().length !== 6) {
      return false;
    }

    const { local: mobile } = normalizeMobileNumber(rawMobile);
    const otpKey = `otp:${mobile}`;

    const storedOtp = await get<string | number>(otpKey);

    if (!storedOtp) {
      logger.warn(`OTP verification failed: No active OTP found for mobile ${mobile}`);
      return false;
    }

    if (String(storedOtp).trim() !== incomingOtp.trim()) {
      logger.warn(`OTP verification mismatch for mobile ${mobile}`);
      return false;
    }

    // Single-use guarantee: Delete key immediately upon successful verification
    await del(otpKey);
    logger.info(`OTP verified successfully for mobile ${mobile}`);
    return true;
  }
}

export default OtpService;
