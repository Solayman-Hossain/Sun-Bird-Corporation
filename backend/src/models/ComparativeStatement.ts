import { Schema, model, Document, Types } from 'mongoose';

export type ComparativeStatementStatus = 'DRAFT' | 'FINALIZED' | 'AWARDED';

export interface ICSBid {
  bidId?: Types.ObjectId;
  supplierId?: Types.ObjectId;
  supplierName?: string;
  unitPrice?: number;
  currency?: string;
  leadTimeDays?: number;
  paymentTerms?: string;
  priceScore?: number; // Weighted sub-score: 0-50
  leadScore?: number; // Weighted sub-score: 0-25
  termsScore?: number; // Weighted sub-score: 0-15
  vendorScore?: number; // Weighted sub-score: 0-10
  totalScore?: number; // Total: 0-100
  aiRiskFlags?: string[];
  isRecommended: boolean;
}

export interface IComparativeStatement extends Document {
  _id: Types.ObjectId;
  csNumber: string;
  productId: Types.ObjectId;
  sku: string;
  requestDate: Date;
  bids: ICSBid[];
  recommendedSupplierId?: Types.ObjectId;
  aiSummary?: string;
  status: ComparativeStatementStatus;
  preparedBy: Types.ObjectId;
  approvedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export const CSBidSchema = new Schema<ICSBid>(
  {
    bidId: {
      type: Schema.Types.ObjectId,
      ref: 'SupplierQuotation',
    },
    supplierId: {
      type: Schema.Types.ObjectId,
      ref: 'Supplier',
    },
    supplierName: {
      type: String,
      trim: true,
    },
    unitPrice: {
      type: Number,
      min: 0,
    },
    currency: {
      type: String,
      trim: true,
    },
    leadTimeDays: {
      type: Number,
      min: 0,
    },
    paymentTerms: {
      type: String,
      trim: true,
    },
    priceScore: {
      type: Number,
      min: 0,
      max: 50,
    },
    leadScore: {
      type: Number,
      min: 0,
      max: 25,
    },
    termsScore: {
      type: Number,
      min: 0,
      max: 15,
    },
    vendorScore: {
      type: Number,
      min: 0,
      max: 10,
    },
    totalScore: {
      type: Number,
      min: 0,
      max: 100,
    },
    aiRiskFlags: [
      {
        type: String,
        trim: true,
      },
    ],
    isRecommended: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);

export const ComparativeStatementSchema = new Schema<IComparativeStatement>(
  {
    csNumber: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    sku: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    requestDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    bids: [CSBidSchema],
    recommendedSupplierId: {
      type: Schema.Types.ObjectId,
      ref: 'Supplier',
    },
    aiSummary: {
      type: String,
    },
    status: {
      type: String,
      enum: ['DRAFT', 'FINALIZED', 'AWARDED'],
      default: 'DRAFT',
      required: true,
    },
    preparedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

// Explicit Indexes per Database-Schema.md §3.3 & prompt.md §17.3
ComparativeStatementSchema.index({ csNumber: 1 }, { unique: true });
ComparativeStatementSchema.index({ sku: 1 });
ComparativeStatementSchema.index({ status: 1 });
ComparativeStatementSchema.index({ productId: 1 });

export const ComparativeStatementModel = model<IComparativeStatement>(
  'ComparativeStatement',
  ComparativeStatementSchema
);
