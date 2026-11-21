import { Schema, model, Document, Types } from 'mongoose';

export type ImportPaymentType =
  | 'LC_MARGIN'
  | 'LC_OPENING_COMMISSION'
  | 'LC_AMENDMENT_FEE'
  | 'SUPPLIER_ADVANCE'
  | 'SIGHT_PAYMENT'
  | 'USANCE_PAYMENT'
  | 'DEFERRED_PAYMENT'
  | 'BANK_CHARGES'
  | 'FREIGHT_PAYMENT'
  | 'INSURANCE_PAYMENT'
  | 'CUSTOMS_DUTY_PAYMENT'
  | 'PORT_CHARGES_PAYMENT'
  | 'CF_AGENT_PAYMENT'
  | 'OTHER';

export interface IImportPayment extends Document {
  _id: Types.ObjectId;
  paymentReference: string;
  organizationId: Types.ObjectId;
  lcId: Types.ObjectId;
  lcNumber: string;
  supplierId?: Types.ObjectId;
  bankName: string;
  paymentType: ImportPaymentType;
  currency: string;
  foreignAmount: number;
  exchangeRate: number;
  localAmountBDT: number;
  paymentDate: Date;
  maturityDate?: Date;
  paymentMethod: 'BANK_TRANSFER' | 'PAY_ORDER' | 'EFTN' | 'RTGS' | 'LC_DEBIT';
  bankAccountId?: Types.ObjectId;
  transactionReference: string;
  journalEntryId?: Types.ObjectId;
  approvalStatus: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'PAID' | 'REJECTED';
  paidBy?: Types.ObjectId;
  notes?: string;
  attachments?: Array<{
    fileUrl: string;
    fileName: string;
    uploadedAt: Date;
  }>;
  aiPaymentSummary?: string;
  createdAt: Date;
  updatedAt: Date;
}

export const ImportPaymentSchema = new Schema<IImportPayment>(
  {
    paymentReference: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    lcId: {
      type: Schema.Types.ObjectId,
      ref: 'ImportLC',
      required: true,
      index: true,
    },
    lcNumber: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    supplierId: {
      type: Schema.Types.ObjectId,
      ref: 'Supplier',
    },
    bankName: {
      type: String,
      required: true,
      trim: true,
    },
    paymentType: {
      type: String,
      required: true,
      enum: [
        'LC_MARGIN',
        'LC_OPENING_COMMISSION',
        'LC_AMENDMENT_FEE',
        'SUPPLIER_ADVANCE',
        'SIGHT_PAYMENT',
        'USANCE_PAYMENT',
        'DEFERRED_PAYMENT',
        'BANK_CHARGES',
        'FREIGHT_PAYMENT',
        'INSURANCE_PAYMENT',
        'CUSTOMS_DUTY_PAYMENT',
        'PORT_CHARGES_PAYMENT',
        'CF_AGENT_PAYMENT',
        'OTHER',
      ],
      index: true,
    },
    currency: {
      type: String,
      default: 'USD',
      trim: true,
    },
    foreignAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    exchangeRate: {
      type: Number,
      required: true,
      min: 0.01,
    },
    localAmountBDT: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    maturityDate: {
      type: Date,
    },
    paymentMethod: {
      type: String,
      enum: ['BANK_TRANSFER', 'PAY_ORDER', 'EFTN', 'RTGS', 'LC_DEBIT'],
      default: 'BANK_TRANSFER',
    },
    bankAccountId: {
      type: Schema.Types.ObjectId,
      ref: 'BankAccount',
    },
    transactionReference: {
      type: String,
      required: true,
      trim: true,
    },
    journalEntryId: {
      type: Schema.Types.ObjectId,
      ref: 'JournalEntry',
    },
    approvalStatus: {
      type: String,
      enum: ['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'PAID', 'REJECTED'],
      default: 'APPROVED',
      index: true,
    },
    paidBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    notes: { type: String, trim: true },
    attachments: [
      {
        fileUrl: { type: String, required: true },
        fileName: { type: String, required: true },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    aiPaymentSummary: { type: String },
  },
  { timestamps: true }
);

ImportPaymentSchema.index({ organizationId: 1, paymentReference: 1 }, { unique: true });

export const ImportPaymentModel = model<IImportPayment>('ImportPayment', ImportPaymentSchema);
