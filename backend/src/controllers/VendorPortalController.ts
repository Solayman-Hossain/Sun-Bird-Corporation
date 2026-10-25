import { Request, Response, NextFunction } from 'express';
import { SupplierService } from '../services/SupplierService';
import { RfqService } from '../services/RfqService';
import { UnauthorizedError } from '../errors/AppError';

export class VendorPortalController {
  /**
   * @route   GET /api/v1/portal/vendor/profile
   * @desc    Retrieves profile and performance metrics for the authenticated vendor
   * @access  Bearer JWT (userType: 'VENDOR' or permissions)
   */
  public static async getProfile(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new UnauthorizedError('Authentication required');
      }

      const supplier = await SupplierService.getSupplierByUserId(userId);

      res.status(200).json({
        success: true,
        statusCode: 200,
        data: supplier,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   GET /api/v1/portal/vendor/rfqs
   * @desc    Lists open RFQ tenders available/invited for the authenticated vendor
   * @access  Bearer JWT (Vendor Portal)
   */
  public static async listAvailableRfqs(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user?.userId;
      let supplierId: string | undefined;

      if (userId) {
        try {
          const supplier = await SupplierService.getSupplierByUserId(userId);
          supplierId = supplier._id.toString();
        } catch {
          // If not linked yet, will see open public RFQs
        }
      }

      const rfqs = await RfqService.listRfqs(supplierId);

      res.status(200).json({
        success: true,
        statusCode: 200,
        data: rfqs,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   POST /api/v1/portal/vendor/quotations
   * @desc    Submits a vendor bid quotation for an open RFQ tender
   * @access  Bearer JWT (Vendor Portal or procurement staff)
   */
  public static async submitQuotation(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const vendorUserId = req.user?.userId;
      const quotation = await RfqService.submitBidQuotation(req.body, vendorUserId);

      res.status(201).json({
        success: true,
        statusCode: 201,
        message: 'Bid quotation submitted successfully',
        data: quotation,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   GET /api/v1/portal/vendor/quotations
   * @desc    Lists quotations submitted by the authenticated vendor
   * @access  Bearer JWT (Vendor Portal)
   */
  public static async listMyQuotations(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new UnauthorizedError('Authentication required');
      }

      const supplier = await SupplierService.getSupplierByUserId(userId);

      const page = req.query.page ? parseInt(String(req.query.page), 10) : 1;
      const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 20;

      const result = await RfqService.listQuotations(
        { supplierId: supplier._id },
        { page, limit }
      );

      res.status(200).json({
        success: true,
        statusCode: 200,
        data: result.data,
        meta: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: result.totalPages,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}
