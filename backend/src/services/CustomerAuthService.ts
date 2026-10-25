import { UserModel, IUser } from '../models/User';
import { CustomerModel, ICustomer } from '../models/Customer';
import { OtpService } from './OtpService';
import { TokenService } from './TokenService';
import { normalizeMobileNumber } from '../integrations/smsGateway';
import { ValidationError } from '../errors/AppError';
import logger from '../config/logger';

export interface CustomerAuthPayload {
  mobile: string;
  otp: string;
  fullName?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface CustomerAuthResult {
  accessToken: string;
  refreshToken: string;
  user: {
    _id: string;
    fullName: string;
    mobile: string;
    userType: string;
    email: string;
  };
  customer: {
    _id: string;
    fullName: string;
    mobile: string;
    customerType: string;
    isGuest: boolean;
  };
}

/**
 * Customer Authentication & Registration Service for Public Storefront.
 * Orchestrates OTP validation, user identity persistence (userType: 'CUSTOMER'),
 * customer shadow record creation, and JWT token issuance.
 */
export class CustomerAuthService {
  /**
   * Verifies incoming OTP and signs in or registers the customer.
   *
   * @param payload Mobile number, 6-digit OTP, optional name, and client metadata
   * @returns Token pair, user profile, and customer record
   */
  public static async verifyAndAuthenticate(payload: CustomerAuthPayload): Promise<CustomerAuthResult> {
    const { mobile: rawMobile, otp, fullName, ipAddress, userAgent } = payload;
    const { local: mobile } = normalizeMobileNumber(rawMobile);

    // 1. Verify OTP against Redis single-use store
    const isOtpValid = await OtpService.verifyOtp(mobile, otp);
    if (!isOtpValid) {
      throw new ValidationError([
        {
          field: 'otp',
          issue: 'The verification code provided is invalid or has expired. Please request a new OTP.',
        },
      ]);
    }

    // 2. Find or create user record in users collection
    let user = await UserModel.findOne({ mobile });

    if (!user) {
      const assignedName = fullName?.trim() || `Customer-${mobile.slice(-4)}`;
      const fallbackEmail = `${mobile}@customer.sunbirdcorp.local`;

      user = await UserModel.create({
        fullName: assignedName,
        mobile,
        email: fallbackEmail,
        userType: 'CUSTOMER',
        isActive: true,
        lastLoginAt: new Date(),
      });

      logger.info(`New customer user account registered: ${user._id} (${mobile})`);
    } else {
      user.lastLoginAt = new Date();
      if (fullName && (!user.fullName || user.fullName.startsWith('Customer-'))) {
        user.fullName = fullName.trim();
      }
      await user.save();
    }

    // 3. Ensure synchronized shadow record in customers collection (isGuest: false)
    let customer = await CustomerModel.findOne({ mobile });

    if (!customer) {
      customer = await CustomerModel.create({
        fullName: user.fullName,
        mobile,
        email: user.email.endsWith('@customer.sunbirdcorp.local') ? undefined : user.email,
        customerType: 'RETAIL',
        isGuest: false,
        isActive: true,
        registeredVia: 'MOBILE',
      });
      logger.info(`Customer master shadow record created: ${customer._id} (isGuest: false)`);
    } else {
      let needsSave = false;
      if (customer.isGuest) {
        customer.isGuest = false;
        needsSave = true;
      }
      if (fullName && (!customer.fullName || customer.fullName.startsWith('Customer-'))) {
        customer.fullName = fullName.trim();
        needsSave = true;
      }
      if (needsSave) {
        await customer.save();
      }
    }

    // 4. Issue 15-minute Access Token and 7-day Rotating Refresh Token
    const accessToken = TokenService.generateAccessToken(user);
    const refreshToken = await TokenService.generateRefreshToken(user, ipAddress, userAgent);

    return {
      accessToken,
      refreshToken,
      user: {
        _id: user._id.toString(),
        fullName: user.fullName,
        mobile: user.mobile,
        userType: user.userType,
        email: user.email,
      },
      customer: {
        _id: customer._id.toString(),
        fullName: customer.fullName,
        mobile: customer.mobile,
        customerType: customer.customerType,
        isGuest: customer.isGuest,
      },
    };
  }
}

export default CustomerAuthService;
