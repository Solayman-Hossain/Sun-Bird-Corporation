import { Types } from 'mongoose';
import { MarketingCampaignModel, IMarketingCampaign, CampaignStatus } from '../models/MarketingCampaign';
import { MarketingPromotionModel, IMarketingPromotion } from '../models/MarketingPromotion';
import { CounterService } from './CounterService';
import { AuditLogService } from './AuditLogService';
import { ApprovalRequestModel } from '../models/ApprovalRequest';
import logger from '../config/logger';

export class MarketingCampaignService {
  /**
   * Generates sequential campaign code (CMP-2026-0001)
   */
  public static async generateCampaignCode(organizationId: Types.ObjectId | string): Promise<string> {
    const year = new Date().getFullYear();
    const counterKey = `CMP_${year}`;
    const seq = await CounterService.getNextSequence(counterKey);
    return `CMP-${year}-${String(seq).padStart(4, '0')}`;
  }

  /**
   * Generates sequential promotion code (PRM-2026-0001)
   */
  public static async generatePromotionCode(organizationId: Types.ObjectId | string): Promise<string> {
    const year = new Date().getFullYear();
    const counterKey = `PRM_${year}`;
    const seq = await CounterService.getNextSequence(counterKey);
    return `PRM-${year}-${String(seq).padStart(4, '0')}`;
  }

  /**
   * Get all campaigns with filters
   */
  public static async getCampaigns(
    organizationId: Types.ObjectId | string,
    filters: {
      status?: string;
      campaignType?: string;
      search?: string;
      limit?: number;
      skip?: number;
    } = {}
  ): Promise<{ campaigns: IMarketingCampaign[]; total: number }> {
    const query: any = { organizationId: new Types.ObjectId(String(organizationId)) };

    if (filters.status && filters.status !== 'ALL') {
      query.status = filters.status;
    }
    if (filters.campaignType && filters.campaignType !== 'ALL') {
      query.campaignType = filters.campaignType;
    }
    if (filters.search) {
      query.$or = [
        { name: { $regex: filters.search, $options: 'i' } },
        { campaignCode: { $regex: filters.search, $options: 'i' } },
        { couponCode: { $regex: filters.search, $options: 'i' } },
      ];
    }

    const limit = filters.limit || 50;
    const skip = filters.skip || 0;

    const [campaigns, total] = await Promise.all([
      MarketingCampaignModel.find(query)
        .populate('applicableProductIds', 'name sku price salePrice thumbnail')
        .populate('applicableCategoryIds', 'name slug')
        .populate('applicableBrandIds', 'name slug')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      MarketingCampaignModel.countDocuments(query),
    ]);

    return { campaigns: campaigns as any, total };
  }

  /**
   * Get single campaign by ID
   */
  public static async getCampaignById(
    organizationId: Types.ObjectId | string,
    campaignId: string
  ): Promise<IMarketingCampaign | null> {
    return MarketingCampaignModel.findOne({
      _id: new Types.ObjectId(campaignId),
      organizationId: new Types.ObjectId(String(organizationId)),
    })
      .populate('applicableProductIds', 'name sku price salePrice thumbnail')
      .populate('applicableCategoryIds', 'name slug')
      .populate('applicableBrandIds', 'name slug');
  }

  /**
   * Create a new marketing campaign
   */
  public static async createCampaign(
    organizationId: Types.ObjectId | string,
    userId: Types.ObjectId | string,
    payload: Partial<IMarketingCampaign>
  ): Promise<IMarketingCampaign> {
    const campaignCode = payload.campaignCode || (await this.generateCampaignCode(organizationId));

    const campaign = new MarketingCampaignModel({
      ...payload,
      organizationId: new Types.ObjectId(String(organizationId)),
      campaignCode,
      createdBy: new Types.ObjectId(String(userId)),
      status: payload.status || 'DRAFT',
      approvalStatus: 'DRAFT',
      metrics: {
        impressions: 0,
        clicks: 0,
        conversions: 0,
        ordersCount: 0,
        averageOrderValue: 0,
      },
    });

    await campaign.save();

    await AuditLogService.record({
      action: 'CREATE',
      targetCollection: 'MarketingCampaign',
      targetId: campaign._id as Types.ObjectId,
      actorId: new Types.ObjectId(String(userId)),
      organizationId: new Types.ObjectId(String(organizationId)),
      diff: { campaignCode, name: campaign.name, budget: campaign.budget },
      module: 'MARKETING',
    });

    return campaign;
  }

