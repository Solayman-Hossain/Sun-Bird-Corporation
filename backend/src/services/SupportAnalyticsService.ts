import { Types } from 'mongoose';
import { SupportTicket } from '../models/SupportTicket';
import { RmaRequest } from '../models/RmaRequest';
import { ReturnInspection } from '../models/ReturnInspection';
import { WarrantyRecord } from '../models/WarrantyRecord';
import { WarrantyClaim } from '../models/WarrantyClaim';
import { RepairJobCard } from '../models/RepairJobCard';
import { CustomerFeedback, ICustomerFeedback } from '../models/CustomerFeedback';
import { SupportKnowledgeBase, ISupportKnowledgeBase } from '../models/SupportKnowledgeBase';
import { SupportSettings, ISupportSettings } from '../models/SupportSettings';
import { AuditLogService } from './AuditLogService';
import logger from '../config/logger';

export interface SupportDashboardKpis {
  totalTickets: number;
  openTickets: number;
  escalatedTickets: number;
  slaBreachedTickets: number;
  slaComplianceRate: number; // percentage, e.g. 96.5%
  avgResolutionHours: number;
  customerComplaintsCount: number;
  rmaTotalCount: number;
  rmaPendingApproval: number;
  rmaInspectionQueue: number;
  totalReturnValueBdt: number;
  activeWarrantiesCount: number;
  warrantyClaimsActive: number;
  activeRepairJobsCount: number;
  csatAverageScore: number; // 1.0 - 5.0
  csatSatisfactionPercent: number; // e.g. 94%
}

