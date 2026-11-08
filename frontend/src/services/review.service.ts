import { apiClient, submitProductReview } from '../lib/api';
import { ReviewItem } from '../types';

export const reviewService = {
  async getByProductId(productId: string): Promise<ReviewItem[]> {
    try {
      const res = await apiClient<{ success: boolean; data: ReviewItem[] }>(`/reviews/product/${encodeURIComponent(productId)}`);
      return res?.success && res.data ? res.data : [];
    } catch {
      return [];
    }
  },

  async submit(payload: {
    productId: string;
    reviewerName: string;
    reviewerPhone: string;
    rating: number;
    title?: string;
    reviewText: string;
    orderId?: string;
  }): Promise<{ success: boolean; data?: any; error?: string }> {
    return await submitProductReview(payload);
  },
};

export default reviewService;