  /**
   * Update campaign details
   */
  public static async updateCampaign(
    organizationId: Types.ObjectId | string,
    userId: Types.ObjectId | string,
    campaignId: string,
    payload: Partial<IMarketingCampaign>
  ): Promise<IMarketingCampaign> {
    const campaign = await MarketingCampaignModel.findOne({
      _id: new Types.ObjectId(campaignId),
      organizationId: new Types.ObjectId(String(organizationId)),
    });

    if (!campaign) {
      throw new Error('ক্যাম্পেইন খুঁজে পাওয়া যায়নি');
    }

    Object.assign(campaign, payload, {
      updatedBy: new Types.ObjectId(String(userId)),
    });

    await campaign.save();

    await AuditLogService.record({
      action: 'UPDATE',
      targetCollection: 'MarketingCampaign',
      targetId: campaign._id as Types.ObjectId,
      actorId: new Types.ObjectId(String(userId)),
      organizationId: new Types.ObjectId(String(organizationId)),
      diff: { campaignCode: campaign.campaignCode, updatedFields: Object.keys(payload) },
      module: 'MARKETING',
    });

    return campaign;
  }

  /**
   * Submit campaign for approval (Module 03 integration)
   */
  public static async submitCampaignForApproval(
    organizationId: Types.ObjectId | string,
    userId: Types.ObjectId | string,
    campaignId: string
  ): Promise<IMarketingCampaign> {
    const campaign = await this.getCampaignById(organizationId, campaignId);
    if (!campaign) throw new Error('ক্যাম্পেইন খুঁজে পাওয়া যায়নি');

    campaign.status = 'PENDING_APPROVAL';
    campaign.approvalStatus = 'PENDING';
    await campaign.save();

    // Create approval request
    try {
      const approvalReq = new ApprovalRequestModel({
        organizationId: new Types.ObjectId(String(organizationId)),
        workflowType: 'MARKETING_CAMPAIGN',
        entityType: 'MarketingCampaign',
        entityId: campaign._id,
        entityIdentifier: campaign.campaignCode,
        requestedBy: new Types.ObjectId(String(userId)),
        title: `Campaign Approval: ${campaign.name} (${campaign.campaignCode})`,
        amount: campaign.budget,
        currency: 'BDT',
        status: 'PENDING',
        currentStep: 1,
        totalSteps: 1,
      });
      await approvalReq.save();
      campaign.approvalRequestId = approvalReq._id as Types.ObjectId;
      await campaign.save();
    } catch (err: any) {
      logger.warn(`Could not create Module 03 ApprovalRequest: ${err.message}`);
    }

    await AuditLogService.record({
      action: 'SUBMIT',
      targetCollection: 'MarketingCampaign',
      targetId: campaign._id as Types.ObjectId,
      actorId: new Types.ObjectId(String(userId)),
      organizationId: new Types.ObjectId(String(organizationId)),
      diff: { campaignCode: campaign.campaignCode },
      module: 'MARKETING',
    });

    return campaign;
  }

