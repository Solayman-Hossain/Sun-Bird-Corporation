import { Schema, model, Document, Types } from 'mongoose';

export type PartnerTransactionType =
  | 'CAPITAL_CONTRIBUTION'
  | 'WITHDRAWAL'
  | 'PROFIT_DISTRIBUTION'
  | 'LOSS_ALLOCATION'
  | 'SETTLEMENT';

export type PartnerTransactionStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'APPROVED'
  | 'POSTED'
  | 'CANCELLED';

export interface IPartnerTransaction extends Document {
  _id: Types.ObjectId;
  organizationId: Types.ObjectId;
  partnerId: Types.ObjectId;
  partnerName: string;
  transactionType: PartnerTransactionType;
  transactionDate: Date;
  amount: number;
  paymentMethod?: 'CASH' | 'BANK_TRANSFER' | 'CHEQUE' | 'INTERNAL_TRANSFER';
  bankAccountCode?: number;
  journalVoucherNo?: string;
  reference?: string;
  notes?: string;
  status: PartnerTransactionStatus;
  approvedBy?: Types.ObjectId;
  approvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export const PartnerTransactionSchema = new Schema<IPartnerTransaction>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    partnerId: {
      type: Schema.Types.ObjectId,
      ref: 'Partner',
      required: true,
      index: true,
    },
    partnerName: {
      type: String,
      required: true,
      trim: true,
    },
    transactionType: {
      type: String,
      enum: [
        'CAPITAL_CONTRIBUTION',
        'WITHDRAWAL',
        'PROFIT_DISTRIBUTION',
        'LOSS_ALLOCATION',
        'SETTLEMENT',
      ],
      required: true,
      index: true,
    },
    transactionDate: {
      type: Date,
      default: Date.now,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentMethod: {
      type: String,
      enum: ['CASH', 'BANK_TRANSFER', 'CHEQUE', 'INTERNAL_TRANSFER'],
      default: 'BANK_TRANSFER',
    },
    bankAccountCode: {
      type: Number,
    },
    journalVoucherNo: {
      type: String,
      trim: true,
      index: true,
    },
    reference: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['DRAFT', 'SUBMITTED', 'APPROVED', 'POSTED', 'CANCELLED'],
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

PartnerTransactionSchema.index({ organizationId: 1, partnerId: 1, transactionDate: -1 });

export const PartnerTransactionModel = model<IPartnerTransaction>(
  'PartnerTransaction',
  PartnerTransactionSchema
);
export default PartnerTransactionModel;
