import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { PosCheckoutService, PosCheckoutDTO } from '../services/PosCheckoutService';
import { UnauthorizedError, ValidationError } from '../errors/AppError';
import logger from '../config/logger';

export class PosController {
  /**
   * @route   POST /api/v1/erp/pos/checkout
   * @desc    Executes atomic POS showroom checkout (stock deduction, challan, invoice & double-entry journal)
   * @access  Bearer JWT (pos:CHECKOUT or pos:CREATE)
   */
  public static async checkout(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const cashierUserId =
        (req as any).user?.id || (req as any).user?._id || (req as any).user?.userId;
      if (!cashierUserId) {
        throw new UnauthorizedError('Cashier authentication required for POS checkout');
      }

      const checkoutDTO: PosCheckoutDTO = req.body;

      const result = await PosCheckoutService.processPosCheckout(
        checkoutDTO,
        cashierUserId
      );

      res.status(201).json({
        success: true,
        statusCode: 201,
        message: 'POS showroom transaction completed successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   POST /api/v1/erp/pos/sync-offline-batch
   * @desc    Synchronizes cached offline POS billing transactions queued during network disconnection
   * @access  Bearer JWT (pos:CHECKOUT or pos:CREATE)
   */
  public static async syncOfflineBatch(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const cashierUserId =
        (req as any).user?.id || (req as any).user?._id || (req as any).user?.userId;
      if (!cashierUserId) {
        throw new UnauthorizedError('Cashier authentication required for offline sync');
      }

      const { transactions } = req.body;
      if (!Array.isArray(transactions) || transactions.length === 0) {
        throw new ValidationError('At least one transaction is required for offline sync');
      }

      const results = [];
      const errors = [];

      for (let i = 0; i < transactions.length; i++) {
        const tx = transactions[i];
        try {
          const resTx = await PosCheckoutService.processPosCheckout(tx, cashierUserId);
          results.push(resTx);
        } catch (err: any) {
          logger.error(`[PosController] Failed offline tx #${i}: ${err.message}`);
          errors.push({
            index: i,
            error: err.message,
            statusCode: err.statusCode || 500,
          });
        }
      }

      res.status(errors.length > 0 ? 207 : 200).json({
        success: errors.length === 0,
        statusCode: errors.length > 0 ? 207 : 200,
        message: `Offline POS sync completed: ${results.length} succeeded, ${errors.length} failed`,
        data: {
          syncedCount: results.length,
          failedCount: errors.length,
          transactions: results,
          errors,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}
export default PosController;
