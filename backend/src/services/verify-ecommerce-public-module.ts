import mongoose from 'mongoose';
import { connectDatabase } from '../config/database';
import {
  ProductModel,
  ProductBatchModel,
  OrderModel,
  CustomerModel,
  MarketingPromotionModel,
  CustomerCart,
  CustomerWishlist,
  ReviewModel,
} from '../models';
import { PublicEcommerceService } from './PublicEcommerceService';
import { CartCheckoutService } from './CartCheckoutService';

let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, message: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`✅ [PASS] ${message}`);
  } else {
    console.error(`❌ [FAIL] ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runEcommercePublicModuleVerification() {
  console.log('═══════════════════════════════════════════════════════════════════════');
  console.log('  MODULE 17: PUBLIC E-COMMERCE UPGRADE TEST SUITE');
  console.log('  Public Storefront, Dynamic Catalog, Cart, AI Copilot & Checkout');
  console.log('═══════════════════════════════════════════════════════════════════════\n');

  try {
    await connectDatabase();

    // 1. Setup Test Product Fixture
    let testProduct = await ProductModel.findOne({ sku: 'ECOM-OXY-01' });
    if (!testProduct) {
      testProduct = await ProductModel.create({
        sku: 'ECOM-OXY-01',
        nameEn: 'Medical Grade Oxygen Concentrator 10L',
        nameBn: '১০ লিটার মেডিকেল অক্সিজেন কনসেনট্রেটর',
        category: 'Respiratory Care',
        brand: 'Sun Bird BioMed',
        retailPrice: 85000,
        showroomPrice: 85000,
        costPrice: 52000, // Confidential internal cost
        purchasePrice: 50000,
        hsCode: '9019.20.00',
        baseUom: 'PCS',
        productType: 'PHYSICAL',
        status: 'ACTIVE',
        publicationStatus: 'PUBLISHED',
        isActive: true,
        isMedical: true,
        isExpirable: false,
        minStockQty: 5,
        barcodes: ['8940001234567'],
        resellerTierPrices: [],
        gallery: [
          {
            url: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=600',
            isMain: true,
            sortOrder: 0,
          },
        ],
        variants: [],
        ecommerceCatalog: {
          promotionalPrice: 78000,
          features: ['10L High Purity Oxygen', 'Dual Flow Outlets', 'CE & DGDA Approved'],
        },
      });
    } else {
      testProduct.ecommerceCatalog = {
        promotionalPrice: 78000,
        features: ['10L High Purity Oxygen', 'Dual Flow Outlets', 'CE & DGDA Approved'],
      };
      testProduct.retailPrice = 85000;
      testProduct.isActive = true;
      await testProduct.save();
    }

    // Ensure stock batch exists
    let testBatch = await ProductBatchModel.findOne({ sku: 'ECOM-OXY-01' });
    if (!testBatch) {
      testBatch = await ProductBatchModel.create({
        productId: testProduct._id,
        sku: 'ECOM-OXY-01',
        batchNumber: 'BATCH-2026-OXY',
        category: 'NON_EXPIRING',
        baseUom: 'PCS',
        currentQty: 40,
        reservedQty: 0,
        unitCost: 50000,
        warehouseId: new mongoose.Types.ObjectId(),
        hasIndividualSerials: false,
        warrantyMonths: 24,
        locationStatus: 'ON_HAND',
      });
    }

    // ─────────────────────────────────────────────────────────────
    // 1. PUBLIC CATEGORIES & BRANDS DISCOVERY
    // ─────────────────────────────────────────────────────────────
    console.log('--- 1. Testing Categories & Brands Aggregation ---');
    const categories = await PublicEcommerceService.getPublicCategories();
    assert(Array.isArray(categories) && categories.length > 0, 'Public categories aggregated from active catalog');
    const respiratoryCat = categories.find((c) => c.name === 'Respiratory Care');
    assert(Boolean(respiratoryCat && respiratoryCat.productCount > 0), 'Category product count computed');

    const brands = await PublicEcommerceService.getPublicBrands();
    assert(Array.isArray(brands) && brands.length > 0, 'Public brands aggregated');
    const sunbirdBrand = brands.find((b) => b.brandName === 'Sun Bird BioMed');
    assert(Boolean(sunbirdBrand && sunbirdBrand.productCount > 0), 'Brand product count computed');

    // ─────────────────────────────────────────────────────────────
    // 2. COUPON VALIDATION & PROMOTIONAL PRICING
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- 2. Testing Coupon Validation & Promotion Rules ---');
    await MarketingPromotionModel.deleteMany({
      $or: [{ promotionCode: 'HEALTHCARE2026' }, { name: 'Eid Health Care Special' }],
    });
    const defaultOrgId = new mongoose.Types.ObjectId();
    const defaultUserId = new mongoose.Types.ObjectId();

    await MarketingPromotionModel.create({
      organizationId: defaultOrgId,
      name: 'Eid Health Care Special',
      promotionCode: 'HEALTHCARE2026',
      targetType: 'CATEGORY',
      discountType: 'PERCENTAGE',
      discountValue: 10,
      minQuantity: 1,
      minOrderAmount: 20000,
      maxDiscountAmount: 5000,
      startDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      status: 'ACTIVE',
      usageCount: 0,
      createdBy: defaultUserId,
    } as any);

    const validCoupon = await PublicEcommerceService.validateCoupon('HEALTHCARE2026', 78000);
    assert(validCoupon.isValid === true, 'Coupon validated successfully');
    assert(validCoupon.discountAmount === 5000, 'Percentage discount capped at max discount limit (৳5,000)');
    assert(validCoupon.payableSubtotal === 73000, 'Payable subtotal correctly calculated');

    let couponFailed = false;
    try {
      await PublicEcommerceService.validateCoupon('HEALTHCARE2026', 5000); // Below min spend of 20000
    } catch {
      couponFailed = true;
    }
    assert(couponFailed, 'Coupon rejected when cart subtotal is below minimum spend threshold');

    // ─────────────────────────────────────────────────────────────
    // 3. SERVER-SIDE SHOPPING CART
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- 3. Testing Server-Side Shopping Cart ---');
    const testCartId = `cart_test_${Date.now()}`;
    const cart = await PublicEcommerceService.addToCart(testCartId, 'ECOM-OXY-01', 1);
    assert(Boolean(cart && cart.items.length === 1), 'Item added to shopping cart');
    assert(cart.subtotal === 78000, 'Cart subtotal uses authoritative promotional price (৳78,000)');

    const updatedCart = await PublicEcommerceService.applyCouponToCart(testCartId, 'HEALTHCARE2026');
    assert(updatedCart.discountTotal === 5000, 'Coupon discount applied to cart');
    assert(updatedCart.grandTotal === 78000 - 5000 + updatedCart.estimatedDeliveryFee, 'Grand total calculated with delivery fee');

    const qtyUpdatedCart = await PublicEcommerceService.updateCartItemQuantity(testCartId, 'ECOM-OXY-01', 2);
    assert(qtyUpdatedCart.items[0].quantity === 2, 'Cart item quantity updated to 2');

    // ─────────────────────────────────────────────────────────────
    // 4. WISHLIST MANAGEMENT
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- 4. Testing Wishlist Management ---');
    const testSessionId = `sess_test_${Date.now()}`;
    const added = await PublicEcommerceService.toggleWishlist('ECOM-OXY-01', undefined, testSessionId);
    assert(added === true, 'Item added to customer wishlist');

    const wishlistItems = await PublicEcommerceService.getWishlist(undefined, testSessionId);
    assert(wishlistItems.length === 1 && wishlistItems[0].sku === 'ECOM-OXY-01', 'Wishlist items retrieved');

    const removed = await PublicEcommerceService.toggleWishlist('ECOM-OXY-01', undefined, testSessionId);
    assert(removed === false, 'Item toggled and removed from wishlist');

    // ─────────────────────────────────────────────────────────────
    // 5. CUSTOMER-FACING AI SHOPPING COPILOT
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- 5. Testing Customer-Facing AI Shopping Copilot ---');
    const aiAnswer = await PublicEcommerceService.customerAiAssistant(
      'অক্সিজেন কনসেনট্রেটরের দাম কত এবং এর ওয়ারেন্টি কেমন?'
    );
    assert(Boolean(aiAnswer && aiAnswer.answer), 'AI Copilot generated customer answer in Bengali');
    assert(Array.isArray(aiAnswer.suggestedProducts), 'AI Copilot suggested relevant medical devices');

    // Verify confidential fields are NOT in output
    assert(!aiAnswer.answer.includes('52000'), 'Confidential cost price strictly redacted from AI response');
    assert(!aiAnswer.answer.includes('profitMargin'), 'Confidential profit margin strictly redacted');

    // ─────────────────────────────────────────────────────────────
    // 6. PRODUCT REVIEWS & RATINGS
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- 6. Testing Product Reviews & Verified Buyer Badging ---');
    const review = await PublicEcommerceService.submitReview({
      productSku: 'ECOM-OXY-01',
      reviewerName: 'Dr. Shahriar Ahmed',
      reviewerPhone: '01711223344',
      rating: 5,
      title: 'Excellent 10L Oxygen Output',
      reviewText: 'Running continuously in our ICU for 3 weeks without any pressure drops. Highly recommended.',
    });
    assert(Boolean(review && review._id), 'Customer review submitted');
    assert(review.rating === 5, 'Rating verified as 5 stars');

    const productReviews = await PublicEcommerceService.getProductReviews('ECOM-OXY-01');
    assert(productReviews.totalReviews > 0, 'Product reviews retrieved for public product page');
    assert(productReviews.averageRating >= 4.0, 'Average rating computed');

    // ─────────────────────────────────────────────────────────────
    // 7. PUBLIC CHECKOUT & ORDER INTEGRATION
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- 7. Testing Public Checkout & Stock Reservation ---');
    const checkoutResult = await CartCheckoutService.createOrderWithStockLock({
      customerName: 'Care Diagnostic Center Banani',
      customerMobile: '01711223344',
      customerEmail: 'procurement@carediagnostic.com.bd',
      deliveryAddress: 'House 42, Road 11, Banani, Dhaka-1213',
      district: 'Dhaka',
      paymentMethod: 'COD',
      items: [
        {
          productId: testProduct._id.toString(),
          sku: 'ECOM-OXY-01',
          productName: testProduct.nameEn,
          quantity: 1,
          unitPrice: 78000,
        },
      ],
      shippingFee: 120,
      discountAmount: 5000,
      notes: 'Please dispatch before 2 PM for urgent clinic setup',
    });

    assert(Boolean(checkoutResult && (checkoutResult.orderNo || checkoutResult.orderId)), 'Storefront checkout succeeded with order number');
    assert(
      checkoutResult.orderStatus === 'CONFIRMED' ||
        checkoutResult.orderStatus === 'SUBMITTED' ||
        checkoutResult.orderStatus === 'UNVERIFIED_COD',
      'Order status initiated'
    );

    // ─────────────────────────────────────────────────────────────
    // 8. CUSTOMER ORDER TRACKING
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- 8. Testing Customer Order History & Safety Mapping ---');
    const customerOrders = await PublicEcommerceService.getCustomerOrders('01711223344');
    assert(Array.isArray(customerOrders) && customerOrders.length > 0, 'Customer order history retrieved');
    const lastOrder = customerOrders[0];
    assert(Boolean(lastOrder.statusBadge), 'Customer-safe status badge mapped (e.g. Order Received)');
    assert((lastOrder as any).profitMargin === undefined, 'Internal profit margin is strictly excluded from public API');
    assert((lastOrder as any).costPrice === undefined, 'Internal cost price is strictly excluded from public API');

    console.log('\n═══════════════════════════════════════════════════════════════════════');
    console.log(`  MODULE 17: ALL ${passedTests}/${totalTests} TESTS PASSED SUCCESSFULLY!`);
    console.log('═══════════════════════════════════════════════════════════════════════\n');
  } catch (error) {
    console.error('❌ Verification failed with error:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

runEcommercePublicModuleVerification();
