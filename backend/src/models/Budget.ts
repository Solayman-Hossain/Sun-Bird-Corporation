import { Schema, model, Document, Types } from 'mongoose';

export type BudgetType = 'ANNUAL' | 'QUARTERLY' | 'MONTHLY';
export type BudgetStatus = 'DRAFT' | 'APPROVED' | 'REVISED';

export interface IBudget extends Document {
  _id: Types.ObjectId;
  organizationId: Types.ObjectId;
  fiscalYear: string; // e.g. "2026"
  budgetName: string;
  budgetType: BudgetType;
  accountCode: number;
  accountName: string;
  department?: string;
  costCenter?: string;
  allocatedAmount: number;
  notes?: string;
  status: BudgetStatus;
  approvedBy?: Types.ObjectId;
  approvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export const BudgetSchema = new Schema<IBudget>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    fiscalYear: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    budgetName: {
      type: String,
      required: true,
      trim: true,
    },
    budgetType: {
      type: String,
      enum: ['ANNUAL', 'QUARTERLY', 'MONTHLY'],
      default: 'ANNUAL',
      required: true,
    },
    accountCode: {
      type: Number,
      required: true,
      index: true,
    },
    accountName: {
      type: String,
      required: true,
      trim: true,
    },
    department: {
      type: String,
      trim: true,
    },
    costCenter: {
      type: String,
      trim: true,
    },
    allocatedAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    notes: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['DRAFT', 'APPROVED', 'REVISED'],
      default: 'DRAFT',
      required: true,
      index: true,
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    approvedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

BudgetSchema.index({ organizationId: 1, fiscalYear: 1, accountCode: 1 });

export const BudgetModel = model<IBudget>('Budget', BudgetSchema);
export default BudgetModel;
