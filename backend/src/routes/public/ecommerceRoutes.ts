import { Router } from 'express';
import { PublicEcommerceController } from '../../controllers/PublicEcommerceController';
import { validateRequest } from '../../middlewares/validateRequest';
import {
  addToCartSchema,
  updateCartItemSchema,
  applyCouponSchema,
  toggleWishlistSchema,
  submitReviewSchema,
  customerAiAssistantSchema,
} from '../../validators/publicEcommerce.validator';

const router = Router();

/**
 * 1. Categories & Brands
 */
router.get('/categories', PublicEcommerceController.getCategories);
router.get('/brands', PublicEcommerceController.getBrands);

/**
 * 2. Coupon Validation
 */
router.post('/coupons/validate', PublicEcommerceController.validateCoupon);

/**
 * 3. Server-side Cart Management
 */
router.get('/cart/:cartId', PublicEcommerceController.getCart);
router.post('/cart/items', validateRequest({ body: addToCartSchema }), PublicEcommerceController.addToCart);
router.put('/cart/items', validateRequest({ body: updateCartItemSchema }), PublicEcommerceController.updateCartItem);
router.post('/cart/coupon', validateRequest({ body: applyCouponSchema }), PublicEcommerceController.applyCoupon);

/**
 * 4. Wishlist
 */
router.get('/wishlist', PublicEcommerceController.getWishlist);
router.post('/wishlist/toggle', validateRequest({ body: toggleWishlistSchema }), PublicEcommerceController.toggleWishlist);

/**
 * 5. Customer Orders
 */
router.get('/customer/:mobileOrId/orders', PublicEcommerceController.getCustomerOrders);

/**
 * 6. Customer-facing AI Copilot
 */
router.post('/ai/assistant', validateRequest({ body: customerAiAssistantSchema }), PublicEcommerceController.customerAiAssistant);

/**
 * 7. Reviews
 */
router.post('/reviews', validateRequest({ body: submitReviewSchema }), PublicEcommerceController.submitReview);
router.get('/reviews/:sku', PublicEcommerceController.getProductReviews);

export default router;
