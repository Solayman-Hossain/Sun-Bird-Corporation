import mongoose, { Types } from 'mongoose';
import {
  ProductModel,
  ProductBatchModel,
  OrderModel,
  CustomerModel,
  MarketingPromotionModel,
  CustomerCart,
  ICustomerCart,
  CustomerWishlist,
  ICustomerWishlist,
  ReviewModel,
  RmaRequestModel,
  WarrantyRecordModel,
} from '../models';
import { CentralAiService } from './CentralAiService';
import { AiSecurityService } from './AiSecurityService';
import logger from '../config/logger';

export class PublicEcommerceService {
  /**
   * 1. CATEGORIES & BRANDS DISCOVERY
   */
  public static async getPublicCategories() {
    const categoriesAgg = await ProductModel.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          sampleImage: { $first: '$primaryImage' },
        },
      },
      { $sort: { count: -1 } },
    ]);

    return categoriesAgg.map((c) => ({
      name: c._id || 'General Medical',
      slug: (c._id || 'general').toLowerCase().replace(/\s+/g, '-'),
      productCount: c.count,
      imageUrl: c.sampleImage || '/images/category-default.jpg',
    }));
  }

  public static async getPublicBrands() {
    const brandsAgg = await ProductModel.aggregate([
      { $match: { isActive: true, brand: { $exists: true, $ne: '' } } },
      {
        $group: {
          _id: '$brand',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    return brandsAgg.map((b) => ({
      brandName: b._id,
      productCount: b.count,
    }));
  }

  /**
   * 2. COUPON VALIDATION & PROMOTIONAL PRICING
   */
  public static async validateCoupon(code: string, subtotal: number, customerId?: string) {
    if (!code) {
      throw new Error('Coupon code is required.');
    }

    const cleanCode = code.trim().toUpperCase();
    const now = new Date();

    const promo = await MarketingPromotionModel.findOne({
      $or: [{ promotionCode: cleanCode }, { name: cleanCode }, { promoCode: cleanCode } as any],
      status: { $in: ['ACTIVE', 'PUBLISHED'] },
      startDate: { $lte: now },
      endDate: { $gte: now },
    });

    if (!promo) {
      throw new Error('কুপন কোডটি সঠিক নয় অথবা এর মেয়াদ শেষ হয়ে গেছে।');
    }

    const minSpend = (promo as any).minOrderAmount || 0;
    if (subtotal < minSpend) {
      throw new Error(`এই কুপনটি ব্যবহারের জন্য ন্যূনতম ৳${minSpend.toLocaleString('en-IN')} টাকার অর্ডার প্রয়োজন।`);
    }

    let discountAmount = 0;
    const discountVal = promo.discountValue || 0;
    const maxDiscount = (promo as any).maxDiscountAmount;

    if (promo.discountType === 'PERCENTAGE') {
      discountAmount = Math.round((subtotal * discountVal) / 100);
      if (maxDiscount && discountAmount > maxDiscount) {
        discountAmount = maxDiscount;
      }
    } else {
      discountAmount = Math.min(subtotal, discountVal);
    }

    return {
      isValid: true,
      couponCode: cleanCode,
      promotionName: promo.name,
      discountType: promo.discountType,
      discountValue: discountVal,
      discountAmount,
      minOrderAmount: minSpend,
      payableSubtotal: Math.max(0, subtotal - discountAmount),
    };
  }

  /**
   * 3. SERVER-SIDE SHOPPING CART
   */
  public static async getOrCreateCart(cartId: string, customerId?: string): Promise<ICustomerCart> {
    let cart = await CustomerCart.findOne({
      $or: [
        { cartId },
        ...(customerId ? [{ customerId: new Types.ObjectId(customerId) }] : []),
      ],
    });

    if (!cart) {
      cart = await CustomerCart.create({
        cartId: cartId || `cart_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        customerId: customerId ? new Types.ObjectId(customerId) : undefined,
        items: [],
        subtotal: 0,
        discountTotal: 0,
        estimatedDeliveryFee: 120,
        grandTotal: 120,
      });
    }

    // Authoritative Price Re-validation against Product Model
    if (cart.items.length > 0) {
      const skus = cart.items.map((i) => i.sku);
      const liveProducts = await ProductModel.find({ sku: { $in: skus }, isActive: true });
      const priceMap = new Map<string, number>();
      liveProducts.forEach((p) => {
        const publicPrice = p.ecommerceCatalog?.promotionalPrice || p.retailPrice || (p as any).promotionalPrice || 1000;
        priceMap.set(p.sku, publicPrice);
      });

      let newSubtotal = 0;
      cart.items.forEach((item) => {
        if (priceMap.has(item.sku)) {
          item.price = priceMap.get(item.sku)!;
        }
        newSubtotal += item.price * item.quantity;
      });

      cart.subtotal = newSubtotal;
      if (cart.appliedCoupon) {
        const disc = cart.appliedCoupon.discountType === 'PERCENTAGE'
          ? Math.round((cart.subtotal * (cart.appliedCoupon.discountValue || 0)) / 100)
          : Math.min(cart.subtotal, cart.appliedCoupon.discountValue || 0);
        cart.discountTotal = disc;
      } else {
        cart.discountTotal = 0;
      }
      cart.grandTotal = Math.max(0, cart.subtotal - cart.discountTotal + cart.estimatedDeliveryFee);
      await cart.save();
    }

    return cart;
  }

  public static async addToCart(
    cartId: string,
    sku: string,
    quantity: number = 1,
    customerId?: string
  ): Promise<ICustomerCart> {
    const product = await ProductModel.findOne({ sku, isActive: true });
    if (!product) {
      throw new Error('পণ্যটি খুঁজে পাওয়া যায়নি অথবা বর্তমানে বিক্রয়যোগ্য নয়।');
    }

    const price = product.ecommerceCatalog?.promotionalPrice || product.retailPrice || (product as any).promotionalPrice || 1000;
    const cart = await this.getOrCreateCart(cartId, customerId);

    const existingIndex = cart.items.findIndex((i) => i.sku === sku);
    if (existingIndex > -1) {
      cart.items[existingIndex].quantity += quantity;
    } else {
      const img = product.gallery?.find((g) => g.isMain)?.url || product.gallery?.[0]?.url || (product as any).primaryImage || '/images/product-default.jpg';
      cart.items.push({
        productId: product._id,
        sku: product.sku,
        name: product.nameEn,
        price,
        quantity,
        imageUrl: img,
      });
    }

    // Recalculate
    cart.subtotal = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    cart.grandTotal = Math.max(0, cart.subtotal - cart.discountTotal + cart.estimatedDeliveryFee);
    await cart.save();
    return cart;
  }

  public static async updateCartItemQuantity(
    cartId: string,
    sku: string,
    quantity: number
  ): Promise<ICustomerCart> {
    const cart = await CustomerCart.findOne({ cartId });
    if (!cart) throw new Error('Cart not found.');

    if (quantity <= 0) {
      cart.items = cart.items.filter((i) => i.sku !== sku);
    } else {
      const item = cart.items.find((i) => i.sku === sku);
      if (item) {
        item.quantity = quantity;
      }
    }

    cart.subtotal = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    cart.grandTotal = Math.max(0, cart.subtotal - cart.discountTotal + cart.estimatedDeliveryFee);
    await cart.save();
    return cart;
  }

  public static async applyCouponToCart(cartId: string, code: string): Promise<ICustomerCart> {
    const cart = await CustomerCart.findOne({ cartId });
    if (!cart) throw new Error('Cart not found.');

    const couponResult = await this.validateCoupon(code, cart.subtotal);
    cart.appliedCoupon = {
      code: couponResult.couponCode,
      discountType: couponResult.discountType as any,
      discountValue: couponResult.discountValue,
      discountAmount: couponResult.discountAmount,
    };
    cart.discountTotal = couponResult.discountAmount;
    cart.grandTotal = Math.max(0, cart.subtotal - cart.discountTotal + cart.estimatedDeliveryFee);
    await cart.save();
    return cart;
  }

  /**
   * 4. WISHLIST MANAGEMENT
   */
  public static async getWishlist(customerId?: string, sessionId?: string): Promise<any[]> {
    const query = customerId
      ? { customerId: new Types.ObjectId(customerId) }
      : { sessionId: sessionId || 'anon' };

    const wishlist = await CustomerWishlist.findOne(query);
    return wishlist ? wishlist.items : [];
  }

  public static async toggleWishlist(sku: string, customerId?: string, sessionId?: string): Promise<boolean> {
    const query = customerId
      ? { customerId: new Types.ObjectId(customerId) }
      : { sessionId: sessionId || 'anon' };

    let wishlist = await CustomerWishlist.findOne(query);
    if (!wishlist) {
      wishlist = await CustomerWishlist.create({
        ...query,
        items: [],
      });
    }

    const existsIndex = wishlist.items.findIndex((i) => i.sku === sku);
    if (existsIndex > -1) {
      wishlist.items.splice(existsIndex, 1);
      await wishlist.save();
      return false; // Removed
    } else {
      const product = await ProductModel.findOne({ sku, isActive: true });
      if (!product) throw new Error('Product not found');

      const img = product.gallery?.find((g: any) => g.isMain)?.url || product.gallery?.[0]?.url || (product as any).primaryImage || '/images/product-default.jpg';
      const price = product.ecommerceCatalog?.promotionalPrice || product.retailPrice || (product as any).promotionalPrice || 1000;

      wishlist.items.push({
        productId: product._id,
        sku: product.sku,
        name: product.nameEn,
        price,
        imageUrl: img,
        addedAt: new Date(),
      });
      await wishlist.save();
      return true; // Added
    }
  }

  /**
   * 5. CUSTOMER ORDERS & TRACKING
   */
  public static async getCustomerOrders(mobileOrCustomerId: string) {
    const customerIds: Types.ObjectId[] = [];
    if (mongoose.Types.ObjectId.isValid(mobileOrCustomerId)) {
      customerIds.push(new Types.ObjectId(mobileOrCustomerId));
    }
    const customers = await CustomerModel.find({
      $or: [
        { mobile: mobileOrCustomerId },
        { phone: mobileOrCustomerId },
        { contactNumber: mobileOrCustomerId },
      ],
    }).select('_id');
    customers.forEach((c) => customerIds.push(c._id));

    const query: any = {
      $or: [
        { customerMobile: mobileOrCustomerId },
        { contactPhone: mobileOrCustomerId },
        ...(customerIds.length > 0 ? [{ customerId: { $in: customerIds } }] : []),
      ],
    };

    const orders = await OrderModel.find(query)
      .select('-profitMargin -costPrice -journalEntryId -__v')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return orders.map((o: any) => ({
      orderId: o._id,
      orderNumber: o.orderNo || o.orderNumber,
      orderDate: o.orderDate || o.createdAt,
      totalAmount: o.grandTotal || o.totalAmount,
      paidAmount: o.paidAmount || 0,
      paymentMethod: o.paymentMethod,
      paymentStatus: o.paymentStatus,
      orderStatus: o.orderStatus,
      statusBadge: this.mapCustomerSafeStatus(o.orderStatus),
      deliveryAddress: o.deliveryAddress,
      items: (o.items || []).map((item: any) => ({
        sku: item.sku,
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        lineTotal: item.lineTotal,
      })),
    }));
  }

  private static mapCustomerSafeStatus(status: string): string {
    switch (status) {
      case 'SUBMITTED':
      case 'UNVERIFIED_COD':
      case 'DRAFT':
      case 'CART':
        return 'Order Received';
      case 'CONFIRMED':
      case 'PENDING_APPROVAL':
        return 'Confirmed';
      case 'PROCESSING':
      case 'RESERVED':
      case 'ALLOCATED':
      case 'PICKING':
      case 'PACKING':
        return 'Packing';
      case 'READY_FOR_DISPATCH':
      case 'DISPATCHED':
      case 'IN_TRANSIT':
      case 'OUT_FOR_DELIVERY':
        return 'Dispatched / In Transit';
      case 'DELIVERED':
      case 'COMPLETED':
        return 'Delivered';
      case 'CANCELLED':
      case 'REJECTED':
        return 'Cancelled';
      default:
        return 'Processing';
    }
  }

  /**
   * 6. CUSTOMER-FACING AI SHOPPING COPILOT
   */
  public static async customerAiAssistant(userPrompt: string, customerId?: string): Promise<{
    answer: string;
    suggestedProducts?: any[];
    citations: string[];
  }> {
    // Stage 1: Security Redaction & Injection Protection
    const sanitizedPrompt = AiSecurityService.sanitizePromptInput(userPrompt);

    // Stage 2: Retrieve Public Product Catalog Context
    const products = await ProductModel.find({ isActive: true })
      .select('sku nameEn nameBn category brand retailPrice ecommerceCatalog warrantyPeriod')
      .limit(10)
      .lean();

    const catalogContext = products
      .map(
        (p: any) =>
          `• [${p.sku}] ${p.nameEn} (${p.category}) - ৳${(p.ecommerceCatalog?.promotionalPrice || p.retailPrice || 0).toLocaleString('en-IN')}, Brand: ${p.brand || 'Sun Bird'}, Warranty: ${p.warrantyPeriod || '24 Months'}`
      )
      .join('\n');

    // Stage 3: Prompt Construction strictly preventing internal leaks
    const systemInstruction = `You are the Sun Bird Corporation AI Medical Equipment & E-Commerce Shopping Assistant.
You assist doctors, clinic directors, hospital procurement officers, and retail customers in choosing FDA/CE/DGDA-approved medical devices.
Available Catalog:
${catalogContext}

POLICY & COMPLIANCE RULES:
1. Always be polite, professional, and accurate. Provide responses in natural Bengali or English based on the user's language.
2. NEVER disclose internal cost prices, profit margins, supplier identities, confidential wholesale agreements, employee salaries, or bank accounts.
3. Suggest appropriate medical devices from the catalog.
4. Mention DGDA compliance, authentic manufacturer warranty, and free delivery in Dhaka for orders over ৳50,000.`;

    const fullPrompt = `${systemInstruction}\n\nCustomer Question: ${sanitizedPrompt}`;
    const aiResponse = await CentralAiService.generateText(fullPrompt, {
      organizationId: '000000000000000000000001',
      userId: customerId,
      module: 'ECOMMERCE',
      featureCode: 'CUSTOMER_SHOPPING_ASSISTANT',
    });

    return {
      answer: aiResponse.text,
      suggestedProducts: products.slice(0, 3).map((p: any) => ({
        sku: p.sku,
        name: p.nameEn,
        price: p.ecommerceCatalog?.promotionalPrice || p.retailPrice,
        category: p.category,
      })),
      citations: ['Sun Bird Healthcare Catalog 2026', 'DGDA Medical Device Registry'],
    };
  }

  /**
   * 7. PRODUCT REVIEWS & SOCIAL PROOF
   */
  public static async submitReview(data: {
    productSku: string;
    reviewerName: string;
    reviewerPhone: string;
    rating: number;
    title?: string;
    reviewText: string;
    customerId?: string;
  }) {
    const product = await ProductModel.findOne({ sku: data.productSku });
    if (!product) throw new Error('Product not found');

    // Check if buyer has verified delivery
    const verifiedOrder = await OrderModel.findOne({
      customerMobile: data.reviewerPhone,
      'items.sku': data.productSku,
      orderStatus: { $in: ['DELIVERED', 'COMPLETED'] },
    });

    const review = await ReviewModel.create({
      productId: product._id,
      productSku: product.sku,
      reviewerName: data.reviewerName,
      reviewerPhone: data.reviewerPhone,
      customerId: data.customerId ? new Types.ObjectId(data.customerId) : undefined,
      rating: Math.max(1, Math.min(5, data.rating)),
      title: data.title || 'Verified Purchase Feedback',
      reviewText: data.reviewText,
      isVerifiedBuyer: Boolean(verifiedOrder),
      status: 'APPROVED', // Auto-publish safe verified reviews
    });

    return review;
  }

  public static async getProductReviews(sku: string) {
    const reviews = await ReviewModel.find({ productSku: sku, status: 'APPROVED' })
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();

    const totalReviews = reviews.length;
    const avgRating = totalReviews > 0
      ? Number((reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / totalReviews).toFixed(1))
      : 5.0;

    return {
      sku,
      totalReviews,
      averageRating: avgRating,
      reviews,
    };
  }
}
