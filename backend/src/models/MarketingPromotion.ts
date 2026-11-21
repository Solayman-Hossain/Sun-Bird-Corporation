import mongoose, { Document, Schema, Types } from 'mongoose';

export type PromotionTargetType = 'PRODUCT' | 'CATEGORY' | 'BRAND';
export type PromotionDiscountType =
  | 'PERCENTAGE'
  | 'FIXED_AMOUNT'
  | 'SPECIAL_PRICE'
  | 'BUY_X_GET_Y'
  | 'BUNDLE_OFFER'
  | 'QUANTITY_TIER';

export interface IMarketingPromotion extends Document {
  organizationId: Types.ObjectId;
  promotionCode: string;
  name: string;
  campaignId?: Types.ObjectId;
  targetType: PromotionTargetType;
  productId?: Types.ObjectId;
  categoryId?: Types.ObjectId;
  brandId?: Types.ObjectId;
  discountType: PromotionDiscountType;
  discountValue: number;
  originalPrice?: number;
  promotionalPrice?: number;
  minQuantity: number;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  freeQuantity?: number;
  freeProductId?: Types.ObjectId;
  startDate: Date;
  endDate: Date;
  status: 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'EXPIRED' | 'CANCELLED';
  bannerId?: Types.ObjectId;
  displayPosition?: string;
  badgeLabel?: string;
  usageCount: number;
  maxUsageLimit?: number;
  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const MarketingPromotionSchema = new Schema<IMarketingPromotion>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    promotionCode: { type: String, required: true, unique: true, uppercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    campaignId: { type: Schema.Types.ObjectId, ref: 'MarketingCampaign', index: true },
    targetType: { type: String, required: true, enum: ['PRODUCT', 'CATEGORY', 'BRAND'], index: true },
    productId: { type: Schema.Types.ObjectId, ref: 'Product', index: true },
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category', index: true },
    brandId: { type: Schema.Types.ObjectId, ref: 'Brand', index: true },
    discountType: {
      type: String,
      required: true,
      enum: ['PERCENTAGE', 'FIXED_AMOUNT', 'SPECIAL_PRICE', 'BUY_X_GET_Y', 'BUNDLE_OFFER', 'QUANTITY_TIER'],
    },
    discountValue: { type: Number, required: true, min: 0 },
    originalPrice: { type: Number, min: 0 },
    promotionalPrice: { type: Number, min: 0 },
    minQuantity: { type: Number, default: 1, min: 1 },
    minOrderAmount: { type: Number, min: 0 },
    maxDiscountAmount: { type: Number, min: 0 },
    freeQuantity: { type: Number, default: 0 },
    freeProductId: { type: Schema.Types.ObjectId, ref: 'Product' },
    startDate: { type: Date, required: true, index: true },
    endDate: { type: Date, required: true, index: true },
    status: {
      type: String,
      enum: ['DRAFT', 'ACTIVE', 'PAUSED', 'EXPIRED', 'CANCELLED'],
      default: 'ACTIVE',
      index: true,
    },
    bannerId: { type: Schema.Types.ObjectId, ref: 'WebsiteBanner' },
    displayPosition: { type: String, default: 'HOMEPAGE_FEATURED' },
    badgeLabel: { type: String, default: 'স্পেশাল অফার' },
    usageCount: { type: Number, default: 0 },
    maxUsageLimit: { type: Number },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

MarketingPromotionSchema.index({ organizationId: 1, targetType: 1, status: 1 });
MarketingPromotionSchema.index({ productId: 1, status: 1 });
MarketingPromotionSchema.index({ categoryId: 1, status: 1 });
MarketingPromotionSchema.index({ brandId: 1, status: 1 });

export const MarketingPromotionModel = mongoose.model<IMarketingPromotion>('MarketingPromotion', MarketingPromotionSchema);
export default MarketingPromotionModel;
