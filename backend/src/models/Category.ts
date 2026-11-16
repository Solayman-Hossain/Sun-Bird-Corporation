import { Schema, model, Document, Types } from 'mongoose';

export interface ICategory extends Document {
  _id: Types.ObjectId;
  nameEn: string;
  nameBn?: string;
  slug: string;
  parentId?: Types.ObjectId | null;
  ancestors: Types.ObjectId[];
  iconUrl?: string;
  imageUrl?: string;
  descriptionEn?: string;
  descriptionBn?: string;
  displayOrder: number;
  isHomepageVisible: boolean;
  isActive: boolean;
  seoTitle?: string;
  metaDescription?: string;
  productCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

export const CategorySchema = new Schema<ICategory>(
  {
    nameEn: {
      type: String,
      required: true,
      trim: true,
    },
    nameBn: {
      type: String,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    parentId: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
    },
    ancestors: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Category',
      },
    ],
    iconUrl: {
      type: String,
      trim: true,
    },
    imageUrl: {
      type: String,
      trim: true,
    },
    descriptionEn: {
      type: String,
      trim: true,
    },
    descriptionBn: {
      type: String,
      trim: true,
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
    isHomepageVisible: {
      type: Boolean,
      default: true,
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

CategorySchema.index({ parentId: 1, displayOrder: 1 });
CategorySchema.index({ isActive: 1, isHomepageVisible: 1 });

export const CategoryModel = model<ICategory>('Category', CategorySchema, 'categories');
export default CategoryModel;
