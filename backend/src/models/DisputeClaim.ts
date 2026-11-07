import { Schema, model, Document, Types } from 'mongoose';

export type ClaimType =
  | 'DAMAGED_IN_TRANSIT'
  | 'DEFECTIVE_PRODUCT'
  | 'WRONG_ITEM_DELIVERED'
  | 'WARRANTY_SERVICE'
  | 'EXPIRED_BATCH'
  | 'OTHER_DISPUTE';

export type ClaimStatus =
  | 'PENDING_REVIEW'
  | 'UNDER_INVESTIGATION'
  | 'APPROVED_REPLACEMENT'
  | 'APPROVED_REFUND'
  | 'REJECTED'
  | 'RESOLVED';

export interface IDisputeClaim extends Document {
  _id: Types.ObjectId;
  claimNumber: string; // e.g. RMA-2026-0001
  orderId: string;
  orderNumber?: string;
  productSku: string;
  productName: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  claimType: ClaimType;
  description: string;
  evidenceUrls: string[];
  status: ClaimStatus;
  moderatorNotes?: string;
  resolvedBy?: Types.ObjectId;
  resolvedAt?: Date;
  replacementOrderId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export const DisputeClaimSchema = new Schema<IDisputeClaim>(
  {
    claimNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    orderId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    orderNumber: {
      type: String,
      trim: true,
    },
    productSku: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    productName: {
      type: String,
      required: true,
      trim: true,
    },
    customerName: {
      type: String,
      required: true,
      trim: true,
    },
    customerPhone: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    customerEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },
    claimType: {
      type: String,
      enum: [
        'DAMAGED_IN_TRANSIT',
        'DEFECTIVE_PRODUCT',
        'WRONG_ITEM_DELIVERED',
        'WARRANTY_SERVICE',
        'EXPIRED_BATCH',
        'OTHER_DISPUTE',
      ],
      required: true,
    },
    description: {
      type: String,
      required: true,
      maxlength: 2000,
    },
    evidenceUrls: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: [
        'PENDING_REVIEW',
        'UNDER_INVESTIGATION',
        'APPROVED_REPLACEMENT',
        'APPROVED_REFUND',
        'REJECTED',
        'RESOLVED',
      ],
      default: 'PENDING_REVIEW',
      index: true,
    },
    moderatorNotes: {
      type: String,
    },
    resolvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    resolvedAt: {
      type: Date,
    },
    replacementOrderId: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

DisputeClaimSchema.index({ status: 1, createdAt: -1 });

export const DisputeClaim = model<IDisputeClaim>('DisputeClaim', DisputeClaimSchema);

