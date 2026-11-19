import mongoose, { Document, Schema, Types } from 'mongoose';

export type BannerType =
  | 'MAIN_HOMEPAGE'
  | 'HERO_SLIDER'
  | 'PROMOTIONAL_SPLIT'
  | 'CATEGORY_BANNER'
  | 'PRODUCT_BANNER'
  | 'BRAND_BANNER'
  | 'SIDEBAR_BANNER'
  | 'FOOTER_BANNER'
  | 'MOBILE_BANNER'
  | 'DESKTOP_BANNER'
  | 'POPUP_WELCOME'
  | 'POPUP_DISCOUNT'
  | 'POPUP_NEWSLETTER'
  | 'POPUP_CAMPAIGN'
  | 'ANNOUNCEMENT_BAR'
  | 'CUSTOM';

export type BannerStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'PUBLISHED' | 'EXPIRED' | 'ARCHIVED';

export interface IWebsiteBanner extends Document {
  organizationId: Types.ObjectId;
  bannerCode: string;
  name: string;
  bannerType: BannerType;
  title: string;
  subtitle?: string;
  description?: string;
  imageUrl: string;
  mobileImageUrl?: string;
  desktopImageUrl?: string;
  tabletImageUrl?: string;
  buttonText?: string;
  buttonLink?: string;
  targetUrl?: string;
  displayPosition?: string;
  displayOrder: number;
  startDate: Date;
  endDate: Date;
  startTime?: string;
  endTime?: string;
  timeZone?: string;
  backgroundColor?: string;
  textColor?: string;
  overlayOpacity?: number;
  textPosition?: 'LEFT' | 'CENTER' | 'RIGHT';
  buttonStyle?: 'PRIMARY' | 'SECONDARY' | 'OUTLINE' | 'GOLD';
  sliderSettings?: {
    isSlide: boolean;
    autoplaySpeed?: number;
    transitionEffect?: 'fade' | 'slide';
  };
  popupSettings?: {
    frequency?: 'ONCE_PER_SESSION' | 'ONCE_PER_USER' | 'ALWAYS';
    delaySeconds?: number;
    deviceVisibility?: 'ALL' | 'DESKTOP_ONLY' | 'MOBILE_ONLY';
  };
  announcementSettings?: {
    highlightText?: string;
    badgeText?: string;
  };
  approvalStatus: 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED';
  status: BannerStatus;
  isActive: boolean;
  approvalRequestId?: Types.ObjectId;
  approvedBy?: Types.ObjectId;
  approvedAt?: Date;
  rejectionReason?: string;
  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  clickCount: number;
  impressionCount: number;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const WebsiteBannerSchema = new Schema<IWebsiteBanner>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    bannerCode: { type: String, required: true, unique: true, uppercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    bannerType: {
      type: String,
      required: true,
      enum: [
        'MAIN_HOMEPAGE',
        'HERO_SLIDER',
        'PROMOTIONAL_SPLIT',
        'CATEGORY_BANNER',
        'PRODUCT_BANNER',
        'BRAND_BANNER',
        'SIDEBAR_BANNER',
        'FOOTER_BANNER',
        'MOBILE_BANNER',
        'DESKTOP_BANNER',
        'POPUP_WELCOME',
        'POPUP_DISCOUNT',
        'POPUP_NEWSLETTER',
        'POPUP_CAMPAIGN',
        'ANNOUNCEMENT_BAR',
        'CUSTOM',
      ],
      index: true,
    },
    title: { type: String, required: true, trim: true },
    subtitle: { type: String, trim: true },
    description: { type: String, trim: true },
    imageUrl: { type: String, required: true },
    mobileImageUrl: { type: String },
    desktopImageUrl: { type: String },
    tabletImageUrl: { type: String },
    buttonText: { type: String, default: 'বিস্তারিত দেখুন' },
    buttonLink: { type: String, default: '#products' },
    targetUrl: { type: String },
    displayPosition: { type: String, default: 'HOMEPAGE_TOP' },
    displayOrder: { type: Number, default: 0, index: true },
    startDate: { type: Date, required: true, index: true },
    endDate: { type: Date, required: true, index: true },
    startTime: { type: String, default: '00:00' },
    endTime: { type: String, default: '23:59' },
    timeZone: { type: String, default: 'Asia/Dhaka' },
    backgroundColor: { type: String, default: '#1e3932' },
    textColor: { type: String, default: '#ffffff' },
    overlayOpacity: { type: Number, default: 0.3, min: 0, max: 1 },
    textPosition: { type: String, enum: ['LEFT', 'CENTER', 'RIGHT'], default: 'LEFT' },
    buttonStyle: { type: String, enum: ['PRIMARY', 'SECONDARY', 'OUTLINE', 'GOLD'], default: 'GOLD' },
    sliderSettings: {
      isSlide: { type: Boolean, default: false },
      autoplaySpeed: { type: Number, default: 5000 },
      transitionEffect: { type: String, enum: ['fade', 'slide'], default: 'slide' },
    },
    popupSettings: {
      frequency: { type: String, enum: ['ONCE_PER_SESSION', 'ONCE_PER_USER', 'ALWAYS'], default: 'ONCE_PER_SESSION' },
      delaySeconds: { type: Number, default: 3 },
      deviceVisibility: { type: String, enum: ['ALL', 'DESKTOP_ONLY', 'MOBILE_ONLY'], default: 'ALL' },
    },
    announcementSettings: {
      highlightText: { type: String },
      badgeText: { type: String },
    },
    approvalStatus: {
      type: String,
      enum: ['DRAFT', 'PENDING', 'APPROVED', 'REJECTED'],
      default: 'DRAFT',
      index: true,
    },
    status: {
      type: String,
      enum: ['DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'PUBLISHED', 'EXPIRED', 'ARCHIVED'],
      default: 'DRAFT',
      index: true,
    },
    isActive: { type: Boolean, default: true, index: true },
    approvalRequestId: { type: Schema.Types.ObjectId, ref: 'ApprovalRequest' },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    approvedAt: { type: Date },
    rejectionReason: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    clickCount: { type: Number, default: 0 },
    impressionCount: { type: Number, default: 0 },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

WebsiteBannerSchema.index({ organizationId: 1, bannerType: 1, status: 1, isActive: 1 });
WebsiteBannerSchema.index({ startDate: 1, endDate: 1, status: 1 });

export const WebsiteBannerModel = mongoose.model<IWebsiteBanner>('WebsiteBanner', WebsiteBannerSchema);
export default WebsiteBannerModel;
