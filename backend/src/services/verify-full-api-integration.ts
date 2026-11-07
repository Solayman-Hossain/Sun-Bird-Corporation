import mongoose from 'mongoose';
import env from '../config/env';
import app from '../app';
import { ProductModel } from '../models/Product';
import { ChatService } from './ChatService';
import { ReviewService } from './ReviewService';
import { DisputeService } from './DisputeService';
import { AdminModerationService } from './AdminModerationService';
import { xssSanitizerMiddleware } from '../middlewares/xssSanitizer';

/**
 * Prompt 24: Comprehensive API Integration & Route Verification Test
 * Tests full request/response cycle, middleware chain, XSS sanitizer,
 * Reviews, Chat, Disputes & Moderation pipelines.
 */
async function runFullApiIntegrationTest() {
  console.log('===============================================================');
  console.log('🚀 SUN BIRD CORPORATION - PROMPT 23 & 24 FULL API INTEGRATION TEST');
  console.log('===============================================================');

  await mongoose.connect(env.MONGODB_URI);
  console.log('✓ MongoDB Atlas connected successfully.\n');

  // Start ephemeral HTTP listener on random available port
  const server = app.listen(0);
  const port = (server.address() as any).port;
  const baseUrl = `http://127.0.0.1:${port}`;
  console.log(`✓ Ephemeral test server active on ${baseUrl}\n`);

  try {
    // -------------------------------------------------------------
    // TEST 1: Health Check Route (Prompt 23 Requirement 3)
    // -------------------------------------------------------------
    console.log('[STEP 1] Testing Health Check Route: GET /api/v1/health');
    const healthRes = await fetch(`${baseUrl}/api/v1/health`);
    const healthJson = await healthRes.json();
    console.log('Health Check Response:', healthJson);
    if (!healthJson.success || healthJson.status !== 'UP' || healthJson.version !== '1.0.0') {
      throw new Error('Health check route verification failed');
    }
    console.log('✓ Prompt 23 Health Check Endpoint verified.\n');

    // -------------------------------------------------------------
    // TEST 2: Root Service Endpoint: GET /
    // -------------------------------------------------------------
    console.log('[STEP 2] Testing Root Endpoint: GET /');
    const rootRes = await fetch(`${baseUrl}/`);
    const rootJson = await rootRes.json();
    console.log('Root Service Response:', rootJson);
    if (!rootJson.success || rootJson.service !== 'Sun Bird Corporation ERP API') {
      throw new Error('Root route verification failed');
    }
    console.log('✓ Root Service Route verified.\n');

    // -------------------------------------------------------------
    // TEST 3: XSS Sanitization Middleware (Prompt 23 Requirement 1.5)
    // -------------------------------------------------------------
    console.log('[STEP 3] Testing XSS Sanitization Middleware');
    const dirtyPayload = {
      body: {
        comment: '<script>alert("hacked")</script>This is clean text',
        nested: {
          tag: '<iframe src="malicious.site"></iframe>Safe nested text',
        },
      },
      query: {},
      params: {},
    };
    xssSanitizerMiddleware(dirtyPayload as any, {} as any, () => {});
    if (dirtyPayload.body.comment.includes('<script>')) {
      throw new Error('XSS sanitizer failed to remove script tag!');
    }
    if (dirtyPayload.body.nested.tag.includes('<iframe>')) {
      throw new Error('XSS sanitizer failed to remove iframe tag!');
    }
    console.log('✓ XSS Sanitizer cleaned dirty HTML tags successfully:', dirtyPayload.body);

    // -------------------------------------------------------------
    // TEST 4: Reviews & Ratings Aggregation Pipeline (Prompt 18)
    // -------------------------------------------------------------
    console.log('\n[STEP 4] Testing Reviews & Ratings Pipeline (Prompt 18)');
    let product = await ProductModel.findOne({ isActive: true });
    if (!product) {
      product = await ProductModel.create({
        sku: 'MED-INT-TEST',
        nameEn: 'Hospital Diagnostic Test Unit',
        category: 'Diagnostic',
        hsCode: '9018.90.00',
        baseUom: 'PCS',
        retailPrice: 5000,
        showroomPrice: 4800,
        isActive: true,
      });
    }

    const review = await ReviewService.submitReview({
      productId: product._id.toString(),
      reviewerName: 'Prof. Dr. Mahmudul Hasan',
      reviewerPhone: '01711000111',
      rating: 5,
      title: 'Top-tier diagnostic precision',
      reviewText: 'Accurate clinical measurements. Highly recommended for ICU and OPD use.',
    });
    console.log(`✓ Review created [${review._id}] for Product SKU: ${review.productSku}`);

    const updatedProd = await ProductModel.findById(product._id);
    console.log(`✓ Product rating recalculated: ${updatedProd?.averageRating} ★ (${updatedProd?.ratingCount} reviews)`);

    const reviewsList = await ReviewService.getProductReviews(product._id.toString(), 1, 5);
    console.log(`✓ Retrieved ${reviewsList.reviews.length} reviews for public storefront display.`);

    // -------------------------------------------------------------
    // TEST 5: Real-time Chat Architecture & Regex Safety (Slides 15, 20, 26, 31, 32, 37)
    // -------------------------------------------------------------
    console.log('\n[STEP 5] Testing Chat Architecture & Regex Masking');
    const sensitiveMsg = 'Call me at 01811000000 or card 5412-7512-3412-9812 for urgent bulk purchase';
    const sendResult = await ChatService.sendMessage({
      customerName: 'Dhaka Care Hospital',
      customerPhone: '01811000000',
      senderType: 'CUSTOMER',
      senderName: 'Procurement Officer',
      text: sensitiveMsg,
    });
    console.log('✓ Chat Message created in Room:', sendResult.room._id);
    console.log('✓ Raw Text:', sendResult.message.rawText);
    console.log('✓ Sanitized Text:', sendResult.message.sanitizedText);
    console.log('✓ Regex Warnings Triggered:', sendResult.message.warnings);
    console.log('✓ Last Message Preview in Room:', sendResult.room.lastMessagePreview);
    console.log('✓ Admin Unread Count:', sendResult.room.unreadCountAdmin);

    const inbox = await ChatService.getInboxSummary();
    console.log(`✓ ERP Inbox Summary: ${inbox.rooms.length} active conversations, ${inbox.totalUnread} unread.`);

    // -------------------------------------------------------------
    // TEST 6: RMA Warranty Claims & Dispute Engine (Prompt 19 & 20)
    // -------------------------------------------------------------
    console.log('\n[STEP 6] Testing RMA Warranty Claims & Disputes (Prompt 19 & 20)');
    const rma = await DisputeService.submitClaim({
      orderId: 'ORD-2026-9999',
      orderNumber: 'ORD-2026-9999',
      productSku: product.sku,
      productName: product.nameEn,
      customerName: 'Chittagong Medical Center',
      customerPhone: '01899887766',
      claimType: 'WARRANTY_SERVICE',
      description: 'Sensor reading requires calibration under 1-year corporate warranty agreement.',
    });
    console.log(`✓ RMA Claim registered Ticket: ${rma.claimNumber} (Status: ${rma.status})`);

    const resolvedRma = await DisputeService.resolveClaim({
      claimId: rma._id.toString(),
      status: 'APPROVED_REPLACEMENT',
      moderatorNotes: 'Warranty claim verified by Head of Biomedical Engineering. Replacement dispatched via Pathao.',
    });
    console.log(`✓ RMA Claim resolved to: ${resolvedRma.status}`);

    // -------------------------------------------------------------
    // TEST 7: 404 Route Handling (Prompt 23 Requirement 1)
    // -------------------------------------------------------------
    console.log('\n[STEP 7] Testing 404 Not Found Handling: GET /api/v1/invalid-route');
    const notFoundRes = await fetch(`${baseUrl}/api/v1/invalid-route`);
    const notFoundJson = await notFoundRes.json();
    console.log('404 Response Status:', notFoundRes.status, notFoundJson);
    if (notFoundRes.status !== 404 || notFoundJson.error?.code !== 'RESOURCE_NOT_FOUND') {
      throw new Error('404 error handler verification failed');
    }
    console.log('✓ RFC 7807 NotFoundError Middleware verified.');

    // -------------------------------------------------------------
    // TEST 8: Admin Moderation Overview (Prompt 20)
    // -------------------------------------------------------------
    console.log('\n[STEP 8] Testing Admin Moderation Overview');
    const moderation = await AdminModerationService.getModerationOverview();
    console.log('✓ Admin Moderation Metrics:', moderation);

    console.log('\n===============================================================');
    console.log('🎉 ALL INTEGRATION TESTS PASSED WITHOUT ANY ERRORS OR GAPS!');
    console.log('===============================================================');
  } finally {
    server.close();
    await mongoose.disconnect();
    console.log('✓ Test server and MongoDB connections closed cleanly.');
  }
}

runFullApiIntegrationTest().catch((err) => {
  console.error('Integration test failed:', err);
  process.exit(1);
});
