import { Schema, model, Document, Types } from 'mongoose';

export type AdvanceStatus = 'PENDING' | 'APPROVED' | 'DISBURSED' | 'RECOVERED' | 'REJECTED';

export interface IEmployeeAdvance extends Document {
  _id: Types.ObjectId;
  advanceCode: string;
  employeeId: Types.ObjectId;
  amount: number;
  purpose: string;
  repaymentMonth: string; // YYYY-MM
  status: AdvanceStatus;
  approvedBy?: Types.ObjectId;
  disbursedAt?: Date;
  recoveredAt?: Date;
  journalRef?: string;
  organizationId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export const EmployeeAdvanceSchema = new Schema<IEmployeeAdvance>(
  {
    advanceCode: {
      type: String,
      required: [true, 'Advance code is required'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: 'EmployeeProfile',
      required: [true, 'Employee reference is required'],
    },
    amount: {
      type: Number,
      required: [true, 'Advance amount is required'],
      min: [1, 'Amount must be positive'],
    },
    purpose: {
      type: String,
      required: [true, 'Purpose is required'],
      trim: true,
    },
    repaymentMonth: {
      type: String,
      required: [true, 'Repayment month (YYYY-MM) is required'],
      match: [/^\d{4}-\d{2}$/, 'Invalid month format'],
    },
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'DISBURSED', 'RECOVERED', 'REJECTED'],
      default: 'PENDING',
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    disbursedAt: {
      type: Date,
    },
    recoveredAt: {
      type: Date,
    },
    journalRef: {
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

EmployeeAdvanceSchema.index({ employeeId: 1, repaymentMonth: 1 });
EmployeeAdvanceSchema.index({ status: 1 });

export const EmployeeAdvanceModel = model<IEmployeeAdvance>('EmployeeAdvance', EmployeeAdvanceSchema);
