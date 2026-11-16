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

export interface IProductGalleryItem {
  url: string;
  altText?: string;
  caption?: string;
  isMain?: boolean;
  sortOrder: number;
  publicId?: string;
}

export interface IProductVariantItem {
  sku: string;
  barcode?: string;
  attributes: Record<string, string>;
  additionalPrice: number;
  image?: string;
  weight?: number;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface IProductEcommerceCatalog {
  websiteName?: string;
  websiteShortDesc?: string;
  websiteFullDesc?: string;
  highlights?: string[];
  specifications?: Record<string, string>;
  features?: string[];
  tags?: string[];
  searchKeywords?: string[];
  isFeatured?: boolean;
  isNewArrival?: boolean;
  isBestSeller?: boolean;
  isPromotional?: boolean;
  promotionalPrice?: number;
  relatedProductSkus?: string[];
  frequentlyBoughtTogetherSkus?: string[];
}

export interface IProductSeo {
  seoTitle?: string;
  metaDescription?: string;
  metaKeywords?: string[];
  slug: string;
  canonicalUrl?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  imageAltText?: string;
}

export type ProductType =
  | 'PHYSICAL'
  | 'DIGITAL'
  | 'SERVICE'
  | 'RAW_MATERIAL'
  | 'FINISHED_GOODS'
  | 'SEMI_FINISHED'
  | 'CONSUMABLE'
  | 'SPARE_PARTS';

export type ProductStatus = 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';

export type ProductPublicationStatus =
  | 'DRAFT'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'PUBLISHED'
  | 'UNPUBLISHED'
  | 'REJECTED'
  | 'SCHEDULED';

export interface IProduct extends Document {
  _id: Types.ObjectId;
  organizationId?: Types.ObjectId;
  sku: string;
  productCode?: string;
  barcode?: string;
  internalReference?: string;
  nameEn: string;
  nameBn?: string;
  category: string;
  categoryId?: Types.ObjectId;
  hsCode: string;
  baseUom: string;
  purchaseUnit?: string;
  salesUnit?: string;
  brand?: string;
  brandId?: Types.ObjectId;
  manufacturer?: string;
  modelNumber?: string;
  productType: ProductType;
  description?: string;
  shortDescription?: string;
  isMedical: boolean;
  isExpirable: boolean;
  minStockQty: number;
  weight?: number;
  length?: number;
  width?: number;
  height?: number;
  volume?: number;
  // Financial & Pricing (strictly internal for purchase/cost)
  purchasePrice?: number;
  costPrice?: number;
  defaultSalesPrice?: number;
  minSalesPrice?: number;
  wholesalePrice?: number;
  retailPrice: number;
  showroomPrice: number;
  resellerTierPrices: IProductTierPrice[];
  taxRate?: number;
  warrantyPeriod?: string;
  reorderLevel?: number;
  barcodes: string[];
  // Lifecycle & Status
  status: ProductStatus;
  publicationStatus: ProductPublicationStatus;
  scheduledPublishDate?: Date;
  publishedAt?: Date;
  approvalRequestId?: Types.ObjectId;
  // E-commerce extension & Presentation
  ecommerceCatalog?: IProductEcommerceCatalog;
  gallery: IProductGalleryItem[];
  variants: IProductVariantItem[];
  seo?: IProductSeo;
  seoContent?: IProductSeoContent; // Legacy compatibility
  averageRating?: number;
  ratingCount?: number;
  isActive: boolean;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export const ProductSchema = new Schema<IProduct>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
    },
    sku: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    productCode: {
      type: String,
      trim: true,
    },
    barcode: {
      type: String,
      trim: true,
    },
    internalReference: {
      type: String,
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
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
    },
    hsCode: {
      type: String,
      required: true,
      trim: true,
      default: '9018.39.00',
    },
    baseUom: {
      type: String,
      required: true,
      trim: true,
      default: 'PCS',
    },
    purchaseUnit: {
      type: String,
      trim: true,
    },
    salesUnit: {
      type: String,
      trim: true,
    },
    brand: {
      type: String,
      trim: true,
    },
    brandId: {
      type: Schema.Types.ObjectId,
      ref: 'Brand',
    },
    manufacturer: {
      type: String,
      trim: true,
    },
    modelNumber: {
      type: String,
      trim: true,
    },
    productType: {
      type: String,
      enum: [
        'PHYSICAL',
        'DIGITAL',
        'SERVICE',
        'RAW_MATERIAL',
        'FINISHED_GOODS',
        'SEMI_FINISHED',
        'CONSUMABLE',
        'SPARE_PARTS',
      ],
      default: 'FINISHED_GOODS',
    },
    description: {
      type: String,
      trim: true,
    },
    shortDescription: {
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
    weight: {
      type: Number,
      default: 0,
    },
    length: {
      type: Number,
      default: 0,
    },
    width: {
      type: Number,
      default: 0,
    },
    height: {
      type: Number,
      default: 0,
    },
    volume: {
      type: Number,
      default: 0,
    },
    purchasePrice: {
      type: Number,
      min: 0,
    },
    costPrice: {
      type: Number,
      min: 0,
    },
    defaultSalesPrice: {
      type: Number,
      min: 0,
    },
    minSalesPrice: {
      type: Number,
      min: 0,
    },
    wholesalePrice: {
      type: Number,
      min: 0,
    },
    retailPrice: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    showroomPrice: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
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
    taxRate: {
      type: Number,
      default: 0,
      min: 0,
    },
    warrantyPeriod: {
      type: String,
      trim: true,
    },
    reorderLevel: {
      type: Number,
      default: 10,
      min: 0,
    },
    barcodes: [
      {
        type: String,
        trim: true,
      },
    ],
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE', 'ARCHIVED'],
      default: 'ACTIVE',
    },
    publicationStatus: {
      type: String,
      enum: [
        'DRAFT',
        'PENDING_APPROVAL',
        'APPROVED',
        'PUBLISHED',
        'UNPUBLISHED',
        'REJECTED',
        'SCHEDULED',
      ],
      default: 'PUBLISHED',
    },
    scheduledPublishDate: {
      type: Date,
    },
    publishedAt: {
      type: Date,
      default: Date.now,
    },
    approvalRequestId: {
      type: Schema.Types.ObjectId,
      ref: 'ApprovalRequest',
    },
    ecommerceCatalog: {
      websiteName: { type: String, trim: true },
      websiteShortDesc: { type: String, trim: true },
      websiteFullDesc: { type: String, trim: true },
      highlights: [{ type: String, trim: true }],
      specifications: { type: Map, of: String },
      features: [{ type: String, trim: true }],
      tags: [{ type: String, trim: true }],
      searchKeywords: [{ type: String, trim: true }],
      isFeatured: { type: Boolean, default: false },
      isNewArrival: { type: Boolean, default: false },
      isBestSeller: { type: Boolean, default: false },
      isPromotional: { type: Boolean, default: false },
      promotionalPrice: { type: Number, min: 0 },
      relatedProductSkus: [{ type: String, trim: true }],
      frequentlyBoughtTogetherSkus: [{ type: String, trim: true }],
    },
    gallery: [
      {
        url: { type: String, required: true, trim: true },
        altText: { type: String, trim: true },
        caption: { type: String, trim: true },
        isMain: { type: Boolean, default: false },
        sortOrder: { type: Number, default: 0 },
        publicId: { type: String, trim: true },
        _id: false,
      },
    ],
    variants: [
      {
        sku: { type: String, required: true, trim: true },
        barcode: { type: String, trim: true },
        attributes: { type: Map, of: String },
        additionalPrice: { type: Number, default: 0 },
        image: { type: String, trim: true },
        weight: { type: Number, default: 0 },
        status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' },
        _id: false,
      },
    ],
    seo: {
      seoTitle: { type: String, trim: true },
      metaDescription: { type: String, trim: true },
      metaKeywords: [{ type: String, trim: true }],
      slug: { type: String, trim: true, lowercase: true },
      canonicalUrl: { type: String, trim: true },
      ogTitle: { type: String, trim: true },
      ogDescription: { type: String, trim: true },
      ogImage: { type: String, trim: true },
      imageAltText: { type: String, trim: true },
    },
    seoContent: {
      metaTitle: { type: String, trim: true },
      metaDescription: { type: String, trim: true },
      descriptionEn: { type: String, trim: true },
      descriptionBn: { type: String, trim: true },
    },
    averageRating: {
      type: Number,
      default: 5.0,
      min: 0,
      max: 5,
    },
    ratingCount: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
ProductSchema.index({ sku: 1 }, { unique: true });
ProductSchema.index({ 'seo.slug': 1 }, { sparse: true });
ProductSchema.index({ category: 1, isActive: 1 });
ProductSchema.index({ brand: 1 });
ProductSchema.index({ publicationStatus: 1, isActive: 1 });
ProductSchema.index({ barcodes: 1 });
ProductSchema.index({ isMedical: 1 });
ProductSchema.index({ organizationId: 1 });

export const ProductModel = model<IProduct>('Product', ProductSchema, 'products');
export default ProductModel;
