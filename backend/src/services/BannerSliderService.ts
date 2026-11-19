import { Types } from 'mongoose';
import { WebsiteBannerModel, IWebsiteBanner, BannerType, BannerStatus } from '../models/WebsiteBanner';
import { CounterService } from './CounterService';
import { AuditLogService } from './AuditLogService';
import logger from '../config/logger';

export class BannerSliderService {
  /**
   * Generates sequential banner code (BNR-2026-0001)
   */
  public static async generateBannerCode(organizationId: Types.ObjectId | string): Promise<string> {
    const year = new Date().getFullYear();
    const counterKey = `BNR_${year}`;
    const seq = await CounterService.getNextSequence(counterKey);
    return `BNR-${year}-${String(seq).padStart(4, '0')}`;
  }

  /**
   * Get all banners for admin ERP management
   */
  public static async getBanners(
    organizationId: Types.ObjectId | string,
    filters: {
      bannerType?: string;
      status?: string;
      search?: string;
      limit?: number;
      skip?: number;
    } = {}
  ): Promise<{ banners: IWebsiteBanner[]; total: number }> {
    const query: any = { organizationId: new Types.ObjectId(String(organizationId)) };

    if (filters.bannerType && filters.bannerType !== 'ALL') {
      query.bannerType = filters.bannerType;
    }
    if (filters.status && filters.status !== 'ALL') {
      query.status = filters.status;
    }
    if (filters.search) {
      query.$or = [
        { name: { $regex: filters.search, $options: 'i' } },
        { title: { $regex: filters.search, $options: 'i' } },
        { bannerCode: { $regex: filters.search, $options: 'i' } },
      ];
    }

    const limit = filters.limit || 50;
    const skip = filters.skip || 0;

    const [banners, total] = await Promise.all([
      WebsiteBannerModel.find(query).sort({ displayOrder: 1, createdAt: -1 }).skip(skip).limit(limit).lean(),
      WebsiteBannerModel.countDocuments(query),
    ]);

    return { banners: banners as any, total };
  }

  /**
   * Get single banner by ID
   */
  public static async getBannerById(
    organizationId: Types.ObjectId | string,
    bannerId: string
  ): Promise<IWebsiteBanner | null> {
    return WebsiteBannerModel.findOne({
      _id: new Types.ObjectId(bannerId),
      organizationId: new Types.ObjectId(String(organizationId)),
    });
  }

  /**
   * Create a new website banner / slider / popup / announcement
   */
  public static async createBanner(
    organizationId: Types.ObjectId | string,
    userId: Types.ObjectId | string,
    payload: Partial<IWebsiteBanner>
  ): Promise<IWebsiteBanner> {
    const bannerCode = payload.bannerCode || (await this.generateBannerCode(organizationId));

    const banner = new WebsiteBannerModel({
      ...payload,
      organizationId: new Types.ObjectId(String(organizationId)),
      bannerCode,
      createdBy: new Types.ObjectId(String(userId)),
      status: payload.status || 'DRAFT',
      approvalStatus: payload.approvalStatus || 'DRAFT',
      displayOrder: payload.displayOrder ?? 0,
      clickCount: 0,
      impressionCount: 0,
    });

    await banner.save();

    await AuditLogService.record({
      action: 'CREATE',
      targetCollection: 'WebsiteBanner',
      targetId: banner._id as Types.ObjectId,
      actorId: new Types.ObjectId(String(userId)),
      organizationId: new Types.ObjectId(String(organizationId)),
      diff: { bannerCode, name: banner.name, type: banner.bannerType },
      module: 'MARKETING',
    });

    return banner;
  }

  /**
   * Update existing banner
   */
  public static async updateBanner(
    organizationId: Types.ObjectId | string,
    userId: Types.ObjectId | string,
    bannerId: string,
    payload: Partial<IWebsiteBanner>
  ): Promise<IWebsiteBanner> {
    const banner = await WebsiteBannerModel.findOne({
      _id: new Types.ObjectId(bannerId),
      organizationId: new Types.ObjectId(String(organizationId)),
    });

    if (!banner) throw new Error('ব্যানার খুঁজে পাওয়া যায়নি');

    Object.assign(banner, payload, {
      updatedBy: new Types.ObjectId(String(userId)),
    });

    await banner.save();

    await AuditLogService.record({
      action: 'UPDATE',
      targetCollection: 'WebsiteBanner',
      targetId: banner._id as Types.ObjectId,
      actorId: new Types.ObjectId(String(userId)),
      organizationId: new Types.ObjectId(String(organizationId)),
      diff: { bannerCode: banner.bannerCode, updatedFields: Object.keys(payload) },
      module: 'MARKETING',
    });

    return banner;
  }