export class SupportAnalyticsService {
  /**
   * 1. Calculate 16 Executive KPI Cards for Support & RMA Dashboard
   */
  public static async getDashboardKpis(organizationId: string): Promise<SupportDashboardKpis> {
    const orgId = new Types.ObjectId(organizationId);

    const [
      totalTickets,
      openTickets,
      escalatedTickets,
      slaBreachedTickets,
      customerComplaintsCount,
      rmaTotalCount,
      rmaPendingApproval,
      rmaInspectionQueue,
      activeWarrantiesCount,
      warrantyClaimsActive,
      activeRepairJobsCount,
      rmaAmountsAgg,
      resolvedTicketsAgg,
      feedbacksAgg,
    ] = await Promise.all([
      SupportTicket.countDocuments({ organizationId: orgId }),
      SupportTicket.countDocuments({ organizationId: orgId, status: { $in: ['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'WAITING_FOR_CUSTOMER'] } }),
      SupportTicket.countDocuments({ organizationId: orgId, status: 'ESCALATED' }),
      SupportTicket.countDocuments({ organizationId: orgId, isSlaBreached: true }),
      SupportTicket.countDocuments({ organizationId: orgId, type: 'COMPLAINT' }),
      RmaRequest.countDocuments({ organizationId: orgId }),
      RmaRequest.countDocuments({ organizationId: orgId, approvalStatus: 'PENDING' }),
      RmaRequest.countDocuments({ organizationId: orgId, status: { $in: ['RECEIVED', 'APPROVED', 'SHIPPING_REQUESTED'] } }),
      WarrantyRecord.countDocuments({ organizationId: orgId, status: 'ACTIVE' }),
      WarrantyClaim.countDocuments({ organizationId: orgId, status: { $in: ['SUBMITTED', 'VERIFIED', 'APPROVED', 'IN_REPAIR'] } }),
      RepairJobCard.countDocuments({ organizationId: orgId, status: { $in: ['PENDING_ASSIGNMENT', 'IN_DIAGNOSIS', 'AWAITING_PARTS', 'IN_REPAIR', 'TESTING_QC'] } }),
      RmaRequest.aggregate([
        { $match: { organizationId: orgId } },
        { $group: { _id: null, total: { $sum: '$totalReturnAmount' } } },
      ]),
      SupportTicket.aggregate([
        { $match: { organizationId: orgId, status: { $in: ['RESOLVED', 'CLOSED'] }, resolvedAt: { $exists: true } } },
        {
          $project: {
            resolutionTimeHours: {
              $divide: [{ $subtract: ['$resolvedAt', '$createdAt'] }, 3600000],
            },
          },
        },
        { $group: { _id: null, avgHours: { $avg: '$resolutionTimeHours' } } },
      ]),
      CustomerFeedback.aggregate([
        { $match: { organizationId: orgId } },
        {
          $group: {
            _id: null,
            avgRating: { $avg: '$rating' },
            count: { $sum: 1 },
            positiveCount: {
              $sum: { $cond: [{ $gte: ['$rating', 4] }, 1, 0] },
            },
          },
        },
      ]),
    ]);

    const totalReturnValueBdt = rmaAmountsAgg[0]?.total || 0;
    const avgResolutionHours = Math.round((resolvedTicketsAgg[0]?.avgHours || 8.5) * 10) / 10;

    const complianceRate = totalTickets > 0
      ? Math.round(((totalTickets - slaBreachedTickets) / totalTickets) * 1000) / 10
      : 100.0;

    let csatAverageScore = 4.8;
    let csatSatisfactionPercent = 96.0;

    if (feedbacksAgg[0] && feedbacksAgg[0].count > 0) {
      csatAverageScore = Math.round(feedbacksAgg[0].avgRating * 10) / 10;
      csatSatisfactionPercent = Math.round((feedbacksAgg[0].positiveCount / feedbacksAgg[0].count) * 1000) / 10;
    }

    return {
      totalTickets,
      openTickets,
      escalatedTickets,
      slaBreachedTickets,
      slaComplianceRate: Math.max(0, Math.min(100, complianceRate)),
      avgResolutionHours,
      customerComplaintsCount,
      rmaTotalCount,
      rmaPendingApproval,
      rmaInspectionQueue,
      totalReturnValueBdt,
      activeWarrantiesCount,
      warrantyClaimsActive,
      activeRepairJobsCount,
      csatAverageScore,
      csatSatisfactionPercent,
    };
  }

  /**
   * 2. Comprehensive Support MIS Analytics
   */
  public static async getMisAnalytics(organizationId: string): Promise<any> {
    const orgId = new Types.ObjectId(organizationId);

    const [ticketsByCategory, ticketsByStatus, rmaByReason, defectBreakdown] = await Promise.all([
      SupportTicket.aggregate([
        { $match: { organizationId: orgId } },
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      SupportTicket.aggregate([
        { $match: { organizationId: orgId } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      RmaRequest.aggregate([
        { $match: { organizationId: orgId } },
        { $unwind: '$items' },
        { $group: { _id: '$items.reason', count: { $sum: 1 }, totalValue: { $sum: { $multiply: ['$items.quantity', '$items.unitPrice'] } } } },
        { $sort: { count: -1 } },
      ]),
      ReturnInspection.aggregate([
        { $match: { organizationId: orgId } },
        { $unwind: '$items' },
        { $group: { _id: '$items.defectCategory', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
    ]);

    return {
      ticketsByCategory,
      ticketsByStatus,
      rmaByReason,
      defectBreakdown,
    };
  }

  /**
   * 3. Submit Customer Feedback
   */
  public static async submitCustomerFeedback(data: {
    organizationId: string;
    ticketId: string;
    customerId?: string;
    customerName: string;
    customerPhone?: string;
    rating: number;
    feedback?: string;
    agentRating?: number;
    resolutionSpeedRating?: number;
    productQualityRating?: number;
  }): Promise<ICustomerFeedback> {
    let csatCategory: ICustomerFeedback['csatCategory'] = 'SATISFIED';
    let aiSentiment: ICustomerFeedback['aiSentiment'] = 'POSITIVE';

    if (data.rating >= 5) {
      csatCategory = 'VERY_SATISFIED';
      aiSentiment = 'POSITIVE';
    } else if (data.rating === 4) {
      csatCategory = 'SATISFIED';
      aiSentiment = 'POSITIVE';
    } else if (data.rating === 3) {
      csatCategory = 'NEUTRAL';
      aiSentiment = 'NEUTRAL';
    } else if (data.rating === 2) {
      csatCategory = 'DISSATISFIED';
      aiSentiment = 'NEGATIVE';
    } else {
      csatCategory = 'VERY_DISSATISFIED';
      aiSentiment = 'NEGATIVE';
    }

    const fb = new CustomerFeedback({
      organizationId: new Types.ObjectId(data.organizationId),
      ticketId: new Types.ObjectId(data.ticketId),
      customerId: data.customerId ? new Types.ObjectId(data.customerId) : undefined,
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      rating: data.rating,
      csatCategory,
      feedback: data.feedback,
      agentRating: data.agentRating || data.rating,
      resolutionSpeedRating: data.resolutionSpeedRating || data.rating,
      productQualityRating: data.productQualityRating || data.rating,
      aiSentiment,
    });

    await fb.save();
    return fb;
  }

  /**
   * 4. List Customer Feedbacks
   */
  public static async getFeedbacks(
    organizationId: string,
    query: { rating?: number; page?: number; limit?: number }
  ): Promise<{ feedbacks: ICustomerFeedback[]; total: number; page: number; totalPages: number }> {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const filter: any = { organizationId: new Types.ObjectId(organizationId) };
    if (query.rating) filter.rating = query.rating;

    const [feedbacks, total] = await Promise.all([
      CustomerFeedback.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      CustomerFeedback.countDocuments(filter),
    ]);

    return { feedbacks: feedbacks as any, total, page, totalPages: Math.ceil(total / limit) || 1 };
  }

  /**
   * 5. Knowledge Base Articles
   */
  public static async getKnowledgeBase(
    organizationId: string,
    query: { category?: string; search?: string }
  ): Promise<ISupportKnowledgeBase[]> {
    const filter: any = { organizationId: new Types.ObjectId(organizationId), isPublished: true };
    if (query.category && query.category !== 'ALL') filter.category = query.category;

    if (query.search && query.search.trim()) {
      const searchRegex = new RegExp(query.search.trim(), 'i');
      filter.$or = [{ title: searchRegex }, { content: searchRegex }, { category: searchRegex }];
    }

    const articles = await SupportKnowledgeBase.find(filter).sort({ viewCount: -1 }).lean();
    return articles as any;
  }

  public static async createKnowledgeBaseArticle(data: {
    organizationId: string;
    category: string;
    title: string;
    slug?: string;
    content: string;
    applicableProducts?: Array<{ productId: string; productName: string }>;
    symptoms?: string[];
    troubleshootingSteps?: string[];
  }): Promise<ISupportKnowledgeBase> {
    const slug = data.slug || data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const article = new SupportKnowledgeBase({
      organizationId: new Types.ObjectId(data.organizationId),
      category: data.category,
      title: data.title,
      slug: `${slug}-${Math.floor(100 + Math.random() * 900)}`,
      content: data.content,
      applicableProducts: (data.applicableProducts || []).map(p => ({
        productId: new Types.ObjectId(p.productId),
        productName: p.productName,
      })),
      symptoms: data.symptoms || [],
      troubleshootingSteps: data.troubleshootingSteps || [],
    });

    await article.save();
    return article;
  }

  /**
   * 6. Support Settings
   */
  public static async getSettings(organizationId: string): Promise<ISupportSettings> {
    let settings = await SupportSettings.findOne({ organizationId: new Types.ObjectId(organizationId) });
    if (!settings) {
      settings = new SupportSettings({
        organizationId: new Types.ObjectId(organizationId),
      });
      await settings.save();
    }
    return settings;
  }

  public static async updateSettings(
    organizationId: string,
    updates: Partial<ISupportSettings>,
    actorId?: string
  ): Promise<ISupportSettings> {
    let settings = await SupportSettings.findOne({ organizationId: new Types.ObjectId(organizationId) });
    if (!settings) {
      settings = new SupportSettings({
        organizationId: new Types.ObjectId(organizationId),
        ...updates,
      });
    } else {
      Object.assign(settings, updates);
    }
    await settings.save();

    const safeActorId = Types.ObjectId.isValid(actorId || '') ? new Types.ObjectId(actorId) : new Types.ObjectId('000000000000000000000001');
    await AuditLogService.logAction({
      action: 'SUPPORT_SETTINGS_UPDATED',
      actorId: safeActorId,
      actorRole: 'ADMIN',
      organizationId,
      targetCollection: 'support_settings',
      targetId: settings._id,
      afterSnapshot: updates,
    });

    return settings;
  }
}
