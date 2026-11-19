import { Types } from 'mongoose';
import { MarketingCampaignModel } from '../models/MarketingCampaign';
import { WebsiteBannerModel } from '../models/WebsiteBanner';
import { SocialPostModel } from '../models/SocialPost';
import { SocialAccountModel } from '../models/SocialAccount';
import { MarketingSettingsModel, IMarketingSettings } from '../models/MarketingSettings';
import { AuditLogModel } from '../models/AuditLog';
import logger from '../config/logger';

export class MarketingAnalyticsService {
  /**
   * Generates real Marketing Dashboard metrics
   */
  public static async getDashboardMetrics(organizationId: Types.ObjectId | string): Promise<{
    kpis: {
      totalCampaigns: number;
      activeCampaigns: number;
      scheduledCampaigns: number;
      draftCampaigns: number;
      pendingApprovals: number;
      publishedCampaigns: number;
      expiredCampaigns: number;
      totalBanners: number;
      activeBanners: number;
      scheduledBanners: number;
      publishedSocialPosts: number;
      scheduledSocialPosts: number;
      totalImpressions: number;
      totalClicks: number;
      totalConversions: number;
      totalSpend: number;
      totalRevenue: number;
    };
    campaignsByType: Array<{ _id: string; count: number }>;
    bannersByType: Array<{ _id: string; count: number }>;
    socialPostsByPlatform: Array<{ _id: string; count: number }>;
    recentCampaigns: any[];
    recentBanners: any[];
  }> {
    const orgId = new Types.ObjectId(String(organizationId));

    const [
      campaigns,
      banners,
      posts,
      campaignsByType,
      bannersByType,
      socialPostsByPlatform,
    ] = await Promise.all([
      MarketingCampaignModel.find({ organizationId: orgId }).lean(),
      WebsiteBannerModel.find({ organizationId: orgId }).lean(),
      SocialPostModel.find({ organizationId: orgId }).lean(),
      MarketingCampaignModel.aggregate([
        { $match: { organizationId: orgId } },
        { $group: { _id: '$campaignType', count: { $sum: 1 } } },
      ]),
      WebsiteBannerModel.aggregate([
        { $match: { organizationId: orgId } },
        { $group: { _id: '$bannerType', count: { $sum: 1 } } },
      ]),
      SocialPostModel.aggregate([
        { $match: { organizationId: orgId } },
        { $unwind: '$platformVariants' },
        { $group: { _id: '$platformVariants.platform', count: { $sum: 1 } } },
      ]),
    ]);

    const activeCampaigns = campaigns.filter((c) => c.status === 'ACTIVE').length;
    const scheduledCampaigns = campaigns.filter((c) => c.status === 'SCHEDULED').length;
    const draftCampaigns = campaigns.filter((c) => c.status === 'DRAFT').length;
    const pendingApprovals = campaigns.filter((c) => c.approvalStatus === 'PENDING').length;
    const publishedCampaigns = campaigns.filter((c) => ['ACTIVE', 'SCHEDULED', 'COMPLETED'].includes(c.status)).length;
    const expiredCampaigns = campaigns.filter((c) => ['EXPIRED', 'COMPLETED'].includes(c.status)).length;

    const activeBanners = banners.filter((b) => b.status === 'PUBLISHED' && b.isActive).length;
    const scheduledBanners = banners.filter((b) => b.status === 'APPROVED' && new Date(b.startDate) > new Date()).length;

    const publishedSocialPosts = posts.filter((p) => p.publishStatus === 'PUBLISHED').length;
    const scheduledSocialPosts = posts.filter((p) => p.publishStatus === 'SCHEDULED').length;

    // Aggregate real metrics
    let totalImpressions = 0;
    let totalClicks = 0;
    let totalConversions = 0;
    let totalSpend = 0;
    let totalRevenue = 0;

    campaigns.forEach((c) => {
      totalImpressions += c.metrics?.impressions || 0;
      totalClicks += c.metrics?.clicks || 0;
      totalConversions += c.metrics?.conversions || 0;
      totalSpend += c.spentAmount || 0;
      totalRevenue += c.revenueGenerated || 0;
    });

    banners.forEach((b) => {
      totalImpressions += b.impressionCount || 0;
      totalClicks += b.clickCount || 0;
    });

    posts.forEach((p) => {
      totalImpressions += p.metrics?.impressions || 0;
      totalClicks += p.metrics?.clicks || 0;
    });

    return {
      kpis: {
        totalCampaigns: campaigns.length,
        activeCampaigns,
        scheduledCampaigns,
        draftCampaigns,
        pendingApprovals,
        publishedCampaigns,
        expiredCampaigns,
        totalBanners: banners.length,
        activeBanners,
        scheduledBanners,
        publishedSocialPosts,
        scheduledSocialPosts,
        totalImpressions,
        totalClicks,
        totalConversions,
        totalSpend,
        totalRevenue,
      },
      campaignsByType,
      bannersByType,
      socialPostsByPlatform,
      recentCampaigns: campaigns.slice(0, 5),
      recentBanners: banners.slice(0, 5),
    };
  }

