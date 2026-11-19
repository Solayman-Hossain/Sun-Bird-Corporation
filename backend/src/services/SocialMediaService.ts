import { Types } from 'mongoose';
import { SocialAccountModel, ISocialAccount, SocialPlatform } from '../models/SocialAccount';
import { SocialPostModel, ISocialPost, SocialPublishStatus } from '../models/SocialPost';
import { MarketingCampaignModel } from '../models/MarketingCampaign';
import { CounterService } from './CounterService';
import { AuditLogService } from './AuditLogService';
import logger from '../config/logger';

export class SocialMediaService {
  /**
   * Generates sequential social post code (SOC-2026-0001)
   */
  public static async generatePostCode(organizationId: Types.ObjectId | string): Promise<string> {
    const year = new Date().getFullYear();
    const counterKey = `SOC_${year}`;
    const seq = await CounterService.getNextSequence(counterKey);
    return `SOC-${year}-${String(seq).padStart(4, '0')}`;
  }

  // ── Social Accounts ──

  public static async getSocialAccounts(
    organizationId: Types.ObjectId | string
  ): Promise<ISocialAccount[]> {
    return SocialAccountModel.find({ organizationId: new Types.ObjectId(String(organizationId)) }).sort({ platform: 1 });
  }

  public static async connectSocialAccount(
    organizationId: Types.ObjectId | string,
    userId: Types.ObjectId | string,
    payload: {
      platform: SocialPlatform;
      accountName: string;
      accountHandle?: string;
      externalAccountId?: string;
      pageId?: string;
      profileUrl?: string;
      avatarUrl?: string;
    }
  ): Promise<ISocialAccount> {
    const orgId = new Types.ObjectId(String(organizationId));

    let account = await SocialAccountModel.findOne({
      organizationId: orgId,
      platform: payload.platform,
    });

    if (account) {
      Object.assign(account, payload, {
        isConnected: true,
        status: 'ACTIVE',
        connectedAt: new Date(),
        connectedBy: new Types.ObjectId(String(userId)),
        lastSyncedAt: new Date(),
      });
      await account.save();
    } else {
      account = new SocialAccountModel({
        ...payload,
        organizationId: orgId,
        isConnected: true,
        status: 'ACTIVE',
        connectedAt: new Date(),
        connectedBy: new Types.ObjectId(String(userId)),
        lastSyncedAt: new Date(),
        metrics: {
          followersCount: 1250,
          postsCount: 48,
          engagementRate: 3.8,
        },
      });
      await account.save();
    }

    await AuditLogService.record({
      action: 'CONNECT_ACCOUNT',
      targetCollection: 'SocialAccount',
      targetId: account._id as Types.ObjectId,
      actorId: new Types.ObjectId(String(userId)),
      organizationId: orgId,
      diff: { platform: payload.platform, accountName: payload.accountName },
      module: 'MARKETING',
    });

    return account;
  }

  public static async disconnectSocialAccount(
    organizationId: Types.ObjectId | string,
    userId: Types.ObjectId | string,
    accountId: string
  ): Promise<ISocialAccount> {
    const account = await SocialAccountModel.findOne({
      _id: new Types.ObjectId(accountId),
      organizationId: new Types.ObjectId(String(organizationId)),
    });

    if (!account) throw new Error('সোশ্যাল অ্যাকাউন্ট পাওয়া যায়নি');

    account.isConnected = false;
    account.status = 'DISCONNECTED';
    await account.save();

    await AuditLogService.record({
      action: 'DISCONNECT_ACCOUNT',
      targetCollection: 'SocialAccount',
      targetId: account._id as Types.ObjectId,
      actorId: new Types.ObjectId(String(userId)),
      organizationId: new Types.ObjectId(String(organizationId)),
      diff: { platform: account.platform, accountName: account.accountName },
      module: 'MARKETING',
    });

    return account;
  }

  // ── Social Posts ──

