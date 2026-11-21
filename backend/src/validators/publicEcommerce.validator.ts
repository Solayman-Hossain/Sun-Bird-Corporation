import { z } from 'zod';

export const addToCartSchema = z.object({
  cartId: z.string().min(1),
  sku: z.string().min(2),
  quantity: z.number().int().min(1).default(1),
  customerId: z.string().optional(),
});

export const updateCartItemSchema = z.object({
  cartId: z.string().min(1),
  sku: z.string().min(2),
  quantity: z.number().int().min(0),
});

export const applyCouponSchema = z.object({
  cartId: z.string().min(1),
  couponCode: z.string().min(2),
});

export const toggleWishlistSchema = z.object({
  sku: z.string().min(2),
  customerId: z.string().optional(),
  sessionId: z.string().optional(),
});

export const submitReviewSchema = z.object({
  productSku: z.string().min(2),
  reviewerName: z.string().min(2),
  reviewerPhone: z.string().min(10),
  rating: z.number().min(1).max(5),
  title: z.string().optional(),
  reviewText: z.string().min(3),
  customerId: z.string().optional(),
});

export const customerAiAssistantSchema = z.object({
  prompt: z.string().min(2),
  customerId: z.string().optional(),
});
