import { Schema, model, Document, Types } from 'mongoose';
import { DoubleEntryImbalanceError } from '../errors/AppError';
import { DirectorApprovalSchema, IDirectorApproval } from './QuorumApproval';

export type VoucherType =
  | 'SALES'
  | 'PURCHASE'
  | 'PAYMENT'
  | 'RECEIPT'
  | 'CONTRA'
  | 'JOURNAL';

export type JournalStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'PENDING_APPROVAL'
  | 'POSTED'
  | 'REVERSED';

export interface IJournalLine {
  accountId?: Types.ObjectId;
  accountCode: number;
  accountName: string;
  debit: number;
  credit: number;
  description?: string;
}

export interface IJournalEntry extends Document {
  _id: Types.ObjectId;
  voucherNo: string;
  voucherType: VoucherType;
  transactionDate: Date;
  sourceDocumentRef: string;
  lines: IJournalLine[];
  totalDebit: number;
  totalCredit: number;
  status: JournalStatus;
  createdBy: Types.ObjectId;
  requiredQuorumTier: 1 | 2 | 3 | 4;
  approvals: IDirectorApproval[];
  isFullyApproved: boolean;
  reversalOf?: Types.ObjectId;
  idempotencyKey?: string;
  createdAt: Date;
  updatedAt: Date;
}

export const JournalLineSchema = new Schema<IJournalLine>(
  {
    accountId: {
      type: Schema.Types.ObjectId,
      ref: 'ChartOfAccounts',
    },
    accountCode: {
      type: Number,
      required: true,
    },
    accountName: {
      type: String,
      required: true,
      trim: true,
    },
    debit: {
      type: Number,
      default: 0.0,
      min: 0,
    },
    credit: {
      type: Number,
      default: 0.0,
      min: 0,
    },
    description: {
      type: String,
      trim: true,
    },
  },
  { _id: false }
);

export const JournalEntrySchema = new Schema<IJournalEntry>(
  {
    voucherNo: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    voucherType: {
      type: String,
      enum: ['SALES', 'PURCHASE', 'PAYMENT', 'RECEIPT', 'CONTRA', 'JOURNAL'],
      required: true,
    },
    transactionDate: {
      type: Date,
      default: Date.now,
      required: true,
    },
    sourceDocumentRef: {
      type: String,
      required: true,
      trim: true,
    },
    lines: {
      type: [JournalLineSchema],
      validate: {
        validator: function (val: IJournalLine[]) {
          return val && val.length >= 2;
        },
        message: 'Journal entry must contain at least 2 line items (debit and credit)',
      },
      required: true,
    },
    totalDebit: {
      type: Number,
      required: true,
      min: 0,
    },
    totalCredit: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ['DRAFT', 'SUBMITTED', 'PENDING_APPROVAL', 'POSTED', 'REVERSED'],
      default: 'DRAFT',
      required: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    requiredQuorumTier: {
      type: Number,
      enum: [1, 2, 3, 4],
      default: 1,
    },
    approvals: {
      type: [DirectorApprovalSchema],
      default: [],
    },
    isFullyApproved: {
      type: Boolean,
      default: false,
    },
    reversalOf: {
      type: Schema.Types.ObjectId,
      ref: 'JournalEntry',
    },
    idempotencyKey: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

// Pre-save strict balance assertion hook: totalDebit === totalCredit
JournalEntrySchema.pre('validate', function () {
  if (this.lines && this.lines.length > 0) {
    const sumDebit = Number(
      this.lines.reduce((acc, line) => acc + (line.debit || 0), 0).toFixed(4)
    );
    const sumCredit = Number(
      this.lines.reduce((acc, line) => acc + (line.credit || 0), 0).toFixed(4)
    );

    this.totalDebit = Number(sumDebit.toFixed(2));
    this.totalCredit = Number(sumCredit.toFixed(2));

    if (Math.abs(sumDebit - sumCredit) >= 0.001) {
      throw new DoubleEntryImbalanceError(sumDebit, sumCredit);
    }
  }
});

// Explicit Indexes per Database-Schema.md §5.2 & prompt.md §31.2
JournalEntrySchema.index({ voucherNo: 1 }, { unique: true });
JournalEntrySchema.index({ transactionDate: -1 });
JournalEntrySchema.index({ status: 1 });
JournalEntrySchema.index({ voucherType: 1 });
JournalEntrySchema.index({ 'lines.accountCode': 1 });
JournalEntrySchema.index({ idempotencyKey: 1 }, { sparse: true, unique: true });
JournalEntrySchema.index({ createdBy: 1 });

export const JournalEntryModel = model<IJournalEntry>('JournalEntry', JournalEntrySchema);
export default JournalEntryModel;