  public static async getSocialPosts(
    organizationId: Types.ObjectId | string,
    filters: {
      publishStatus?: string;
      platform?: string;
      campaignId?: string;
      limit?: number;
      skip?: number;
    } = {}
  ): Promise<{ posts: ISocialPost[]; total: number }> {
    const query: any = { organizationId: new Types.ObjectId(String(organizationId)) };

    if (filters.publishStatus && filters.publishStatus !== 'ALL') {
      query.publishStatus = filters.publishStatus;
    }
    if (filters.campaignId) {
      query.campaignId = new Types.ObjectId(filters.campaignId);
    }
    if (filters.platform && filters.platform !== 'ALL') {
      query['platformVariants.platform'] = filters.platform;
    }

    const limit = filters.limit || 50;
    const skip = filters.skip || 0;

    const [posts, total] = await Promise.all([
      SocialPostModel.find(query)
        .populate('campaignId', 'name campaignCode')
        .populate('productId', 'name sku thumbnail')
        .sort({ scheduledDate: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      SocialPostModel.countDocuments(query),
    ]);

    return { posts: posts as any, total };
  }

  public static async createSocialPost(
    organizationId: Types.ObjectId | string,
    userId: Types.ObjectId | string,
    payload: Partial<ISocialPost>
  ): Promise<ISocialPost> {
    const postCode = payload.postCode || (await this.generatePostCode(organizationId));

    const post = new SocialPostModel({
      ...payload,
      organizationId: new Types.ObjectId(String(organizationId)),
      postCode,
      createdBy: new Types.ObjectId(String(userId)),
      publishStatus: payload.publishStatus || 'DRAFT',
      approvalStatus: payload.approvalStatus || 'DRAFT',
      retryCount: 0,
      metrics: {
        reach: 0,
        impressions: 0,
        likes: 0,
        comments: 0,
        shares: 0,
        clicks: 0,
      },
    });

    await post.save();

    await AuditLogService.record({
      action: 'CREATE',
      targetCollection: 'SocialPost',
      targetId: post._id as Types.ObjectId,
      actorId: new Types.ObjectId(String(userId)),
      organizationId: new Types.ObjectId(String(organizationId)),
      diff: { postCode, title: post.title },
      module: 'MARKETING',
    });

    return post;
  }

  public static async updateSocialPost(
    organizationId: Types.ObjectId | string,
    userId: Types.ObjectId | string,
    postId: string,
    payload: Partial<ISocialPost>
  ): Promise<ISocialPost> {
    const post = await SocialPostModel.findOne({
      _id: new Types.ObjectId(postId),
      organizationId: new Types.ObjectId(String(organizationId)),
    });

    if (!post) throw new Error('পোস্ট খুঁজে পাওয়া যায়নি');

    Object.assign(post, payload, { updatedBy: new Types.ObjectId(String(userId)) });
    await post.save();

    await AuditLogService.record({
      action: 'UPDATE',
      targetCollection: 'SocialPost',
      targetId: post._id as Types.ObjectId,
      actorId: new Types.ObjectId(String(userId)),
      organizationId: new Types.ObjectId(String(organizationId)),
      diff: { postCode: post.postCode, updatedFields: Object.keys(payload) },
      module: 'MARKETING',
    });

    return post;
  }

  /**
   * Publish or simulate immediate publishing of a social post across all configured platforms
   */
  public static async publishSocialPost(
    organizationId: Types.ObjectId | string,
    userId: Types.ObjectId | string,
    postId: string
  ): Promise<ISocialPost> {
    const post = await SocialPostModel.findOne({
      _id: new Types.ObjectId(postId),
      organizationId: new Types.ObjectId(String(organizationId)),
    });

    if (!post) throw new Error('পোস্ট খুঁজে পাওয়া যায়নি');

    post.publishStatus = 'PUBLISHING';
    post.lastAttemptAt = new Date();
    await post.save();

    // Execute platform variants
    const now = new Date();
    let anyPublished = false;

    post.platformVariants = post.platformVariants.map((variant) => {
      // Simulate real external posting response
      const externalId = `EXT_${variant.platform.slice(0, 2)}_${Date.now()}`;
      anyPublished = true;
      return {
        ...variant,
        externalPostId: externalId,
        publishedUrl: `https://${variant.platform.toLowerCase()}.com/sunbirdcorp/posts/${externalId}`,
        status: 'PUBLISHED' as const,
        publishedAt: now,
      };
    });

    post.publishStatus = anyPublished ? 'PUBLISHED' : 'FAILED';
    post.approvalStatus = 'APPROVED';
    post.updatedBy = new Types.ObjectId(String(userId));
    await post.save();

    await AuditLogService.record({
      action: 'PUBLISH',
      targetCollection: 'SocialPost',
      targetId: post._id as Types.ObjectId,
      actorId: new Types.ObjectId(String(userId)),
      organizationId: new Types.ObjectId(String(organizationId)),
      diff: { postCode: post.postCode, publishStatus: post.publishStatus },
      module: 'MARKETING',
    });

    return post;
  }

  /**
   * Calendar view aggregator: Combines campaigns, banners, and social posts into a unified calendar dataset
   */
  public static async getMarketingCalendar(
    organizationId: Types.ObjectId | string,
    filters: { year?: number; month?: number } = {}
  ): Promise<any[]> {
    const orgId = new Types.ObjectId(String(organizationId));
    const now = new Date();
    const year = filters.year || now.getFullYear();
    const month = filters.month || now.getMonth() + 1;

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const [posts, campaigns] = await Promise.all([
      SocialPostModel.find({
        organizationId: orgId,
        scheduledDate: { $gte: startDate, $lte: endDate },
      }).select('postCode title contentType scheduledDate publishStatus platformVariants').lean(),
      MarketingCampaignModel.find({
        organizationId: orgId,
        $or: [
          { startDate: { $gte: startDate, $lte: endDate } },
          { endDate: { $gte: startDate, $lte: endDate } },
        ],
      }).select('campaignCode name campaignType startDate endDate status budget').lean(),
    ]);

    const calendarItems: any[] = [];

    posts.forEach((p: any) => {
      calendarItems.push({
        id: String(p._id),
        type: 'SOCIAL_POST',
        code: p.postCode,
        title: p.title,
        date: p.scheduledDate,
        status: p.publishStatus,
        details: p.contentType,
      });
    });

    campaigns.forEach((c: any) => {
      calendarItems.push({
        id: String(c._id),
        type: 'CAMPAIGN_START',
        code: c.campaignCode,
        title: `[Start] ${c.name}`,
        date: c.startDate,
        status: c.status,
        details: c.campaignType,
      });
      calendarItems.push({
        id: String(c._id),
        type: 'CAMPAIGN_END',
        code: c.campaignCode,
        title: `[End] ${c.name}`,
        date: c.endDate,
        status: c.status,
        details: c.campaignType,
      });
    });

    return calendarItems.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }
}

export default SocialMediaService;
