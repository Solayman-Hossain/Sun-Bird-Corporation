import mongoose, { Document, Schema, Types } from 'mongoose';

export type CampaignType =
  | 'SEASONAL'
  | 'FESTIVAL'
  | 'DISCOUNT'
  | 'PRODUCT_LAUNCH'
  | 'NEW_ARRIVAL'
  | 'FLASH_SALE'
  | 'CLEARANCE_SALE'
  | 'BUNDLE_PROMOTION'
  | 'CATEGORY_PROMOTION'
  | 'BRAND_PROMOTION'
  | 'COUPON_CAMPAIGN'
  | 'SPECIAL_OFFER'
  | 'CUSTOM';

export type CampaignStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'SCHEDULED'
  | 'ACTIVE'
  | 'PAUSED'
  | 'COMPLETED'
  | 'EXPIRED'
  | 'REJECTED'
  | 'CANCELLED';

export interface IMarketingCampaign extends Document {
  organizationId: Types.ObjectId;
  campaignCode: string;
  name: string;
  campaignType: CampaignType;
  description?: string;
  bannerImageUrl?: string;
  startDate: Date;
  endDate: Date;
  startTime?: string;
  endTime?: string;
  targetAudience?: string;
  applicableProductIds: Types.ObjectId[];
  applicableCategoryIds: Types.ObjectId[];
  applicableBrandIds: Types.ObjectId[];
  applicableCustomerGroups: string[];
  budget: number;
  spentAmount: number;
  revenueGenerated: number;
  goalMetric?: string;
  landingPageSlug?: string;
  couponCode?: string;
  discountPercentage?: number;
  discountAmount?: number;
  status: CampaignStatus;
  approvalStatus: 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED';
  approvalRequestId?: Types.ObjectId;
  approvedBy?: Types.ObjectId;
  approvedAt?: Date;
  rejectionReason?: string;
  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  metrics: {
    impressions: number;
    clicks: number;
    conversions: number;
    ordersCount: number;
    averageOrderValue: number;
  };
  utmParameters?: {
    source?: string;
    medium?: string;
    campaign?: string;
    content?: string;
  };
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const MarketingCampaignSchema = new Schema<IMarketingCampaign>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    campaignCode: { type: String, required: true, unique: true, uppercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    campaignType: {
      type: String,
      required: true,
      enum: [
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
      ],
      index: true,
    },
    description: { type: String, trim: true },
    bannerImageUrl: { type: String },
    startDate: { type: Date, required: true, index: true },
    endDate: { type: Date, required: true, index: true },
    startTime: { type: String, default: '00:00' },
    endTime: { type: String, default: '23:59' },
    targetAudience: { type: String, default: 'ALL' },
    applicableProductIds: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
    applicableCategoryIds: [{ type: Schema.Types.ObjectId, ref: 'Category' }],
    applicableBrandIds: [{ type: Schema.Types.ObjectId, ref: 'Brand' }],
    applicableCustomerGroups: [{ type: String }],
    budget: { type: Number, default: 0, min: 0 },
    spentAmount: { type: Number, default: 0, min: 0 },
    revenueGenerated: { type: Number, default: 0, min: 0 },
    goalMetric: { type: String, default: 'SALES_VOLUME' },
    landingPageSlug: { type: String, trim: true },
    couponCode: { type: String, uppercase: true, trim: true },
    discountPercentage: { type: Number, min: 0, max: 100 },
    discountAmount: { type: Number, min: 0 },
    status: {
      type: String,
      enum: [
        'DRAFT',
        'SUBMITTED',
        'PENDING_APPROVAL',
        'APPROVED',
        'SCHEDULED',
        'ACTIVE',
        'PAUSED',
        'COMPLETED',
        'EXPIRED',
        'REJECTED',
        'CANCELLED',
      ],
      default: 'DRAFT',
      index: true,
    },
    approvalStatus: {
      type: String,
      enum: ['DRAFT', 'PENDING', 'APPROVED', 'REJECTED'],
      default: 'DRAFT',
      index: true,
    },
    approvalRequestId: { type: Schema.Types.ObjectId, ref: 'ApprovalRequest' },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    approvedAt: { type: Date },
    rejectionReason: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    metrics: {
      impressions: { type: Number, default: 0 },
      clicks: { type: Number, default: 0 },
      conversions: { type: Number, default: 0 },
      ordersCount: { type: Number, default: 0 },
      averageOrderValue: { type: Number, default: 0 },
    },
    utmParameters: {
      source: { type: String, default: 'direct' },
      medium: { type: String, default: 'web' },
      campaign: { type: String },
      content: { type: String },
    },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

MarketingCampaignSchema.index({ organizationId: 1, status: 1, campaignType: 1 });
MarketingCampaignSchema.index({ startDate: 1, endDate: 1, status: 1 });

export const MarketingCampaignModel = mongoose.model<IMarketingCampaign>('MarketingCampaign', MarketingCampaignSchema);
export default MarketingCampaignModel;
