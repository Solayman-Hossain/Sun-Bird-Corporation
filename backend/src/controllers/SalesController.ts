import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { CartCheckoutService, CheckoutDTO } from '../services/CartCheckoutService';
import { CustomerCreditService } from '../services/CustomerCreditService';
import { DocumentService } from '../services/DocumentService';
import { CustomerCreditProfileModel } from '../models/CustomerCreditProfile';
import { OrderModel } from '../models/Order';
import { DeliveryChallanModel } from '../models/DeliveryChallan';
import { SalesInvoiceModel } from '../models/SalesInvoice';
import { NotFoundError, ValidationError, UnauthorizedError } from '../errors/AppError';
import logger from '../config/logger';

export class SalesController {
  /**
   * @route   POST /api/v1/public/checkout
   * @desc    Public storefront e-commerce checkout with Redis stock locking & COD/SSLCOMMERZ branching
   * @access  Public / Customer Auth
   */
  public static async publicCheckout(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const idempotencyKey = req.header('X-Idempotency-Key') || undefined;
      const checkoutDTO: CheckoutDTO = req.body;

      // Execute cart checkout service with stock validation & reservation
      const result = await CartCheckoutService.createOrderWithStockLock(checkoutDTO, idempotencyKey);

      res.status(201).json({
        success: true,
        statusCode: 201,
        message: 'Order initiated successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   GET /api/v1/erp/sales/credit-profiles/:customerId
   * @desc    Retrieves B2B customer real-time credit exposure, outstanding AR, and hard-limit gate status
   * @access  Bearer JWT (sales:READ)
   */
  public static async getCreditProfile(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const customerId = String(req.params.customerId);
      if (!Types.ObjectId.isValid(customerId)) {
        throw new ValidationError('Invalid Customer ObjectId format');
      }

      const newOrderAmount = req.query.newOrderAmount
        ? parseFloat(String(req.query.newOrderAmount))
        : 0;

      const exposure = await CustomerCreditService.getExposureDetails(
        customerId,
        isNaN(newOrderAmount) ? 0 : newOrderAmount
      );

      res.status(200).json({
        success: true,
        statusCode: 200,
        data: exposure,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   PUT /api/v1/erp/sales/credit-profiles/:customerId
   * @desc    Updates or creates credit profile terms (limit BDT, credit days, lock status)
   * @access  Bearer JWT (sales:UPDATE)
   */
  public static async updateCreditProfile(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const customerId = String(req.params.customerId);
      if (!Types.ObjectId.isValid(customerId)) {
        throw new ValidationError('Invalid Customer ObjectId format');
      }

      const { creditLimitBDT, creditTermDays, isCreditLocked } = req.body;
      const custId = new Types.ObjectId(customerId);

      let profile = await CustomerCreditProfileModel.findOne({ customerId: custId });
      if (!profile) {
        profile = new CustomerCreditProfileModel({
          customerId: custId,
          creditLimitBDT: creditLimitBDT ?? 0,
          creditTermDays: creditTermDays ?? 30,
          isCreditLocked: isCreditLocked ?? false,
          currentOutstandingAR: 0,
          unbilledDispatches: 0,
        });
      } else {
        if (creditLimitBDT !== undefined) profile.creditLimitBDT = creditLimitBDT;
        if (creditTermDays !== undefined) profile.creditTermDays = creditTermDays;
        if (isCreditLocked !== undefined) profile.isCreditLocked = isCreditLocked;
      }

      await profile.save();

      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Credit profile updated successfully',
        data: profile,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   POST /api/v1/erp/sales/credit-profiles/:customerId/override
   * @desc    Authorizes temporary Director override for a credit-locked customer
   * @access  Bearer JWT (DIRECTOR or SUPER_ADMIN role with MFA TOTP)
   */
  public static async overrideCreditLock(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const customerId = String(req.params.customerId);
      if (!Types.ObjectId.isValid(customerId)) {
        throw new ValidationError('Invalid Customer ObjectId format');
      }

      const directorId =
        (req as any).user?.userId || (req as any).user?.id || (req as any).user?._id;
      if (!directorId) {
        throw new UnauthorizedError('Director authentication required for credit override');
      }

      const { reason, totpCode } = req.body;
      const mfaCode =
        totpCode || req.header('X-TOTP-Code') || req.header('X-MFA-Code') || undefined;

      const profile = await CustomerCreditService.directorOverrideCreditLock(
        customerId,
        directorId,
        reason,
        undefined,
        mfaCode
      );

      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Director credit lock override authorized successfully',
        data: profile,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   POST /api/v1/erp/sales/challans
   * @desc    Generates NBR Mushak-6.3 delivery challan with sequential gapless number and bilingual PDF
   * @access  Bearer JWT (sales:CREATE or sales:DISPATCH)
   */
  public static async createChallan(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const preparedBy =
        (req as any).user?.userId || (req as any).user?.id || (req as any).user?._id || new Types.ObjectId().toString();

      const { challan, compliance } = await DocumentService.generateChallan({
        ...req.body,
        preparedBy,
      });

      res.status(201).json({
        success: true,
        statusCode: 201,
        message: 'Mushak-6.3 delivery challan generated successfully',
        data: {
          challanNo: challan.challanNo,
          orderId: challan.orderId,
          mushakForm: 'Mushak-6.3',
          vehicleNo: challan.vehicleNumber,
          dispatchTime: challan.dispatchTime,
          status: challan.status,
          pdfS3Url: challan.pdfS3Url,
          challan,
          compliance,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   GET /api/v1/erp/sales/challans/:id
   * @desc    Retrieves a delivery challan record by ID
   * @access  Bearer JWT (sales:READ)
   */
  public static async getChallanById(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = String(req.params.id);
      const challan = await DeliveryChallanModel.findById(id)
        .populate('orderId', 'orderNo orderStatus grandTotal')
        .populate('customerId', 'fullName mobile companyName buyerBin')
        .lean();

      if (!challan) {
        throw new NotFoundError('DeliveryChallan', id);
      }

      res.status(200).json({
        success: true,
        statusCode: 200,
        data: challan,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   GET /api/v1/erp/sales/challans/:id/print-mushak63
   * @desc    Retrieves printable Mushak-6.3 compliance data and PDF URL
   * @access  Bearer JWT (sales:READ)
   */
  public static async printMushak63Challan(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = String(req.params.id);
      const challan = await DeliveryChallanModel.findById(id)
        .populate('customerId', 'fullName mobile companyName buyerBin shippingAddress')
        .populate('orderId', 'orderNo')
        .lean();

      if (!challan) {
        throw new NotFoundError('DeliveryChallan', id);
      }

      res.status(200).json({
        success: true,
        statusCode: 200,
        data: {
          challanNo: challan.challanNo,
          mushakForm: 'Mushak-6.3',
          pdfUrl: challan.pdfS3Url,
          dispatchTime: challan.dispatchTime,
          vehicleNumber: challan.vehicleNumber,
          items: challan.items,
          challan,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   POST /api/v1/erp/sales/invoices
   * @desc    Generates statutory sales invoice with sequential gapless INV-YYYY-XXXXX format
   * @access  Bearer JWT (sales:CREATE)
   */
  public static async createInvoice(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const preparedBy =
        (req as any).user?.userId || (req as any).user?.id || (req as any).user?._id || new Types.ObjectId().toString();

      const { invoice, compliance } = await DocumentService.generateInvoice({
        ...req.body,
        preparedBy,
      });

      res.status(201).json({
        success: true,
        statusCode: 201,
        message: 'Sales invoice generated successfully',
        data: {
          invoiceNo: invoice.invoiceNo,
          orderId: invoice.orderId,
          grandTotal: invoice.grandTotal,
          dueDate: invoice.dueDate,
          pdfS3Url: compliance.pdfS3Url,
          invoice,
          compliance,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   GET /api/v1/erp/sales/invoices/:id
   * @desc    Retrieves a sales invoice by ID
   * @access  Bearer JWT (sales:READ)
   */
  public static async getInvoiceById(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = String(req.params.id);
      const invoice = await SalesInvoiceModel.findById(id)
        .populate('orderId', 'orderNo orderStatus')
        .populate('customerId', 'fullName mobile companyName')
        .lean();

      if (!invoice) {
        throw new NotFoundError('SalesInvoice', id);
      }

      res.status(200).json({
        success: true,
        statusCode: 200,
        data: invoice,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   GET /api/v1/erp/sales/orders
   * @desc    Lists sales orders with status/channel filters and pagination
   * @access  Bearer JWT (sales:READ)
   */
  public static async listOrders(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { orderStatus, orderChannel, paymentStatus, customerId } = req.query;
      const filter: Record<string, any> = {};

      if (orderStatus) filter.orderStatus = String(orderStatus);
      if (orderChannel) filter.orderChannel = String(orderChannel);
      if (paymentStatus) filter.paymentStatus = String(paymentStatus);
      if (customerId && Types.ObjectId.isValid(String(customerId))) {
        filter.customerId = new Types.ObjectId(String(customerId));
      }

      const page = Math.max(1, parseInt(String(req.query.page), 10) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit), 10) || 20));
      const skip = (page - 1) * limit;

      const [orders, total] = await Promise.all([
        OrderModel.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .populate('customerId', 'fullName mobile customerType')
          .lean(),
        OrderModel.countDocuments(filter),
      ]);

      res.status(200).json({
        success: true,
        statusCode: 200,
        data: orders,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   GET /api/v1/erp/sales/orders/:id
   * @desc    Retrieves order details by ID
   * @access  Bearer JWT (sales:READ)
   */
  public static async getOrderById(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = String(req.params.id);
      const order = await OrderModel.findById(id)
        .populate('customerId', 'fullName mobile email customerType shippingAddress billingAddress')
        .populate('salesRepId', 'fullName email')
        .lean();

      if (!order) {
        throw new NotFoundError('Order', id);
      }

      res.status(200).json({
        success: true,
        statusCode: 200,
        data: order,
      });
    } catch (error) {
      next(error);
    }
  }
}
export default SalesController;
