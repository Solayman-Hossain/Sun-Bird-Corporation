import { Schema, model, Document, Types } from 'mongoose';

export type PayrollBatchStatus = 'DRAFT' | 'REVIEWED' | 'APPROVED' | 'PAID' | 'POSTED_GL';

export interface IPayrollBatch extends Document {
  _id: Types.ObjectId;
  batchCode: string;
  monthYear: string; // YYYY-MM
  totalEmployees: number;
  totalGross: number;
  totalAllowances: number;
  totalDeductions: number;
  totalNet: number;
  status: PayrollBatchStatus;
  disbursementDate?: Date;
  paymentMethod?: 'BANK_TRANSFER' | 'CHEQUE' | 'CASH';
  journalRef?: string;
  approvedBy?: Types.ObjectId;
  notes?: string;
  organizationId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export const PayrollBatchSchema = new Schema<IPayrollBatch>(
  {
    batchCode: {
      type: String,
      required: [true, 'Batch code is required'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    monthYear: {
      type: String,
      required: [true, 'Month-Year (YYYY-MM) is required'],
      match: [/^\d{4}-\d{2}$/, 'Invalid month format'],
    },
    totalEmployees: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalGross: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalAllowances: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalDeductions: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalNet: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ['DRAFT', 'REVIEWED', 'APPROVED', 'PAID', 'POSTED_GL'],
      default: 'DRAFT',
    },
    disbursementDate: {
      type: Date,
    },
    paymentMethod: {
      type: String,
      enum: ['BANK_TRANSFER', 'CHEQUE', 'CASH'],
      default: 'BANK_TRANSFER',
    },
    journalRef: {
      type: String,
      trim: true,
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    notes: {
      type: String,
      trim: true,
    },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
    },
  },
  {
    timestamps: true,
  }
);

PayrollBatchSchema.index({ monthYear: 1, organizationId: 1 });
PayrollBatchSchema.index({ status: 1 });

export const PayrollBatchModel = model<IPayrollBatch>('PayrollBatch', PayrollBatchSchema);
