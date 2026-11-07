import { Types } from 'mongoose';
import { Review, IReview } from '../models/Review';
import { ProductModel } from '../models/Product';
import { ValidationError, NotFoundError } from '../errors/AppError';

export interface SubmitReviewInput {
  productId: string;
  reviewerName: string;
  reviewerPhone: string;
  customerId?: string;
  orderId?: string;
  rating: number;
  title?: string;
  reviewText: string;
}

export class ReviewService {
  /**
   * Submit a new product review and automatically recalculate product rating
   */
  public static async submitReview(input: SubmitReviewInput): Promise<IReview> {
    const { productId, reviewerName, reviewerPhone, rating, reviewText, title, customerId, orderId } = input;

    if (!Types.ObjectId.isValid(productId)) {
      throw new ValidationError('Invalid product ID');
    }

    const product = await ProductModel.findById(productId);
    if (!product) {
      throw new NotFoundError(`Product with ID ${productId} not found`);
    }

    if (rating < 1 || rating > 5) {
      throw new ValidationError('Rating must be between 1 and 5 stars');
    }

    if (!reviewText || reviewText.trim().length === 0) {
      throw new ValidationError('Review text cannot be empty');
    }

    // Create review
    const review = await Review.create({
      productId: new Types.ObjectId(productId),
      productSku: product.sku,
      reviewerName: reviewerName.trim(),
      reviewerPhone: reviewerPhone.trim(),
      customerId: customerId && Types.ObjectId.isValid(customerId) ? new Types.ObjectId(customerId) : undefined,
      orderId: orderId?.trim(),
      rating: Math.round(rating),
      title: title?.trim(),
      reviewText: reviewText.trim(),
      isVerifiedBuyer: true,
      status: 'APPROVED', // Auto-approved by default for medical storefront
    });

    // Recalculate average rating & rating count using aggregation
    await this.recalculateProductRating(new Types.ObjectId(productId));

    return review;
  }

  /**
   * Recalculate average rating and total reviews for a given product
   */
  public static async recalculateProductRating(productObjId: Types.ObjectId): Promise<void> {
    const stats = await Review.aggregate([
      {
        $match: {
          productId: productObjId,
          status: 'APPROVED',
        },
      },
      {
        $group: {
          _id: '$productId',
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 },
        },
      },
    ]);

    if (stats.length > 0) {
      const avg = Math.round(stats[0].averageRating * 10) / 10;
      await ProductModel.findByIdAndUpdate(productObjId, {
        averageRating: avg,
        ratingCount: stats[0].totalReviews,
      });
    } else {
      await ProductModel.findByIdAndUpdate(productObjId, {
        averageRating: 5.0,
        ratingCount: 0,
      });
    }
  }

  /**
   * Get approved reviews for a specific product
   */
  public static async getProductReviews(
    productId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{ reviews: IReview[]; total: number; page: number; totalPages: number }> {
    if (!Types.ObjectId.isValid(productId)) {
      throw new ValidationError('Invalid product ID');
    }

    const query = {
      productId: new Types.ObjectId(productId),
      status: 'APPROVED',
    };

    const skip = (page - 1) * limit;
    const [reviews, total] = await Promise.all([
      Review.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Review.countDocuments(query),
    ]);

    return {
      reviews,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * Get all reviews for ERP admin moderation queue
   */
  public static async getModerationQueue(
    status?: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{ reviews: IReview[]; total: number; page: number }> {
    const query = status ? { status } : {};
    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      Review.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Review.countDocuments(query),
    ]);

    return { reviews, total, page };
  }

  /**
   * Update review status (approve, reject, flag)
   */
  public static async moderateReview(
    reviewId: string,
    status: 'APPROVED' | 'PENDING' | 'REJECTED'
  ): Promise<IReview> {
    if (!Types.ObjectId.isValid(reviewId)) {
      throw new ValidationError('Invalid review ID');
    }

    const review = await Review.findByIdAndUpdate(
      reviewId,
      { status },
      { new: true }
    );

    if (!review) {
      throw new NotFoundError('Review not found');
    }

    // Recalculate product rating
    await this.recalculateProductRating(review.productId);

    return review;
  }
}
