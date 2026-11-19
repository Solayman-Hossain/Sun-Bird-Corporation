import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ILandingPageSection {
  sectionId: string;
  type:
    | 'HERO_BANNER'
    | 'TEXT_SECTION'
    | 'IMAGE_SECTION'
    | 'PRODUCT_GRID'
    | 'CATEGORY_GRID'
    | 'BRAND_GRID'
    | 'PROMOTIONAL_OFFER'
    | 'COUNTDOWN'
    | 'VIDEO_SECTION'
    | 'TESTIMONIALS'
    | 'CALL_TO_ACTION'
    | 'CUSTOM';
  title?: string;
  subtitle?: string;
  contentHtml?: string;
  imageUrl?: string;
  videoUrl?: string;
  buttonText?: string;
  buttonLink?: string;
  countdownEndDate?: Date;
  productIds?: Types.ObjectId[];
  categoryIds?: Types.ObjectId[];
  brandIds?: Types.ObjectId[];
  displayOrder: number;
  desktopVisible: boolean;
  mobileVisible: boolean;
  backgroundColor?: string;
  textColor?: string;
}

export interface ILandingPage extends Document {
  organizationId: Types.ObjectId;
  title: string;
  slug: string;
  campaignId?: Types.ObjectId;
  description?: string;
  featuredImageUrl?: string;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
  ogImageUrl?: string;
  sections: ILandingPageSection[];
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'PUBLISHED' | 'UNPUBLISHED' | 'ARCHIVED';
  startDate?: Date;
  endDate?: Date;
  publishedAt?: Date;
  viewCount: number;
  conversionCount: number;
  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const LandingPageSectionSchema = new Schema<ILandingPageSection>(
  {
    sectionId: { type: String, required: true },
    type: {
      type: String,
      required: true,
      enum: [
        'HERO_BANNER',
        'TEXT_SECTION',
        'IMAGE_SECTION',
        'PRODUCT_GRID',
        'CATEGORY_GRID',
        'BRAND_GRID',
        'PROMOTIONAL_OFFER',
        'COUNTDOWN',
        'VIDEO_SECTION',
        'TESTIMONIALS',
        'CALL_TO_ACTION',
        'CUSTOM',
      ],
    },
    title: { type: String },
    subtitle: { type: String },
    contentHtml: { type: String },
    imageUrl: { type: String },
    videoUrl: { type: String },
    buttonText: { type: String },
    buttonLink: { type: String },
    countdownEndDate: { type: Date },
    productIds: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
    categoryIds: [{ type: Schema.Types.ObjectId, ref: 'Category' }],
    brandIds: [{ type: Schema.Types.ObjectId, ref: 'Brand' }],
    displayOrder: { type: Number, default: 0 },
    desktopVisible: { type: Boolean, default: true },
    mobileVisible: { type: Boolean, default: true },
    backgroundColor: { type: String },
    textColor: { type: String },
  },
  { _id: false }
);

const LandingPageSchema = new Schema<ILandingPage>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    campaignId: { type: Schema.Types.ObjectId, ref: 'MarketingCampaign', index: true },
    description: { type: String },
    featuredImageUrl: { type: String },
    seoTitle: { type: String },
    seoDescription: { type: String },
    seoKeywords: [{ type: String }],
    ogImageUrl: { type: String },
    sections: [LandingPageSectionSchema],
    status: {
      type: String,
      enum: ['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'PUBLISHED', 'UNPUBLISHED', 'ARCHIVED'],
      default: 'DRAFT',
      index: true,
    },
    startDate: { type: Date },
    endDate: { type: Date },
    publishedAt: { type: Date },
    viewCount: { type: Number, default: 0 },
    conversionCount: { type: Number, default: 0 },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export const LandingPageModel = mongoose.model<ILandingPage>('LandingPage', LandingPageSchema);
export default LandingPageModel;
