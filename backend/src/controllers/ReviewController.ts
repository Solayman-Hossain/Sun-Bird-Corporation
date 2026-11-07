import { Request, Response, NextFunction } from 'express';
import { ReviewService } from '../services/ReviewService';

export class ReviewController {
  /**
   * Submit a new product review (Public)
   */
  public static async submitReview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { productId, reviewerName, reviewerPhone, rating, reviewText, title, customerId, orderId } = req.body;
      const review = await ReviewService.submitReview({
        productId,
        reviewerName,
        reviewerPhone,
        rating: Number(rating),
        reviewText,
        title,
        customerId,
        orderId,
      });

      res.status(201).json({
        success: true,
        message: 'Review submitted successfully',
        data: review,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get reviews for a product (Public)
   */
  public static async getProductReviews(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const productId = String(req.params.productId);
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;

      const result = await ReviewService.getProductReviews(productId, page, limit);

      res.status(200).json({
        success: true,
        data: result.reviews,
        pagination: {
          total: result.total,
          page: result.page,
          totalPages: result.totalPages,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get moderation queue of reviews (ERP Admin)
   */
  public static async getModerationQueue(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const status = req.query.status as string | undefined;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;

      const result = await ReviewService.getModerationQueue(status, page, limit);

      res.status(200).json({
        success: true,
        data: result.reviews,
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
   * Moderate review status (ERP Admin)
   */
  public static async moderateReview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = String(req.params.id);
      const { status } = req.body;

      const updated = await ReviewService.moderateReview(id, status);

      res.status(200).json({
        success: true,
        message: `Review status updated to ${status}`,
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }
}
