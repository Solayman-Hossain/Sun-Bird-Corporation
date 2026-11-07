import { Request, Response, NextFunction } from 'express';
import { DisputeService } from '../services/DisputeService';

export class DisputeController {
  /**
   * Submit an RMA / Warranty / Defective Claim (Public / Customer Portal)
   */
  public static async submitClaim(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        orderId,
        orderNumber,
        productSku,
        productName,
        customerName,
        customerPhone,
        customerEmail,
        claimType,
        description,
        evidenceUrls,
      } = req.body;

      const claim = await DisputeService.submitClaim({
        orderId,
        orderNumber,
        productSku,
        productName,
        customerName,
        customerPhone,
        customerEmail,
        claimType,
        description,
        evidenceUrls,
      });

      res.status(201).json({
        success: true,
        message: `Claim ${claim.claimNumber} registered successfully`,
        data: claim,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Lookup claims by customer phone or ticket (Public / Portal)
   */
  public static async lookupClaims(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const q = req.query.q as string;
      if (!q) {
        res.status(200).json({ success: true, data: [] });
        return;
      }

      const claims = await DisputeService.getCustomerClaims(q);
      res.status(200).json({
        success: true,
        data: claims,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get disputes & RMA queue for ERP Admin Moderation
   */
  public static async getClaimsQueue(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const status = req.query.status as string | undefined;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;

      const result = await DisputeService.getClaimsQueue(status, page, limit);

      res.status(200).json({
        success: true,
        data: result.claims,
        pagination: {
          total: result.total,
          page: result.page,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Resolve / Moderate a dispute claim (ERP Admin)
   */
  public static async resolveClaim(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = String(req.params.id);
      const { status, moderatorNotes, replacementOrderId } = req.body;
      const adminId = (req as any).user?.userId;

      const updated = await DisputeService.resolveClaim({
        claimId: id,
        status,
        moderatorNotes,
        adminId,
        replacementOrderId,
      });

      res.status(200).json({
        success: true,
        message: `Claim ${updated.claimNumber} updated to ${status}`,
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }
}
