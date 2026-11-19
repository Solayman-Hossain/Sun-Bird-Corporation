import { Types } from 'mongoose';
import { WebsiteBannerModel } from '../models/WebsiteBanner';
import { MarketingCampaignModel } from '../models/MarketingCampaign';
import { MarketingPromotionModel } from '../models/MarketingPromotion';
import { SocialPostModel } from '../models/SocialPost';
import logger from '../config/logger';

export class MarketingSchedulerService {
  /**
   * Reconciles and executes all pending scheduled transitions:
   * 1. Activates scheduled banners whose startDate <= now.
   * 2. Expires active banners whose endDate < now.
   * 3. Activates scheduled campaigns whose startDate <= now.
   * 4. Completes/expires campaigns whose endDate < now.
   * 5. Expires promotions whose endDate < now.
   * 6. Publishes scheduled social posts whose scheduledDate <= now.
   */
  public static async executeSchedulerReconciliation(): Promise<{
    activatedBanners: number;
    expiredBanners: number;
    activatedCampaigns: number;
    completedCampaigns: number;
    expiredPromotions: number;
    publishedPosts: number;
  }> {
    const now = new Date();
    logger.info(`[MarketingScheduler] Running reconciliation at ${now.toISOString()}...`);

    // 1. Activate scheduled banners
    const activateBannersResult = await WebsiteBannerModel.updateMany(
      {
        approvalStatus: 'APPROVED',
        status: 'APPROVED',
        startDate: { $lte: now },
        endDate: { $gte: now },
      },
      {
        $set: { status: 'PUBLISHED', isActive: true },
      }
    );

    // 2. Expire past banners
    const expireBannersResult = await WebsiteBannerModel.updateMany(
      {
        status: 'PUBLISHED',
        endDate: { $lt: now },
      },
      {
        $set: { status: 'EXPIRED', isActive: false },
      }
    );

    // 3. Activate scheduled campaigns
    const activateCampaignsResult = await MarketingCampaignModel.updateMany(
      {
        approvalStatus: 'APPROVED',
        status: 'SCHEDULED',
        startDate: { $lte: now },
        endDate: { $gte: now },
      },
      {
        $set: { status: 'ACTIVE' },
      }
    );

    // 4. Complete expired campaigns
    const completeCampaignsResult = await MarketingCampaignModel.updateMany(
      {
        status: 'ACTIVE',
        endDate: { $lt: now },
      },
      {
        $set: { status: 'COMPLETED' },
      }
    );

    // 5. Expire promotions
    const expirePromotionsResult = await MarketingPromotionModel.updateMany(
      {
        status: 'ACTIVE',
        endDate: { $lt: now },
      },
      {
        $set: { status: 'EXPIRED' },
      }
    );

    // 6. Publish scheduled social posts
    const duePosts = await SocialPostModel.find({
      approvalStatus: 'APPROVED',
      publishStatus: 'SCHEDULED',
      scheduledDate: { $lte: now },
    });

    let publishedPostsCount = 0;
    for (const post of duePosts) {
      post.publishStatus = 'PUBLISHED';
      post.platformVariants = post.platformVariants.map((v) => ({
        ...v,
        status: 'PUBLISHED',
        publishedAt: now,
        externalPostId: `PUB_${Date.now()}`,
      }));
      await post.save();
      publishedPostsCount++;
    }

    const report = {
      activatedBanners: activateBannersResult.modifiedCount || 0,
      expiredBanners: expireBannersResult.modifiedCount || 0,
      activatedCampaigns: activateCampaignsResult.modifiedCount || 0,
      completedCampaigns: completeCampaignsResult.modifiedCount || 0,
      expiredPromotions: expirePromotionsResult.modifiedCount || 0,
      publishedPosts: publishedPostsCount,
    };

    logger.info(`[MarketingScheduler] Completed reconciliation:`, report);
    return report;
  }
}

export default MarketingSchedulerService;
