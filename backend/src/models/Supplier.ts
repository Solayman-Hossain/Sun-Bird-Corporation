import { Schema, model, Document, Types } from 'mongoose';

export type SupplierCurrency = 'BDT' | 'USD' | 'EUR' | 'CNY' | 'JPY';
export type SupplierType = 'LOCAL' | 'FOREIGN' | 'INDENTING_AGENT';

export interface ISupplier extends Document {
  _id: Types.ObjectId;
  supplierCode: string;
  companyName: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  country: string;
  currency: SupplierCurrency;
  supplierType: SupplierType;
  paymentTerms?: string;
  bankDetails?: string;
  swiftCode?: string;
  userId?: Types.ObjectId; // Linked portal user account
  historicalMetrics?: {
    totalOrders: number;
    onTimeDeliveryRate: number; // Percentage 0 - 100
    qualityRating: number; // 1 - 5 stars
  };
  isActive: boolean;
  aiRiskScore?: number; // AI CS Advisor vendor score (0-100)
  createdAt: Date;
  updatedAt: Date;
}

export const SupplierSchema = new Schema<ISupplier>(
  {
    supplierCode: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    companyName: {
      type: String,
      required: true,
      trim: true,
    },
    contactPerson: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
    country: {
      type: String,
      required: true,
      default: 'Bangladesh',
      trim: true,
    },
    currency: {
      type: String,
      enum: ['BDT', 'USD', 'EUR', 'CNY', 'JPY'],
      default: 'BDT',
      required: true,
    },
    supplierType: {
      type: String,
      enum: ['LOCAL', 'FOREIGN', 'INDENTING_AGENT'],
      required: true,
    },
    paymentTerms: {
      type: String,
      trim: true,
    },
    bankDetails: {
      type: String,
      trim: true,
    },
    swiftCode: {
      type: String,
      trim: true,
      uppercase: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    historicalMetrics: {
      totalOrders: { type: Number, default: 0, min: 0 },
      onTimeDeliveryRate: { type: Number, default: 100, min: 0, max: 100 },
      qualityRating: { type: Number, default: 5.0, min: 1, max: 5 },
    },
    isActive: {
      type: Boolean,
      default: true,
      required: true,
    },
    aiRiskScore: {
      type: Number,
      min: 0,
      max: 100,
    },
  },
  { timestamps: true }
);

// Explicit Indexes per Database-Schema.md §3.1 & prompt.md §17.1
SupplierSchema.index({ supplierCode: 1 }, { unique: true });
SupplierSchema.index({ supplierType: 1, isActive: 1 });
SupplierSchema.index({ country: 1 });
SupplierSchema.index({ userId: 1 });

export const SupplierModel = model<ISupplier>('Supplier', SupplierSchema);
