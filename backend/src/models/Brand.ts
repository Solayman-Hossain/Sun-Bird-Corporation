import { Schema, model, Document, Types } from 'mongoose';

export interface IBrand extends Document {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  logoUrl?: string;
  description?: string;
  website?: string;
  countryOfOrigin?: string;
  displayOrder: number;
  isActive: boolean;
  seoTitle?: string;
  metaDescription?: string;
  productCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

export const BrandSchema = new Schema<IBrand>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    logoUrl: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    website: {
      type: String,
      trim: true,
    },
    countryOfOrigin: {
      type: String,
      default: 'Bangladesh',
      trim: true,
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    seoTitle: {
      type: String,
      trim: true,
    },
    metaDescription: {
      type: String,
      trim: true,
    },
    productCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

BrandSchema.index({ isActive: 1, displayOrder: 1 });

export const BrandModel = model<IBrand>('Brand', BrandSchema, 'brands');
export default BrandModel;
