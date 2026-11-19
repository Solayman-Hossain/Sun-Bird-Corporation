import { z } from 'zod';

export const createCampaignSchema = z.object({
  name: z.string().min(2, 'ক্যাম্পেইনের নাম আবশ্যক'),
  campaignType: z.enum([
    'SEASONAL',
    'FESTIVAL',
    'DISCOUNT',
    'PRODUCT_LAUNCH',
    'NEW_ARRIVAL',
    'FLASH_SALE',
    'CLEARANCE_SALE',
    'BUNDLE_PROMOTION',
    'CATEGORY_PROMOTION',
    'BRAND_PROMOTION',
    'COUPON_CAMPAIGN',
    'SPECIAL_OFFER',
    'CUSTOM',
  ]),
  description: z.string().optional(),
  bannerImageUrl: z.string().optional(),
  startDate: z.string().or(z.date()),
  endDate: z.string().or(z.date()),
  budget: z.number().nonnegative().optional(),
  applicableProductIds: z.array(z.string()).optional(),
  applicableCategoryIds: z.array(z.string()).optional(),
  applicableBrandIds: z.array(z.string()).optional(),
  couponCode: z.string().optional(),
  discountPercentage: z.number().min(0).max(100).optional(),
  discountAmount: z.number().min(0).optional(),
}).passthrough();

export const updateCampaignSchema = createCampaignSchema.partial().passthrough();

export const createBannerSchema = z.object({
  name: z.string().min(2, 'ব্যানারের নাম আবশ্যক'),
  bannerType: z.enum([
    'MAIN_HOMEPAGE',
    'HERO_SLIDER',
    'PROMOTIONAL_SPLIT',
    'CATEGORY_BANNER',
    'PRODUCT_BANNER',
    'BRAND_BANNER',
    'SIDEBAR_BANNER',
    'FOOTER_BANNER',
    'MOBILE_BANNER',
    'DESKTOP_BANNER',
    'POPUP_WELCOME',
    'POPUP_DISCOUNT',
    'POPUP_NEWSLETTER',
    'POPUP_CAMPAIGN',
    'ANNOUNCEMENT_BAR',
    'CUSTOM',
  ]),
  title: z.string().min(2, 'শিরোনাম আবশ্যক'),
  subtitle: z.string().optional(),
  description: z.string().optional(),
  imageUrl: z.string().min(1, 'ছবি আবশ্যক'),
  buttonText: z.string().optional(),
  buttonLink: z.string().optional(),
  targetUrl: z.string().optional(),
  displayPosition: z.string().optional(),
  displayOrder: z.number().optional(),
  startDate: z.string().or(z.date()),
  endDate: z.string().or(z.date()),
  backgroundColor: z.string().optional(),
  textColor: z.string().optional(),
  overlayOpacity: z.number().min(0).max(1).optional(),
  textPosition: z.enum(['LEFT', 'CENTER', 'RIGHT']).optional(),
  buttonStyle: z.enum(['PRIMARY', 'SECONDARY', 'OUTLINE', 'GOLD']).optional(),
}).passthrough();

export const updateBannerSchema = createBannerSchema.partial().passthrough();

export const createPromotionSchema = z.object({
  name: z.string().min(2, 'প্রমোশনের নাম আবশ্যক'),
  targetType: z.enum(['PRODUCT', 'CATEGORY', 'BRAND']),
  discountType: z.enum(['PERCENTAGE', 'FIXED_AMOUNT', 'SPECIAL_PRICE', 'BUY_X_GET_Y', 'BUNDLE_OFFER', 'QUANTITY_TIER']),
  discountValue: z.number().nonnegative('ডিসকাউন্ট মান আবশ্যক'),
  productId: z.string().optional(),
  categoryId: z.string().optional(),
  brandId: z.string().optional(),
  startDate: z.string().or(z.date()),
  endDate: z.string().or(z.date()),
}).passthrough();

export const createSocialPostSchema = z.object({
  title: z.string().min(2, 'পোস্টের শিরোনাম আবশ্যক'),
  contentType: z.enum([
    'TEXT_POST',
    'IMAGE_POST',
    'CAROUSEL',
    'VIDEO_POST',
    'REEL',
    'STORY',
    'LINK_POST',
    'PRODUCT_SHOWCASE',
    'CAMPAIGN_ANNOUNCEMENT',
  ]),
  primaryCaption: z.string().min(2, 'ক্যাপশন আবশ্যক'),
  hashtags: z.array(z.string()).optional(),
  mediaUrls: z.array(z.string()).optional(),
  scheduledDate: z.string().or(z.date()),
  platformVariants: z.array(
    z.object({
      platform: z.enum(['FACEBOOK', 'INSTAGRAM', 'YOUTUBE', 'LINKEDIN', 'TIKTOK', 'X_TWITTER', 'PINTEREST']),
      caption: z.string(),
      hashtags: z.array(z.string()).optional(),
      mediaUrls: z.array(z.string()).optional(),
    }).passthrough()
  ),
}).passthrough();
