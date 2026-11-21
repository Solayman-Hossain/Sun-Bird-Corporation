import { Schema, model, Document, Types } from 'mongoose';

export type WarrantyStatus = 'ACTIVE' | 'EXPIRED' | 'VOIDED' | 'EXTENDED';
export type WarrantyPolicyType =
  | 'STANDARD_MANUFACTURER'
  | 'COMPREHENSIVE'
  | 'EXTENDED_WARRANTY'
  | 'LIMITED_PARTS_ONLY';

export interface IWarrantyRecord extends Document {
  _id: Types.ObjectId;
  organizationId: Types.ObjectId;
  warrantyNumber: string; // WAR-2026-0001
  productId: Types.ObjectId;
  productName: string;
  productSku: string;
  serialNumber: string;
  customerId?: Types.ObjectId;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  invoiceNumber?: string;
  salesOrderId?: Types.ObjectId;
  purchaseDate: Date;
  warrantyPeriodMonths: number;
  startDate: Date;
  endDate: Date;
  status: WarrantyStatus;
  policyType: WarrantyPolicyType;
  termsConditions?: string;
  claimCount: number;
  lastServiceDate?: Date;
  extendedMonths: number;
  createdAt: Date;
  updatedAt: Date;
}

const WarrantyRecordSchema = new Schema<IWarrantyRecord>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    warrantyNumber: { type: String, required: true, unique: true, uppercase: true, trim: true },
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    productName: { type: String, required: true },
    productSku: { type: String, required: true },
    serialNumber: { type: String, required: true, trim: true, index: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer' },
    customerName: { type: String, required: true, trim: true },
    customerPhone: { type: String, required: true, trim: true },
    customerEmail: { type: String, lowercase: true, trim: true },
    invoiceNumber: { type: String, trim: true },
    salesOrderId: { type: Schema.Types.ObjectId, ref: 'Order' },
    purchaseDate: { type: Date, required: true },
    warrantyPeriodMonths: { type: Number, required: true, min: 1 },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true, index: true },
    status: {
      type: String,
      enum: ['ACTIVE', 'EXPIRED', 'VOIDED', 'EXTENDED'],
      default: 'ACTIVE',
      index: true,
    },
    policyType: {
      type: String,
      enum: ['STANDARD_MANUFACTURER', 'COMPREHENSIVE', 'EXTENDED_WARRANTY', 'LIMITED_PARTS_ONLY'],
      default: 'STANDARD_MANUFACTURER',
    },
    termsConditions: { type: String },
    claimCount: { type: Number, default: 0 },
    lastServiceDate: { type: Date },
    extendedMonths: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

WarrantyRecordSchema.index({ organizationId: 1, serialNumber: 1 });
WarrantyRecordSchema.index({ organizationId: 1, customerPhone: 1 });
WarrantyRecordSchema.index({ organizationId: 1, endDate: 1, status: 1 });

export const WarrantyRecord = model<IWarrantyRecord>('WarrantyRecord', WarrantyRecordSchema);
