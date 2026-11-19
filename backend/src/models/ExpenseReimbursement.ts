import { Schema, model, Document, Types } from 'mongoose';

export type ExpenseCategory =
  | 'TRAVEL'
  | 'FOOD'
  | 'ACCOMMODATION'
  | 'CLIENT_ENTERTAINMENT'
  | 'OFFICE_SUPPLIES'
  | 'MEDICAL'
  | 'OTHER';

export type ExpenseStatus = 'SUBMITTED' | 'APPROVED' | 'SETTLED' | 'REJECTED';

export interface IExpenseReimbursement extends Document {
  _id: Types.ObjectId;
  claimCode: string;
  employeeId: Types.ObjectId;
  expenseDate: Date;
  category: ExpenseCategory;
  amount: number;
  description: string;
  receiptUrl?: string;
  status: ExpenseStatus;
  approvedBy?: Types.ObjectId;
  settledAt?: Date;
  journalRef?: string;
  organizationId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export const ExpenseReimbursementSchema = new Schema<IExpenseReimbursement>(
  {
    claimCode: {
      type: String,
      required: [true, 'Claim code is required'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: 'EmployeeProfile',
      required: [true, 'Employee reference is required'],
    },
    expenseDate: {
      type: Date,
      required: [true, 'Expense date is required'],
    },
    category: {
      type: String,
      enum: [
        'TRAVEL',
        'FOOD',
        'ACCOMMODATION',
        'CLIENT_ENTERTAINMENT',
        'OFFICE_SUPPLIES',
        'MEDICAL',
        'OTHER',
      ],
      required: true,
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [1, 'Amount must be positive'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    receiptUrl: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['SUBMITTED', 'APPROVED', 'SETTLED', 'REJECTED'],
      default: 'SUBMITTED',
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    settledAt: {
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

ExpenseReimbursementSchema.index({ employeeId: 1, expenseDate: -1 });
ExpenseReimbursementSchema.index({ status: 1 });

export const ExpenseReimbursementModel = model<IExpenseReimbursement>(
  'ExpenseReimbursement',
  ExpenseReimbursementSchema
);
