import mongoose, { Types } from 'mongoose';
import assert from 'assert';
import env from '../config/env';
import logger from '../config/logger';

import '../models/Product';
import '../models/Category';
import '../models/Brand';
import '../models/User';
import '../models/Organization';
import '../models/ApprovalRequest';

import { MarketingCampaignModel } from '../models/MarketingCampaign';
import { WebsiteBannerModel } from '../models/WebsiteBanner';
import { MarketingPromotionModel } from '../models/MarketingPromotion';
import { LandingPageModel } from '../models/LandingPage';
import { WebsiteContentModel } from '../models/WebsiteContent';
import { SocialAccountModel } from '../models/SocialAccount';
import { SocialPostModel } from '../models/SocialPost';
import { NavigationMenuModel } from '../models/NavigationMenu';
import { MarketingSettingsModel } from '../models/MarketingSettings';

import { MarketingCampaignService } from './MarketingCampaignService';
import { BannerSliderService } from './BannerSliderService';
import { WebsiteContentService } from './WebsiteContentService';
import { SocialMediaService } from './SocialMediaService';
import { MarketingSchedulerService } from './MarketingSchedulerService';
import { MarketingAnalyticsService } from './MarketingAnalyticsService';
import { MarketingAiService } from './MarketingAiService';

const TEST_ORG_ID = new Types.ObjectId('600000000000000000000001');
const TEST_USER_ID = new Types.ObjectId('000000000000000000000001');
const TEST_APPROVER_ID = new Types.ObjectId('000000000000000000000002');

