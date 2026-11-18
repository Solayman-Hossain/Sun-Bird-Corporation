import { Schema, model, Document, Types } from 'mongoose';

export type ReconciliationStatus = 'DRAFT' | 'IN_REVIEW' | 'RECONCILED';

export interface IBankStatementLine {
  lineId: string;
  date: Date;
  description: string;
  reference?: string;
  amount: number;
  type: 'DEBIT' | 'CREDIT';
  isMatched: boolean;
  matchedVoucherNo?: string;
}

export interface IBankReconciliation extends Document {
  _id: Types.ObjectId;
  organizationId: Types.ObjectId;
  bankAccountCode: number;
  bankAccountName: string;
  statementPeriodStart: Date;
  statementPeriodEnd: Date;
  statementClosingBalance: number;
  ledgerClosingBalance: number;
  difference: number;
  status: ReconciliationStatus;
  statementLines: IBankStatementLine[];
  notes?: string;
  reconciledBy?: Types.ObjectId;
  reconciledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export const BankStatementLineSchema = new Schema<IBankStatementLine>(
  {
    lineId: { type: String, required: true },
    date: { type: Date, required: true },
    description: { type: String, required: true, trim: true },
    reference: { type: String, trim: true },
    amount: { type: Number, required: true, min: 0 },
    type: { type: String, enum: ['DEBIT', 'CREDIT'], required: true },
    isMatched: { type: Boolean, default: false },
    matchedVoucherNo: { type: String, trim: true },
  },
  { _id: false }
);

export const BankReconciliationSchema = new Schema<IBankReconciliation>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    bankAccountCode: {
      type: Number,
      required: true,
      index: true,
    },
    bankAccountName: {
      type: String,
      required: true,
      trim: true,
    },
    statementPeriodStart: {
      type: Date,
      required: true,
    },
    statementPeriodEnd: {
      type: Date,
      required: true,
    },
    statementClosingBalance: {
      type: Number,
      required: true,
    },
    ledgerClosingBalance: {
      type: Number,
      required: true,
    },
    difference: {
      type: Number,
      required: true,
      default: 0,
    },
    status: {
      type: String,
      enum: ['DRAFT', 'IN_REVIEW', 'RECONCILED'],
      default: 'DRAFT',
      required: true,
      index: true,
    },
    statementLines: {
      type: [BankStatementLineSchema],
      default: [],
    },
    notes: {
      type: String,
      trim: true,
    },
    reconciledBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    reconciledAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

BankReconciliationSchema.index({ organizationId: 1, bankAccountCode: 1, statementPeriodEnd: -1 });

export const BankReconciliationModel = model<IBankReconciliation>(
  'BankReconciliation',
  BankReconciliationSchema
);
export default BankReconciliationModel;