  /**
   * Approve or reject campaign
   */
  public static async processCampaignApproval(
    organizationId: Types.ObjectId | string,
    approverId: Types.ObjectId | string,
    campaignId: string,
    decision: 'APPROVE' | 'REJECT',
    rejectionReason?: string
  ): Promise<IMarketingCampaign> {
    const campaign = await this.getCampaignById(organizationId, campaignId);
    if (!campaign) throw new Error('ক্যাম্পেইন খুঁজে পাওয়া যায়নি');

    if (decision === 'APPROVE') {
      campaign.approvalStatus = 'APPROVED';
      const now = new Date();
      if (campaign.startDate <= now && campaign.endDate >= now) {
        campaign.status = 'ACTIVE';
      } else if (campaign.startDate > now) {
        campaign.status = 'SCHEDULED';
      } else {
        campaign.status = 'COMPLETED';
      }
      campaign.approvedBy = new Types.ObjectId(String(approverId));
      campaign.approvedAt = new Date();
    } else {
      campaign.approvalStatus = 'REJECTED';
      campaign.status = 'REJECTED';
      campaign.rejectionReason = rejectionReason;
    }

    await campaign.save();

    await AuditLogService.record({
      action: decision === 'APPROVE' ? 'APPROVE' : 'REJECT',
      targetCollection: 'MarketingCampaign',
      targetId: campaign._id as Types.ObjectId,
      actorId: new Types.ObjectId(String(approverId)),
      organizationId: new Types.ObjectId(String(organizationId)),
      diff: { campaignCode: campaign.campaignCode, decision, rejectionReason },
      module: 'MARKETING',
    });

    return campaign;
  }

  /**
   * Change campaign operational status (ACTIVATE, PAUSE, COMPLETE, CANCEL)
   */
  public static async updateCampaignStatus(
    organizationId: Types.ObjectId | string,
    userId: Types.ObjectId | string,
    campaignId: string,
    newStatus: CampaignStatus
  ): Promise<IMarketingCampaign> {
    const campaign = await this.getCampaignById(organizationId, campaignId);
    if (!campaign) throw new Error('ক্যাম্পেইন খুঁজে পাওয়া যায়নি');

    campaign.status = newStatus;
    campaign.updatedBy = new Types.ObjectId(String(userId));
    await campaign.save();

    await AuditLogService.record({
      action: 'UPDATE_STATUS',
      targetCollection: 'MarketingCampaign',
      targetId: campaign._id as Types.ObjectId,
      actorId: new Types.ObjectId(String(userId)),
      organizationId: new Types.ObjectId(String(organizationId)),
      diff: { campaignCode: campaign.campaignCode, newStatus },
      module: 'MARKETING',
    });

    return campaign;
  }

  // ── Promotions (Product, Category, Brand) ──

  /**
   * Create or update promotion rule
   */
  public static async createPromotion(
    organizationId: Types.ObjectId | string,
    userId: Types.ObjectId | string,
    payload: Partial<IMarketingPromotion>
  ): Promise<IMarketingPromotion> {
    const promotionCode = payload.promotionCode || (await this.generatePromotionCode(organizationId));

    const promotion = new MarketingPromotionModel({
      ...payload,
      organizationId: new Types.ObjectId(String(organizationId)),
      promotionCode,
      createdBy: new Types.ObjectId(String(userId)),
      status: payload.status || 'ACTIVE',
    });

    await promotion.save();

    await AuditLogService.record({
      action: 'CREATE',
      targetCollection: 'MarketingPromotion',
      targetId: promotion._id as Types.ObjectId,
      actorId: new Types.ObjectId(String(userId)),
      organizationId: new Types.ObjectId(String(organizationId)),
      diff: { promotionCode, targetType: promotion.targetType, discountValue: promotion.discountValue },
      module: 'MARKETING',
    });

    return promotion;
  }

  /**
   * Get promotions
   */
  public static async getPromotions(
    organizationId: Types.ObjectId | string,
    filters: { targetType?: string; status?: string; campaignId?: string } = {}
  ): Promise<IMarketingPromotion[]> {
    const query: any = { organizationId: new Types.ObjectId(String(organizationId)) };
    if (filters.targetType && filters.targetType !== 'ALL') query.targetType = filters.targetType;
    if (filters.status && filters.status !== 'ALL') query.status = filters.status;
    if (filters.campaignId) query.campaignId = new Types.ObjectId(filters.campaignId);

    return MarketingPromotionModel.find(query)
      .populate('productId', 'name sku price salePrice thumbnail')
      .populate('categoryId', 'name slug')
      .populate('brandId', 'name slug')
      .populate('campaignId', 'name campaignCode')
      .sort({ createdAt: -1 });
  }
}

export default MarketingCampaignService;