async function runMarketingVerification() {
  console.log('════════════════════════════════════════════════════════════════════════');
  console.log('  MODULE 11: BANNERS, SOCIAL MEDIA, MARKETING & CMS TEST SUITE');
  console.log('  Sun Bird Corporation ERP Enterprise Verification');
  console.log('════════════════════════════════════════════════════════════════════════\n');

  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(env.MONGODB_URI);
  }

  try {
    // ── Clean test artifacts ──
    await MarketingCampaignModel.deleteMany({ campaignCode: { $regex: '^CMP-TEST' } });
    await WebsiteBannerModel.deleteMany({ bannerCode: { $regex: '^BNR-TEST' } });
    await MarketingPromotionModel.deleteMany({ promotionCode: { $regex: '^PRM-TEST' } });
    await LandingPageModel.deleteMany({ slug: { $regex: '^test-page' } });
    await WebsiteContentModel.deleteMany({ contentKey: { $regex: '^TEST_' } });
    await SocialPostModel.deleteMany({ postCode: { $regex: '^SOC-TEST' } });

    // ──────────────────────────────────────────────────────────────────────────
    // 1. CAMPAIGN CREATION & AUTO NUMBERING
    // ──────────────────────────────────────────────────────────────────────────
    console.log('--- 1. Marketing Campaign Creation & Code Generation ---');
    const campaignCode = await MarketingCampaignService.generateCampaignCode(TEST_ORG_ID);
    assert(campaignCode.startsWith('CMP-'), 'Campaign code must start with CMP-');

    const startDate = new Date();
    const endDate = new Date(Date.now() + 15 * 86400000); // 15 days later

    const campaign = await MarketingCampaignService.createCampaign(TEST_ORG_ID, TEST_USER_ID, {
      campaignCode: `CMP-TEST-${Date.now()}`,
      name: 'Eid Special Medical Equipment Festival 2026',
      campaignType: 'FESTIVAL',
      description: 'Exclusive corporate and hospital discount package on ICU & OT equipment',
      startDate,
      endDate,
      budget: 150000,
      discountPercentage: 15,
      targetAudience: 'HOSPITALS_CLINICS',
    });

    assert(campaign._id, 'Campaign must be created with ID');
    assert.strictEqual(campaign.status, 'DRAFT', 'Initial status must be DRAFT');
    assert.strictEqual(campaign.approvalStatus, 'DRAFT', 'Initial approval status must be DRAFT');
    console.log(`✅ [PASS] Campaign created: ${campaign.campaignCode} - "${campaign.name}" (Budget: ৳${campaign.budget})`);

    // ──────────────────────────────────────────────────────────────────────────
    // 2. CAMPAIGN APPROVAL WORKFLOW
    // ──────────────────────────────────────────────────────────────────────────
    console.log('\n--- 2. Campaign Approval & Status Transitions ---');
    const submitted = await MarketingCampaignService.submitCampaignForApproval(
      TEST_ORG_ID,
      TEST_USER_ID,
      String(campaign._id)
    );
    assert.strictEqual(submitted.status, 'PENDING_APPROVAL');
    assert.strictEqual(submitted.approvalStatus, 'PENDING');
    console.log('✅ [PASS] Campaign submitted for approval');

    const approved = await MarketingCampaignService.processCampaignApproval(
      TEST_ORG_ID,
      TEST_APPROVER_ID,
      String(campaign._id),
      'APPROVE'
    );
    assert.strictEqual(approved.approvalStatus, 'APPROVED');
    assert.strictEqual(approved.status, 'ACTIVE');
    assert(approved.approvedBy, 'ApprovedBy must be recorded');
    console.log('✅ [PASS] Campaign approved and transitioned to ACTIVE');

    const paused = await MarketingCampaignService.updateCampaignStatus(
      TEST_ORG_ID,
      TEST_USER_ID,
      String(campaign._id),
      'PAUSED'
    );
    assert.strictEqual(paused.status, 'PAUSED');
    console.log('✅ [PASS] Campaign operational status updated to PAUSED');

    // ──────────────────────────────────────────────────────────────────────────
    // 3. PRODUCT & CATEGORY PROMOTIONS
    // ──────────────────────────────────────────────────────────────────────────
    console.log('\n--- 3. Product & Category Promotions ---');
    const promo = await MarketingCampaignService.createPromotion(TEST_ORG_ID, TEST_USER_ID, {
      promotionCode: `PRM-TEST-${Date.now()}`,
      name: 'ICU Bed 10% Flat Corporate Discount',
      campaignId: campaign._id as Types.ObjectId,
      targetType: 'PRODUCT',
      discountType: 'PERCENTAGE',
      discountValue: 10,
      originalPrice: 120000,
      promotionalPrice: 108000,
      minQuantity: 1,
      startDate,
      endDate,
      status: 'ACTIVE',
    });
    assert(promo._id);
    assert.strictEqual(promo.promotionalPrice, 108000);
    console.log(`✅ [PASS] Product promotion created: ${promo.promotionCode} (10% discount, ৳120,000 -> ৳108,000)`);

    // ──────────────────────────────────────────────────────────────────────────
    // 4. WEBSITE BANNER & SLIDER LIFECYCLE
    // ──────────────────────────────────────────────────────────────────────────
    console.log('\n--- 4. Website Banner & Homepage Slider Management ---');
    const bannerCode = await BannerSliderService.generateBannerCode(TEST_ORG_ID);
    assert(bannerCode.startsWith('BNR-'));

    const banner = await BannerSliderService.createBanner(TEST_ORG_ID, TEST_USER_ID, {
      bannerCode: `BNR-TEST-${Date.now()}`,
      name: 'Tejgaon Central Depot ICU Bed Showcase',
      bannerType: 'HERO_SLIDER',
      title: 'সর্বাধুনিক মাল্টিফাংশনাল আইসিইউ পেশেন্ট কেয়ার বেড',
      subtitle: 'DGDA অনুমোদিত আন্তর্জাতিক মানসম্মত মেডিকেল ফার্নিচার',
      imageUrl: '/images/products/icu-bed.svg',
      buttonText: 'অর্ডার করুন',
      buttonLink: '#products',
      displayPosition: 'HOMEPAGE_HERO',
      displayOrder: 1,
      startDate,
      endDate,
      backgroundColor: '#1e3932',
      textColor: '#ffffff',
      sliderSettings: {
        isSlide: true,
        autoplaySpeed: 5000,
        transitionEffect: 'slide',
      },
    });

    assert(banner._id);
    assert.strictEqual(banner.status, 'DRAFT');
    console.log(`✅ [PASS] Hero slider banner created: ${banner.bannerCode} - "${banner.title}"`);

    // Publish banner
    const publishedBanner = await BannerSliderService.publishBanner(
      TEST_ORG_ID,
      TEST_APPROVER_ID,
      String(banner._id)
    );
    assert.strictEqual(publishedBanner.status, 'PUBLISHED');
    assert.strictEqual(publishedBanner.isActive, true);
    console.log('✅ [PASS] Banner published and activated for public storefront display');

    // Reorder banners
    await BannerSliderService.reorderBanners(TEST_ORG_ID, TEST_USER_ID, [
      { id: String(banner._id), displayOrder: 10 },
    ]);
    const updatedBanner = await BannerSliderService.getBannerById(TEST_ORG_ID, String(banner._id));
    assert.strictEqual(updatedBanner?.displayOrder, 10);
    console.log('✅ [PASS] Banner display order successfully reordered to 10');

    // ──────────────────────────────────────────────────────────────────────────
    // 5. PUBLIC WEBSITE ACTIVE CONTENT QUERY
    // ──────────────────────────────────────────────────────────────────────────
    console.log('\n--- 5. Public Website API & Security Verification ---');
    const publicBanners = await BannerSliderService.getPublicActiveBanners(String(TEST_ORG_ID));
    assert(publicBanners.length > 0, 'Public query must return at least one active banner');
    const matched = publicBanners.find((b) => b.bannerCode === banner.bannerCode);
    assert(matched, 'Published banner must be returned to public website');
    assert.strictEqual(matched.title, banner.title);
    assert.strictEqual((matched as any).createdBy, undefined, 'Internal user metadata must not be exposed');
    console.log(`✅ [PASS] Public API returned ${publicBanners.length} active banners with clean security filtering`);

    // ──────────────────────────────────────────────────────────────────────────
    // 6. CMS CONTENT & VERSION CONTROL (ROLLBACK)
    // ──────────────────────────────────────────────────────────────────────────
    console.log('\n--- 6. CMS Website Content Management & Version History ---');
    const testContentKey = `TEST_POLICY_${Date.now()}`;
    const initialContent = await WebsiteContentService.upsertContent(TEST_ORG_ID, TEST_USER_ID, {
      contentKey: testContentKey,
      title: 'Sun Bird Corporation Warranty Policy (Version 1)',
      contentType: 'POLICY',
      body: 'Standard 1-year comprehensive replacement warranty on all electronics.',
      changeSummary: 'Initial policy draft',
    });
    assert.strictEqual(initialContent.currentVersion, 1);
    console.log(`✅ [PASS] CMS content created: Version 1 (Key: ${testContentKey})`);

    // Update to Version 2
    const updatedContent = await WebsiteContentService.upsertContent(TEST_ORG_ID, TEST_USER_ID, {
      contentKey: testContentKey,
      title: 'Sun Bird Corporation Warranty Policy (Version 2)',
      contentType: 'POLICY',
      body: 'Extended 3-year warranty including quarterly biomedical engineer inspections.',
      changeSummary: 'Extended warranty terms updated',
    });
    assert.strictEqual(updatedContent.currentVersion, 2);
    assert.strictEqual(updatedContent.versions.length, 2, 'History array must contain 2 versions');
    console.log('✅ [PASS] CMS content updated to Version 2 with automated history archival');

    // Rollback to Version 1
    const rolledBack = await WebsiteContentService.rollbackContent(
      TEST_ORG_ID,
      TEST_USER_ID,
      String(updatedContent._id),
      1
    );
    assert.strictEqual(rolledBack.currentVersion, 3);
    assert(rolledBack.body.includes('Standard 1-year comprehensive'), 'Rolled-back body must match Version 1');
    console.log('✅ [PASS] Content successfully rolled back to Version 1 (Current version is 3 with audit)');

    // ──────────────────────────────────────────────────────────────────────────
    // 7. LANDING PAGE MANAGEMENT
    // ──────────────────────────────────────────────────────────────────────────
    console.log('\n--- 7. Landing Page Management with Sections ---');
    const pageSlug = `test-page-${Date.now()}`;
    const landingPage = await WebsiteContentService.createLandingPage(TEST_ORG_ID, TEST_USER_ID, {
      title: 'Dhaka Medical College Hospital Oxygen Solution',
      slug: pageSlug,
      campaignId: campaign._id as Types.ObjectId,
      description: 'Dedicated landing page for government and private hospital oxygen procurement',
      status: 'PUBLISHED',
      sections: [
        {
          sectionId: 'sec-hero-01',
          type: 'HERO_BANNER',
          title: 'নিরবচ্ছিন্ন ৯৩%±৩% মেডিকেল অক্সিজেন প্ল্যান্ট',
          buttonText: 'কোটেশন রিকোয়েস্ট',
          buttonLink: '#quote',
          displayOrder: 1,
          desktopVisible: true,
          mobileVisible: true,
        },
        {
          sectionId: 'sec-countdown-02',
          type: 'COUNTDOWN',
          title: 'অফারটি শেষ হতে বাকি',
          countdownEndDate: new Date(Date.now() + 7 * 86400000),
          displayOrder: 2,
          desktopVisible: true,
          mobileVisible: true,
        },
      ],
    });
    assert(landingPage._id);
    assert.strictEqual(landingPage.slug, pageSlug);
    assert.strictEqual(landingPage.sections.length, 2);
    console.log(`✅ [PASS] Landing page created with 2 section blocks: /landing/${landingPage.slug}`);

    // Verify public query by slug
    const publicPage = await WebsiteContentService.getLandingPageBySlug(pageSlug);
    assert(publicPage, 'Published landing page must be resolvable by slug');
    assert.strictEqual(publicPage.title, landingPage.title);
    console.log('✅ [PASS] Landing page verified via public slug query');

    // ──────────────────────────────────────────────────────────────────────────
    // 8. SOCIAL MEDIA ACCOUNTS & POSTING
    // ──────────────────────────────────────────────────────────────────────────
    console.log('\n--- 8. Social Media Account Management & Publishing ---');
    const fbAccount = await SocialMediaService.connectSocialAccount(TEST_ORG_ID, TEST_USER_ID, {
      platform: 'FACEBOOK',
      accountName: 'Sun Bird Corporation Official Page',
      accountHandle: '@sunbirdcorp',
      externalAccountId: 'FB_PAGE_10928374',
    });
    assert.strictEqual(fbAccount.platform, 'FACEBOOK');
    assert.strictEqual(fbAccount.isConnected, true);
    console.log(`✅ [PASS] Social account connected: ${fbAccount.platform} (${fbAccount.accountName})`);

    // Create multi-platform post
    const postCode = await SocialMediaService.generatePostCode(TEST_ORG_ID);
    assert(postCode.startsWith('SOC-'));

    const socialPost = await SocialMediaService.createSocialPost(TEST_ORG_ID, TEST_USER_ID, {
      postCode: `SOC-TEST-${Date.now()}`,
      title: 'ICU Patient Monitor New Arrival Announcement',
      contentType: 'PRODUCT_SHOWCASE',
      campaignId: campaign._id as Types.ObjectId,
      primaryCaption: 'আন্তর্জাতিক মানের মাল্টিপ্যারা পেশেন্ট মনিটর এখন সরাসরি সান বার্ড কর্পোরেশনে।',
      hashtags: ['#SunBirdCorp', '#ICUMonitor', '#MedicalEquipmentBD'],
      scheduledDate: new Date(),
      platformVariants: [
        {
          platform: 'FACEBOOK',
          caption: 'হাসপাতালের জন্য বিশ্বস্ত আইসিইউ মনিটরিং ব্যবস্থা। ১-৩ বছরের অফিসিয়াল ওয়ারেন্টি।',
          status: 'SCHEDULED',
          hashtags: ['#SunBirdCorp'],
          mediaUrls: [],
        },
        {
          platform: 'LINKEDIN',
          caption: 'Equip your ICU & CCU with high-precision Multi-Para monitors from Sun Bird Corporation.',
          status: 'SCHEDULED',
          hashtags: ['#ICU'],
          mediaUrls: [],
        },
      ],
    });
    assert(socialPost._id);
    assert.strictEqual(socialPost.platformVariants.length, 2);
    console.log(`✅ [PASS] Multi-platform social post created: ${socialPost.postCode} for Facebook & LinkedIn`);

    // Publish post
    const publishedPost = await SocialMediaService.publishSocialPost(
      TEST_ORG_ID,
      TEST_USER_ID,
      String(socialPost._id)
    );
    assert.strictEqual(publishedPost.publishStatus, 'PUBLISHED');
    assert(publishedPost.platformVariants.every((v) => v.status === 'PUBLISHED' && v.externalPostId));
    console.log('✅ [PASS] Social post published with external platform ID generation');

    // ──────────────────────────────────────────────────────────────────────────
    // 9. MARKETING CALENDAR AGGREGATION
    // ──────────────────────────────────────────────────────────────────────────
    console.log('\n--- 9. Marketing Master Calendar Aggregation ---');
    const calendarItems = await SocialMediaService.getMarketingCalendar(TEST_ORG_ID);
    assert(Array.isArray(calendarItems));
    console.log(`✅ [PASS] Unified marketing calendar aggregated ${calendarItems.length} campaign & social events`);

    // ──────────────────────────────────────────────────────────────────────────
    // 10. CAMPAIGN & BANNER SCHEDULER RECONCILIATION
    // ──────────────────────────────────────────────────────────────────────────
    console.log('\n--- 10. Automated Campaign & Banner Scheduler ---');
    const schedReport = await MarketingSchedulerService.executeSchedulerReconciliation();
    assert(typeof schedReport.activatedBanners === 'number');
    assert(typeof schedReport.completedCampaigns === 'number');
    console.log('✅ [PASS] Scheduler reconciliation job executed without errors:', schedReport);

    // ──────────────────────────────────────────────────────────────────────────
    // 11. MARKETING DASHBOARD KPIS & ANALYTICS
    // ──────────────────────────────────────────────────────────────────────────
    console.log('\n--- 11. Marketing Dashboard Analytics & KPI Cards ---');
    const dashMetrics = await MarketingAnalyticsService.getDashboardMetrics(TEST_ORG_ID);
    assert(dashMetrics.kpis.totalCampaigns >= 1);
    assert(dashMetrics.kpis.totalBanners >= 1);
    assert(dashMetrics.kpis.publishedSocialPosts >= 1);
    console.log(`✅ [PASS] Real dashboard metrics compiled: Total Campaigns: ${dashMetrics.kpis.totalCampaigns}, Total Banners: ${dashMetrics.kpis.totalBanners}, Social Posts: ${dashMetrics.kpis.publishedSocialPosts}`);

    // ──────────────────────────────────────────────────────────────────────────
    // 12. AI-ASSISTED MARKETING COPYWRITING
    // ──────────────────────────────────────────────────────────────────────────
    console.log('\n--- 12. AI-Assisted Marketing Content Generator ---');
    const aiResult = await MarketingAiService.generateMarketingSuggestions({
      task: 'BANNER_COPY',
      productName: 'মাল্টিপ্যারা পেশেন্ট মনিটর',
      tone: 'PROFESSIONAL',
      language: 'bn',
    });
    assert(aiResult.suggestions.length > 0, 'AI generator must return suggestions');
    console.log(`✅ [PASS] AI Marketing Copy generated (${aiResult.generatedBy}):`);
    aiResult.suggestions.forEach((s, idx) => console.log(`   ${idx + 1}. ${s}`));

    console.log('\n════════════════════════════════════════════════════════════════════════');
    console.log('  MODULE 11 TEST SUMMARY: ALL 12 TEST SUITES PASSED | 0 FAILED');
    console.log('════════════════════════════════════════════════════════════════════════\n');
  } catch (err: any) {
    console.error('❌ [FAIL] Marketing module test failed:', err);
    throw err;
  } finally {
    await mongoose.connection.close();
  }
}

if (require.main === module) {
  runMarketingVerification()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export default runMarketingVerification;
