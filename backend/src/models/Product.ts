import { Schema, model, Document, Types } from 'mongoose';

export interface IProductTierPrice {
  tier: 1 | 2 | 3;
  price: number;
}

export interface IProductSeoContent {
  metaTitle?: string;
  metaDescription?: string;
  descriptionEn?: string;
  descriptionBn?: string;
}

export interface IProduct extends Document {
  _id: Types.ObjectId;
  sku: string;
  nameEn: string;
  nameBn?: string;
  category: string;
  hsCode: string;
  baseUom: string;
  brand?: string;
  isMedical: boolean;
  isExpirable: boolean;
  minStockQty: number;
  retailPrice: number;
  showroomPrice: number;
  resellerTierPrices: IProductTierPrice[];
  barcodes: string[];
  seoContent?: IProductSeoContent;
  isActive: boolean;
  createdBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export const ProductSchema = new Schema<IProduct>(
  {
    sku: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    nameEn: {
      type: String,
      required: true,
      trim: true,
    },
    nameBn: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    hsCode: {
      type: String,
      required: true,
      trim: true,
    },
    baseUom: {
      type: String,
      required: true,
      trim: true,
    },
    brand: {
      type: String,
      trim: true,
    },
    isMedical: {
      type: Boolean,
      default: false,
    },
    isExpirable: {
      type: Boolean,
      default: false,
    },
    minStockQty: {
      type: Number,
      default: 0,
      min: 0,
    },
    retailPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    showroomPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    resellerTierPrices: [
      {
        tier: {
          type: Number,
          enum: [1, 2, 3],
          required: true,
        },
        price: {
          type: Number,
          required: true,
          min: 0,
        },
        _id: false,
      },
    ],
    barcodes: [
      {
        type: String,
        trim: true,
      },
    ],
    seoContent: {
      metaTitle: { type: String, trim: true },
      metaDescription: { type: String, trim: true },
      descriptionEn: { type: String, trim: true },
      descriptionBn: { type: String, trim: true },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Explicit canonical index declarations per Database-Schema.md §2.1
ProductSchema.index({ sku: 1 }, { unique: true });
ProductSchema.index({ category: 1, isActive: 1 });
ProductSchema.index({ barcodes: 1 });
ProductSchema.index({ isMedical: 1 });

export const ProductModel = model<IProduct>('Product', ProductSchema, 'products');
export default ProductModel;