  /**
   * Approve and publish banner
   */
  public static async publishBanner(
    organizationId: Types.ObjectId | string,
    userId: Types.ObjectId | string,
    bannerId: string
  ): Promise<IWebsiteBanner> {
    const banner = await this.getBannerById(organizationId, bannerId);
    if (!banner) throw new Error('ব্যানার খুঁজে পাওয়া যায়নি');

    banner.approvalStatus = 'APPROVED';
    banner.status = 'PUBLISHED';
    banner.isActive = true;
    banner.approvedBy = new Types.ObjectId(String(userId));
    banner.approvedAt = new Date();
    banner.updatedBy = new Types.ObjectId(String(userId));
    await banner.save();

    await AuditLogService.record({
      action: 'PUBLISH',
      targetCollection: 'WebsiteBanner',
      targetId: banner._id as Types.ObjectId,
      actorId: new Types.ObjectId(String(userId)),
      organizationId: new Types.ObjectId(String(organizationId)),
      diff: { bannerCode: banner.bannerCode, status: 'PUBLISHED' },
      module: 'MARKETING',
    });

    return banner;
  }

  /**
   * Unpublish / archive banner
   */
  public static async unpublishBanner(
    organizationId: Types.ObjectId | string,
    userId: Types.ObjectId | string,
    bannerId: string
  ): Promise<IWebsiteBanner> {
    const banner = await this.getBannerById(organizationId, bannerId);
    if (!banner) throw new Error('ব্যানার খুঁজে পাওয়া যায়নি');

    banner.status = 'DRAFT';
    banner.isActive = false;
    banner.updatedBy = new Types.ObjectId(String(userId));
    await banner.save();

    await AuditLogService.record({
      action: 'UNPUBLISH',
      targetCollection: 'WebsiteBanner',
      targetId: banner._id as Types.ObjectId,
      actorId: new Types.ObjectId(String(userId)),
      organizationId: new Types.ObjectId(String(organizationId)),
      diff: { bannerCode: banner.bannerCode, status: 'DRAFT' },
      module: 'MARKETING',
    });

    return banner;
  }

  /**
   * Reorder banners or slider slides
   */
  public static async reorderBanners(
    organizationId: Types.ObjectId | string,
    userId: Types.ObjectId | string,
    items: Array<{ id: string; displayOrder: number }>
  ): Promise<void> {
    const orgId = new Types.ObjectId(String(organizationId));
    const updates = items.map((item) =>
      WebsiteBannerModel.updateOne(
        { _id: new Types.ObjectId(item.id), organizationId: orgId },
        { $set: { displayOrder: item.displayOrder, updatedBy: new Types.ObjectId(String(userId)) } }
      )
    );
    await Promise.all(updates);
  }

  /**
   * Public Query: Returns ONLY approved, active, currently scheduled banners
   * Strips all internal metadata and guarantees zero leak of drafts or unapproved content.
   */
  public static async getPublicActiveBanners(
    organizationId?: string,
    bannerType?: BannerType
  ): Promise<any[]> {
    const now = new Date();
    const query: any = {
      status: 'PUBLISHED',
      approvalStatus: 'APPROVED',
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now },
    };

    if (organizationId) {
      query.organizationId = new Types.ObjectId(organizationId);
    }
    if (bannerType) {
      query.bannerType = bannerType;
    }

    const banners = await WebsiteBannerModel.find(query)
      .select('bannerCode name bannerType title subtitle description imageUrl mobileImageUrl desktopImageUrl buttonText buttonLink targetUrl displayPosition displayOrder backgroundColor textColor textPosition buttonStyle sliderSettings popupSettings announcementSettings')
      .sort({ displayOrder: 1, createdAt: -1 })
      .lean();

    return banners;
  }

  /**
   * Increment click count (public beacon)
   */
  public static async trackBannerClick(bannerId: string): Promise<void> {
    if (!Types.ObjectId.isValid(bannerId)) return;
    await WebsiteBannerModel.updateOne({ _id: new Types.ObjectId(bannerId) }, { $inc: { clickCount: 1 } });
  }
}

export default BannerSliderService;
