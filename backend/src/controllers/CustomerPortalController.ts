import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { UserModel } from '../models/User';
import { CustomerModel } from '../models/Customer';
import { CustomerCreditProfileModel } from '../models/CustomerCreditProfile';
import { OrderModel } from '../models/Order';
import { AuditLogService } from '../services/AuditLogService';
import { VerificationLogService } from '../services/VerificationLogService';
import { UnauthorizedError, NotFoundError } from '../errors/AppError';

export class CustomerPortalController {
  /**
   * Helper: Resolves the authenticated customer and user records.
   */
  private static async resolveCustomerFromAuth(req: Request) {
    const userId = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedError('Authentication required');
    }

    const user = await UserModel.findById(userId);
    if (!user || !user.isActive) {
      throw new UnauthorizedError('User account not found or deactivated');
    }

    let customer = await CustomerModel.findOne({ mobile: user.mobile });
    if (!customer) {
      customer = await CustomerModel.create({
        fullName: user.fullName,
        mobile: user.mobile,
        email: user.email.endsWith('@customer.sunbirdcorp.local') ? undefined : user.email,
        customerType: 'RETAIL',
        isGuest: false,
        isActive: true,
        registeredVia: 'WEB',
      });
    }

    return { user, customer };
  }

  /**
   * @route   GET /api/v1/portal/customer/profile
   * @desc    Retrieves profile and account overview for the authenticated customer
   * @access  Bearer JWT (userType: 'CUSTOMER')
   */
  public static async getProfile(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { user, customer } = await CustomerPortalController.resolveCustomerFromAuth(req);

      // Fetch B2B credit profile if applicable
      const creditProfile = await CustomerCreditProfileModel.findOne({
        customerId: customer._id,
      }).lean();

      // Count customer orders
      const orderCount = await OrderModel.countDocuments({ customerId: customer._id });

      res.status(200).json({
        success: true,
        statusCode: 200,
        data: {
          user: {
            _id: user._id,
            fullName: user.fullName,
            mobile: user.mobile,
            email: user.email,
            userType: user.userType,
            lastLoginAt: user.lastLoginAt,
          },
          customer: {
            _id: customer._id,
            fullName: customer.fullName,
            mobile: customer.mobile,
            email: customer.email,
            customerType: customer.customerType,
            billingAddress: customer.billingAddress,
            shippingAddress: customer.shippingAddress,
            companyName: customer.companyName,
            buyerBin: customer.buyerBin,
            isGuest: customer.isGuest,
            createdAt: customer.createdAt,
          },
          creditProfile: creditProfile
            ? {
                creditLimitBDT: creditProfile.creditLimitBDT,
                creditTermDays: creditProfile.creditTermDays,
                currentOutstandingAR: creditProfile.currentOutstandingAR,
                unbilledDispatches: creditProfile.unbilledDispatches,
                isCreditLocked: creditProfile.isCreditLocked,
                lockReason: creditProfile.lockReason,
              }
            : null,
          stats: {
            totalOrders: orderCount,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   PUT /api/v1/portal/customer/profile
   * @desc    Updates customer personal details and shipping/billing addresses
   * @access  Bearer JWT (userType: 'CUSTOMER')
   */
  public static async updateProfile(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { user, customer } = await CustomerPortalController.resolveCustomerFromAuth(req);
      const { fullName, email, billingAddress, shippingAddress, companyName, buyerBin } = req.body;

      const beforeSnapshot = {
        fullName: customer.fullName,
        email: customer.email,
        billingAddress: customer.billingAddress,
        shippingAddress: customer.shippingAddress,
        companyName: customer.companyName,
        buyerBin: customer.buyerBin,
      };

      if (fullName) {
        customer.fullName = fullName.trim();
        user.fullName = fullName.trim();
      }
      if (email) {
        customer.email = email.trim().toLowerCase();
        user.email = email.trim().toLowerCase();
      }
      if (billingAddress !== undefined) {
        customer.billingAddress = billingAddress.trim();
      }
      if (shippingAddress !== undefined) {
        customer.shippingAddress = shippingAddress.trim();
      }
      if (companyName !== undefined) {
        customer.companyName = companyName.trim();
      }
      if (buyerBin !== undefined) {
        customer.buyerBin = buyerBin.trim();
      }

      await Promise.all([customer.save(), user.save()]);

      // Record update action in tamper-proof audit trail
      const ipAddress = req.ip || (req.headers['x-forwarded-for'] as string);
      const userAgent = req.headers['user-agent'];

      await AuditLogService.logAction({
        actorId: user._id,
        actorRole: 'CUSTOMER',
        action: 'CUSTOMER_PROFILE_UPDATED',
        targetCollection: 'customers',
        targetId: customer._id,
        beforeSnapshot,
        afterSnapshot: {
          fullName: customer.fullName,
          email: customer.email,
          billingAddress: customer.billingAddress,
          shippingAddress: customer.shippingAddress,
          companyName: customer.companyName,
          buyerBin: customer.buyerBin,
        },
        ipAddress,
        userAgent,
        notes: `Customer updated profile information for mobile ${customer.mobile}`,
      });

      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Customer profile updated successfully',
        data: {
          user: {
            _id: user._id,
            fullName: user.fullName,
            email: user.email,
            mobile: user.mobile,
          },
          customer: {
            _id: customer._id,
            fullName: customer.fullName,
            email: customer.email,
            mobile: customer.mobile,
            billingAddress: customer.billingAddress,
            shippingAddress: customer.shippingAddress,
            companyName: customer.companyName,
            buyerBin: customer.buyerBin,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   GET /api/v1/portal/customer/orders
   * @desc    Lists order history for the authenticated customer
   * @access  Bearer JWT (userType: 'CUSTOMER')
   */
  public static async getOrders(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { customer } = await CustomerPortalController.resolveCustomerFromAuth(req);

      const page = Math.max(1, Number(req.query.page) || 1);
      const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));
      const skip = (page - 1) * limit;

      const [orders, total] = await Promise.all([
        OrderModel.find({ customerId: customer._id })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        OrderModel.countDocuments({ customerId: customer._id }),
      ]);

      res.status(200).json({
        success: true,
        statusCode: 200,
        data: orders,
        pagination: {
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
   * @route   GET /api/v1/portal/customer/verification-logs
   * @desc    Lists chronological verification/login security events for customer
   * @access  Bearer JWT (userType: 'CUSTOMER')
   */
  public static async getVerificationLogs(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { customer } = await CustomerPortalController.resolveCustomerFromAuth(req);
      const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));

      const logs = await VerificationLogService.getCustomerVerificationHistory(customer._id, limit);

      res.status(200).json({
        success: true,
        statusCode: 200,
        data: logs,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default CustomerPortalController;
