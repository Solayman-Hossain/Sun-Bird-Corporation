import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IContentTemplate {
  templateId: string;
  name: string;
  templateType: 'BANNER' | 'SLIDER' | 'CAMPAIGN' | 'LANDING_PAGE' | 'SOCIAL_POST' | 'POPUP' | 'ANNOUNCEMENT';
  layoutConfig: Record<string, any>;
  defaultText?: Record<string, string>;
  defaultImages?: string[];
  defaultColors?: Record<string, string>;
  createdAt: Date;
}

export interface IMarketingSettings extends Document {
  organizationId: Types.ObjectId;
  defaultTimeZone: string;
  requireApprovalForBanners: boolean;
  requireApprovalForCampaigns: boolean;
  requireApprovalForSocialPosts: boolean;
  autoExpirePromotions: boolean;
  defaultLanguage: 'bn' | 'en';
  defaultWebsiteUrl: string;
  socialPlatformsConfig: {
    facebookEnabled: boolean;
    instagramEnabled: boolean;
    linkedinEnabled: boolean;
    youtubeEnabled: boolean;
    xTwitterEnabled: boolean;
  };
  seoDefaults: {
    siteName: string;
    titleTemplate: string;
    defaultMetaDescription: string;
    defaultOgImageUrl: string;
    robotsIndex: boolean;
    robotsFollow: boolean;
    canonicalDomain: string;
  };
  mediaSettings: {
    maxFileSizeMb: number;
    allowedMimeTypes: string[];
    defaultStorageBucket: string;
  };
  templates: IContentTemplate[];
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ContentTemplateSchema = new Schema<IContentTemplate>(
  {
    templateId: { type: String, required: true },
    name: { type: String, required: true },
    templateType: {
      type: String,
      required: true,
      enum: ['BANNER', 'SLIDER', 'CAMPAIGN', 'LANDING_PAGE', 'SOCIAL_POST', 'POPUP', 'ANNOUNCEMENT'],
    },
    layoutConfig: { type: Schema.Types.Mixed, default: {} },
    defaultText: { type: Schema.Types.Mixed, default: {} },
    defaultImages: [{ type: String }],
    defaultColors: { type: Schema.Types.Mixed, default: {} },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const MarketingSettingsSchema = new Schema<IMarketingSettings>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, unique: true, index: true },
    defaultTimeZone: { type: String, default: 'Asia/Dhaka' },
    requireApprovalForBanners: { type: Boolean, default: false },
    requireApprovalForCampaigns: { type: Boolean, default: true },
    requireApprovalForSocialPosts: { type: Boolean, default: false },
    autoExpirePromotions: { type: Boolean, default: true },
    defaultLanguage: { type: String, enum: ['bn', 'en'], default: 'bn' },
    defaultWebsiteUrl: { type: String, default: 'http://localhost:3000' },
    socialPlatformsConfig: {
      facebookEnabled: { type: Boolean, default: true },
      instagramEnabled: { type: Boolean, default: true },
      linkedinEnabled: { type: Boolean, default: true },
      youtubeEnabled: { type: Boolean, default: true },
      xTwitterEnabled: { type: Boolean, default: true },
    },
    seoDefaults: {
      siteName: { type: String, default: 'Sun Bird Corporation | মেডিকেল ও হসপিটাল ইকুইপমেন্ট' },
      titleTemplate: { type: String, default: '%s | Sun Bird Corporation' },
      defaultMetaDescription: {
        type: String,
        default: 'সান বার্ড কর্পোরেশন — বাংলাদেশে ডিজিডিএ অনুমোদিত মেডিকেল ইকুইপমেন্ট, আইসিইউ ও হসপিটাল পণ্য সরবরাহকারী।',
      },
      defaultOgImageUrl: { type: String, default: '/images/og-default.jpg' },
      robotsIndex: { type: Boolean, default: true },
      robotsFollow: { type: Boolean, default: true },
      canonicalDomain: { type: String, default: 'https://sunbirdcorp.com' },
    },
    mediaSettings: {
      maxFileSizeMb: { type: Number, default: 10 },
      allowedMimeTypes: {
        type: [String],
        default: ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'video/mp4'],
      },
      defaultStorageBucket: { type: String, default: 'sunbird-marketing-media' },
    },
    templates: [ContentTemplateSchema],
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export const MarketingSettingsModel = mongoose.model<IMarketingSettings>('MarketingSettings', MarketingSettingsSchema);
export default MarketingSettingsModel;
