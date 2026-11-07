import { Schema, model, Document, Types } from 'mongoose';

export interface IReview extends Document {
  _id: Types.ObjectId;
  productId: Types.ObjectId;
  productSku: string;
  reviewerName: string;
  reviewerPhone: string;
  customerId?: Types.ObjectId;
  orderId?: string;
  rating: number; // 1 to 5
  title?: string;
  reviewText: string;
  isVerifiedBuyer: boolean;
  status: 'APPROVED' | 'PENDING' | 'REJECTED';
  createdAt: Date;
  updatedAt: Date;
}

export const ReviewSchema = new Schema<IReview>(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    productSku: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    reviewerName: {
      type: String,
      required: true,
      trim: true,
    },
    reviewerPhone: {
      type: String,
      required: true,
      trim: true,
    },
    customerId: {
      type: Schema.Types.ObjectId,
      ref: 'Customer',
    },
    orderId: {
      type: String,
      trim: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    title: {
      type: String,
      trim: true,
    },
    reviewText: {
      type: String,
      required: true,
      maxlength: 1000,
      trim: true,
    },
    isVerifiedBuyer: {
      type: Boolean,
      default: true,
    },
    status: {
      type: String,
      enum: ['APPROVED', 'PENDING', 'REJECTED'],
      default: 'APPROVED',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

ReviewSchema.index({ productId: 1, createdAt: -1 });

export const Review = model<IReview>('Review', ReviewSchema);

