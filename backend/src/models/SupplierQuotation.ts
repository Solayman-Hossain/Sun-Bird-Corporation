import { Schema, model, Document, Types } from 'mongoose';

export type QuotationCurrency = 'BDT' | 'USD' | 'EUR' | 'CNY';

export interface ISupplierQuotation extends Document {
  _id: Types.ObjectId;
  rfqNumber: string;
  supplierId: Types.ObjectId;
  productId: Types.ObjectId;
  sku: string;
  quotedUnitPrice: number;
  currency: QuotationCurrency;
  leadTimeDays: number;
  paymentTerms?: string;
  moq: number;
  validUntil?: Date;
  aiRiskFlags: string[];
  csScore?: number;
  createdAt: Date;
  updatedAt: Date;
}

export const SupplierQuotationSchema = new Schema<ISupplierQuotation>(
  {
    rfqNumber: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    supplierId: {
      type: Schema.Types.ObjectId,
      ref: 'Supplier',
      required: true,
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
    quotedUnitPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      enum: ['BDT', 'USD', 'EUR', 'CNY'],
      default: 'BDT',
      required: true,
    },
    leadTimeDays: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentTerms: {
      type: String,
      trim: true,
    },
    moq: {
      type: Number,
      default: 1,
      min: 1,
    },
    validUntil: {
      type: Date,
    },
    aiRiskFlags: [
      {
        type: String,
        trim: true,
      },
    ],
    csScore: {
      type: Number,
      min: 0,
      max: 100,
    },
  },
  { timestamps: true }
);

// Explicit Indexes per Database-Schema.md §3.2 & prompt.md §17.2
SupplierQuotationSchema.index({ rfqNumber: 1 });
SupplierQuotationSchema.index({ rfqNumber: 1, supplierId: 1 }, { unique: true });
SupplierQuotationSchema.index({ supplierId: 1, sku: 1 });
SupplierQuotationSchema.index({ sku: 1 });
SupplierQuotationSchema.index({ validUntil: 1 });

export const SupplierQuotationModel = model<ISupplierQuotation>(
  'SupplierQuotation',
  SupplierQuotationSchema
);
