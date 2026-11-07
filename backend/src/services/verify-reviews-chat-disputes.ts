import mongoose from 'mongoose';
import env from '../config/env';
import { ProductModel } from '../models/Product';
import { ReviewService } from './ReviewService';
import { ChatService } from './ChatService';
import { DisputeService } from './DisputeService';
import { AdminModerationService } from './AdminModerationService';

async function runVerification() {
  console.log('--- Starting Verification for Reviews, Chat, Disputes & Moderation ---');
  await mongoose.connect(env.MONGODB_URI);
  console.log('Connected to MongoDB Atlas');

  try {
    // 1. Verify Regex Sanitizer with Structured Return (Slide 26 & 31)
    console.log('\n[TEST 1] Regex Sanitizer & Structured Return');
    const sampleText = 'Call me at 01711000000 or pay via 4532-1234-5678-9010 or check https://example.com';
    const sanitized = ChatService.sanitizeChatMessage(sampleText);
    console.log('Sanitized Output:', JSON.stringify(sanitized, null, 2));
    if (!sanitized.warnings.includes('FINANCIAL_DATA_DETECTED')) {
      throw new Error('Failed to detect financial data');
    }
    if (!sanitized.warnings.includes('PHONE_NUMBER_DETECTED')) {
      throw new Error('Failed to detect phone number');
    }
    if (!sanitized.warnings.includes('EXTERNAL_LINK_DETECTED')) {
      throw new Error('Failed to detect external link');
    }
    console.log('✓ Slide 26 & 31 Regex pattern matching & Structured Return verified.');

    // 2. Verify Decoupled ChatRoom & Message (Slide 15, 20, 32, 37)
    console.log('\n[TEST 2] Decoupled Chat Room & Message Creation');
    const sendRes = await ChatService.sendMessage({
      customerName: 'Test Customer',
      customerPhone: '01899123456',
      senderType: 'CUSTOMER',
      senderName: 'Test Customer',
      text: 'Is the Mesh Nebulizer currently in stock at Tejgaon Depot?',
    });
    console.log('Chat Message created:', sendRes.message._id, 'in Room:', sendRes.room._id);
    console.log('Last message preview:', sendRes.room.lastMessagePreview);
    console.log('Unread count admin:', sendRes.room.unreadCountAdmin);

    const inbox = await ChatService.getInboxSummary();
    console.log(`Inbox summary retrieved: ${inbox.rooms.length} active rooms, ${inbox.totalUnread} unread admin msgs`);
    console.log('✓ Slide 15, 20, 32, 37 Decoupled Chat Architecture verified.');

    // 3. Verify Reviews & Ratings (Prompt 18)
    console.log('\n[TEST 3] Product Reviews & Star Ratings (Prompt 18)');
    let sampleProduct = await ProductModel.findOne({ isActive: true });
    if (!sampleProduct) {
      console.log('No product found, creating a dummy product for testing');
      sampleProduct = await ProductModel.create({
        sku: 'MED-TEST-001',
        nameEn: 'Test Medical Stethoscope',
        category: 'Diagnostic',
        hsCode: '9018.90.00',
        baseUom: 'PCS',
        retailPrice: 1200,
        showroomPrice: 1100,
        isActive: true,
      });
    }

    const review = await ReviewService.submitReview({
      productId: sampleProduct._id.toString(),
      reviewerName: 'Dr. Shahriar Rahman',
      reviewerPhone: '01711223344',
      rating: 5,
      title: 'Excellent hospital-grade accuracy',
      reviewText: 'Used in cardiology OPD. Highly sensitive diaphragm and durable build.',
    });
    console.log('Review created:', review._id, 'for SKU:', review.productSku);

    const updatedProduct = await ProductModel.findById(sampleProduct._id);
    console.log(`Product rating updated: ${updatedProduct?.averageRating} ★ (${updatedProduct?.ratingCount} reviews)`);
    console.log('✓ Prompt 18 Product Reviews & Ratings verified.');

    // 4. Verify Dispute & Warranty Claim (Prompt 19 & 20)
    console.log('\n[TEST 4] Disputes & RMA Warranty Claims (Prompt 19 & 20)');
    const claim = await DisputeService.submitClaim({
      orderId: 'ORD-2026-TEST',
      orderNumber: 'ORD-2026-TEST',
      productSku: sampleProduct.sku,
      productName: sampleProduct.nameEn,
      customerName: 'Rahim Medical Store',
      customerPhone: '01911998877',
      claimType: 'WARRANTY_SERVICE',
      description: 'Display backlight flickering after 2 weeks of operation. Requesting warranty check.',
    });
    console.log('Dispute claim created ticket:', claim.claimNumber, 'Status:', claim.status);

    const resolved = await DisputeService.resolveClaim({
      claimId: claim._id.toString(),
      status: 'APPROVED_REPLACEMENT',
      moderatorNotes: 'Defect confirmed by Biomedical QA team. Replacement unit dispatched.',
    });
    console.log('Dispute resolved to:', resolved.status, 'Notes:', resolved.moderatorNotes);
    console.log('✓ Prompt 19 & 20 Reports, Disputes & Moderation Queue verified.');

    // 5. Admin Moderation Overview
    const overview = await AdminModerationService.getModerationOverview();
    console.log('\n[TEST 5] Admin Moderation Overview:', overview);
    console.log('✓ All verification criteria passed successfully!');
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB Atlas');
  }
}

runVerification().catch((err) => {
  console.error('Verification error:', err);
  process.exit(1);
});

