import mongoose, { Document, Schema, Types } from 'mongoose';
import { SocialPlatform } from './SocialAccount';

export type SocialContentType =
  | 'TEXT_POST'
  | 'IMAGE_POST'
  | 'CAROUSEL'
  | 'VIDEO_POST'
  | 'REEL'
  | 'STORY'
  | 'LINK_POST'
  | 'PRODUCT_SHOWCASE'
  | 'CAMPAIGN_ANNOUNCEMENT';

export type SocialPublishStatus =
  | 'DRAFT'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'SCHEDULED'
  | 'PUBLISHING'
  | 'PUBLISHED'
  | 'FAILED'
  | 'PARTIALLY_PUBLISHED'
  | 'CANCELLED'
  | 'ARCHIVED';

export interface IPlatformVariant {
  platform: SocialPlatform;
  socialAccountId?: Types.ObjectId;
  caption: string;
  hashtags: string[];
  mediaUrls: string[];
  externalPostId?: string;
  publishedUrl?: string;
  status: 'SCHEDULED' | 'PUBLISHED' | 'FAILED' | 'SKIPPED';
  publishedAt?: Date;
  errorMessage?: string;
}

export interface ISocialPost extends Document {
  organizationId: Types.ObjectId;
  postCode: string;
  title: string;
  contentType: SocialContentType;
  campaignId?: Types.ObjectId;
  productId?: Types.ObjectId;
  categoryId?: Types.ObjectId;
  primaryCaption: string;
  hashtags: string[];
  mediaUrls: string[];
  targetUrl?: string;
  platformVariants: IPlatformVariant[];
  scheduledDate: Date;
  scheduledTime?: string;
  timeZone: string;
  approvalStatus: 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED';
  publishStatus: SocialPublishStatus;
  retryCount: number;
  lastAttemptAt?: Date;
  approvedBy?: Types.ObjectId;
  approvedAt?: Date;
  rejectionReason?: string;
  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  metrics: {
    reach: number;
    impressions: number;
    likes: number;
    comments: number;
    shares: number;
    clicks: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const PlatformVariantSchema = new Schema<IPlatformVariant>(
  {
    platform: {
      type: String,
      required: true,
      enum: ['FACEBOOK', 'INSTAGRAM', 'YOUTUBE', 'LINKEDIN', 'TIKTOK', 'X_TWITTER', 'PINTEREST'],
    },
    socialAccountId: { type: Schema.Types.ObjectId, ref: 'SocialAccount' },
    caption: { type: String, required: true },
    hashtags: [{ type: String }],
    mediaUrls: [{ type: String }],
    externalPostId: { type: String },
    publishedUrl: { type: String },
    status: {
      type: String,
      enum: ['SCHEDULED', 'PUBLISHED', 'FAILED', 'SKIPPED'],
      default: 'SCHEDULED',
    },
    publishedAt: { type: Date },
    errorMessage: { type: String },
  },
  { _id: false }
);

const SocialPostSchema = new Schema<ISocialPost>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    postCode: { type: String, required: true, unique: true, uppercase: true, trim: true },
    title: { type: String, required: true, trim: true },
    contentType: {
      type: String,
      required: true,
      enum: [
        'TEXT_POST',
        'IMAGE_POST',
        'CAROUSEL',
        'VIDEO_POST',
        'REEL',
        'STORY',
        'LINK_POST',
        'PRODUCT_SHOWCASE',
        'CAMPAIGN_ANNOUNCEMENT',
      ],
      index: true,
    },
    campaignId: { type: Schema.Types.ObjectId, ref: 'MarketingCampaign', index: true },
    productId: { type: Schema.Types.ObjectId, ref: 'Product' },
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category' },
    primaryCaption: { type: String, required: true },
    hashtags: [{ type: String }],
    mediaUrls: [{ type: String }],
    targetUrl: { type: String },
    platformVariants: [PlatformVariantSchema],
    scheduledDate: { type: Date, required: true, index: true },
    scheduledTime: { type: String, default: '10:00' },
    timeZone: { type: String, default: 'Asia/Dhaka' },
    approvalStatus: {
      type: String,
      enum: ['DRAFT', 'PENDING', 'APPROVED', 'REJECTED'],
      default: 'DRAFT',
      index: true,
    },
    publishStatus: {
      type: String,
      enum: [
        'DRAFT',
        'PENDING_APPROVAL',
        'APPROVED',
        'SCHEDULED',
        'PUBLISHING',
        'PUBLISHED',
        'FAILED',
        'PARTIALLY_PUBLISHED',
        'CANCELLED',
        'ARCHIVED',
      ],
      default: 'DRAFT',
      index: true,
    },
    retryCount: { type: Number, default: 0 },
    lastAttemptAt: { type: Date },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    approvedAt: { type: Date },
    rejectionReason: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    metrics: {
      reach: { type: Number, default: 0 },
      impressions: { type: Number, default: 0 },
      likes: { type: Number, default: 0 },
      comments: { type: Number, default: 0 },
      shares: { type: Number, default: 0 },
      clicks: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

SocialPostSchema.index({ organizationId: 1, publishStatus: 1, scheduledDate: 1 });

export const SocialPostModel = mongoose.model<ISocialPost>('SocialPost', SocialPostSchema);
export default SocialPostModel;