  /**
   * Get or initialize organization marketing settings
   */
  public static async getSettings(organizationId: Types.ObjectId | string): Promise<IMarketingSettings> {
    const orgId = new Types.ObjectId(String(organizationId));
    let settings = await MarketingSettingsModel.findOne({ organizationId: orgId });

    if (!settings) {
      settings = new MarketingSettingsModel({
        organizationId: orgId,
        defaultTimeZone: 'Asia/Dhaka',
        requireApprovalForBanners: false,
        requireApprovalForCampaigns: true,
        requireApprovalForSocialPosts: false,
        autoExpirePromotions: true,
        defaultLanguage: 'bn',
        defaultWebsiteUrl: 'http://localhost:3000',
        templates: [
          {
            templateId: 'TMP_BANNER_HERO_1',
            name: 'Hero ICU Equipment Banner',
            templateType: 'BANNER',
            layoutConfig: { textPosition: 'LEFT', buttonStyle: 'GOLD' },
            defaultText: { title: 'অত্যাধুনিক আইসিইউ মেডিকেল ইকুইপমেন্ট', subtitle: 'DGDA অনুমোদিত নিশ্চয়তা' },
            defaultImages: ['/images/products/icu-bed.svg'],
            createdAt: new Date(),
          },
          {
            templateId: 'TMP_POST_FESTIVAL_1',
            name: 'Festival Discount Social Post',
            templateType: 'SOCIAL_POST',
            layoutConfig: { aspect: '1:1' },
            defaultText: { primaryCaption: 'বিশেষ মূল্যছাড়! সান বার্ড কর্পোরেশনের সকল মেডিকেল ও ডায়াগনস্টিক ডিভাইসে আকর্ষণীয় অফার।' },
            createdAt: new Date(),
          },
        ],
      });
      await settings.save();
    }

    return settings;
  }

  /**
   * Update organization marketing settings
   */
  public static async updateSettings(
    organizationId: Types.ObjectId | string,
    payload: Partial<IMarketingSettings>
  ): Promise<IMarketingSettings> {
    const orgId = new Types.ObjectId(String(organizationId));
    let settings = await MarketingSettingsModel.findOne({ organizationId: orgId });

    if (!settings) {
      settings = new MarketingSettingsModel({ ...payload, organizationId: orgId });
    } else {
      Object.assign(settings, payload);
    }

    await settings.save();
    return settings;
  }

  /**
   * Get Marketing Activity Audit Logs
   */
  public static async getMarketingAuditLogs(
    organizationId: Types.ObjectId | string,
    limit = 50
  ): Promise<any[]> {
    return AuditLogModel.find({
      organizationId: new Types.ObjectId(String(organizationId)),
      entity: {
        $in: [
          'MarketingCampaign',
          'WebsiteBanner',
          'MarketingPromotion',
          'LandingPage',
          'WebsiteContent',
          'SocialAccount',
          'SocialPost',
        ],
      },
    })
      .populate('actor', 'fullName email')
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean();
  }
}

export default MarketingAnalyticsService;
