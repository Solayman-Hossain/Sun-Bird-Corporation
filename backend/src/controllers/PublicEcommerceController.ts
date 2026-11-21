import { Request, Response } from 'express';
import { PublicEcommerceService } from '../services/PublicEcommerceService';
import logger from '../config/logger';

export class PublicEcommerceController {
  public static async getCategories(_req: Request, res: Response) {
    try {
      const data = await PublicEcommerceService.getPublicCategories();
      res.json({ success: true, data });
    } catch (error: any) {
      logger.error('Error in PublicEcommerceController.getCategories:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  public static async getBrands(_req: Request, res: Response) {
    try {
      const data = await PublicEcommerceService.getPublicBrands();
      res.json({ success: true, data });
    } catch (error: any) {
      logger.error('Error in PublicEcommerceController.getBrands:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  public static async validateCoupon(req: Request, res: Response) {
    try {
      const { code, subtotal, customerId } = req.body;
      const data = await PublicEcommerceService.validateCoupon(code, Number(subtotal), customerId);
      res.json({ success: true, data });
    } catch (error: any) {
      logger.warn('Coupon validation warning:', error.message);
      res.status(400).json({ success: false, message: error.message });
    }
  }

  public static async getCart(req: Request, res: Response) {
    try {
      const cartId = Array.isArray(req.params.cartId) ? req.params.cartId[0] : req.params.cartId;
      const customerId = (req as any).user?.id;
      const data = await PublicEcommerceService.getOrCreateCart(cartId, customerId);
      res.json({ success: true, data });
    } catch (error: any) {
      logger.error('Error in PublicEcommerceController.getCart:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  public static async addToCart(req: Request, res: Response) {
    try {
      const { cartId, sku, quantity, customerId } = req.body;
      const data = await PublicEcommerceService.addToCart(cartId, sku, Number(quantity) || 1, customerId);
      res.json({ success: true, message: 'Item added to cart', data });
    } catch (error: any) {
      logger.error('Error in PublicEcommerceController.addToCart:', error);
      res.status(400).json({ success: false, message: error.message });
    }
  }

  public static async updateCartItem(req: Request, res: Response) {
    try {
      const { cartId, sku, quantity } = req.body;
      const data = await PublicEcommerceService.updateCartItemQuantity(cartId, sku, Number(quantity));
      res.json({ success: true, message: 'Cart item updated', data });
    } catch (error: any) {
      logger.error('Error in PublicEcommerceController.updateCartItem:', error);
      res.status(400).json({ success: false, message: error.message });
    }
  }

  public static async applyCoupon(req: Request, res: Response) {
    try {
      const { cartId, couponCode } = req.body;
      const data = await PublicEcommerceService.applyCouponToCart(cartId, couponCode);
      res.json({ success: true, message: 'Coupon applied successfully', data });
    } catch (error: any) {
      logger.error('Error in PublicEcommerceController.applyCoupon:', error);
      res.status(400).json({ success: false, message: error.message });
    }
  }

  public static async getWishlist(req: Request, res: Response) {
    try {
      const customerId = (req as any).user?.id || (req.query.customerId as string);
      const sessionId = req.query.sessionId as string;
      const data = await PublicEcommerceService.getWishlist(customerId, sessionId);
      res.json({ success: true, data });
    } catch (error: any) {
      logger.error('Error in PublicEcommerceController.getWishlist:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  public static async toggleWishlist(req: Request, res: Response) {
    try {
      const { sku, customerId, sessionId } = req.body;
      const isAdded = await PublicEcommerceService.toggleWishlist(sku, customerId, sessionId);
      res.json({ success: true, isAdded, message: isAdded ? 'Added to wishlist' : 'Removed from wishlist' });
    } catch (error: any) {
      logger.error('Error in PublicEcommerceController.toggleWishlist:', error);
      res.status(400).json({ success: false, message: error.message });
    }
  }

  public static async getCustomerOrders(req: Request, res: Response) {
    try {
      const customerIdOrMobile = Array.isArray(req.params.mobileOrId) ? req.params.mobileOrId[0] : req.params.mobileOrId;
      const data = await PublicEcommerceService.getCustomerOrders(customerIdOrMobile);
      res.json({ success: true, data });
    } catch (error: any) {
      logger.error('Error in PublicEcommerceController.getCustomerOrders:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  public static async customerAiAssistant(req: Request, res: Response) {
    try {
      const { prompt, customerId } = req.body;
      const data = await PublicEcommerceService.customerAiAssistant(prompt, customerId);
      res.json({ success: true, data });
    } catch (error: any) {
      logger.error('Error in PublicEcommerceController.customerAiAssistant:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  public static async submitReview(req: Request, res: Response) {
    try {
      const data = await PublicEcommerceService.submitReview(req.body);
      res.json({ success: true, message: 'Review submitted successfully', data });
    } catch (error: any) {
      logger.error('Error in PublicEcommerceController.submitReview:', error);
      res.status(400).json({ success: false, message: error.message });
    }
  }

  public static async getProductReviews(req: Request, res: Response) {
    try {
      const sku = Array.isArray(req.params.sku) ? req.params.sku[0] : req.params.sku;
      const data = await PublicEcommerceService.getProductReviews(sku);
      res.json({ success: true, data });
    } catch (error: any) {
      logger.error('Error in PublicEcommerceController.getProductReviews:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
}
