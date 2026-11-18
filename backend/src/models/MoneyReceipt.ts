import { Schema, model, Document, Types } from 'mongoose';

export type PaymentMethodEnum =
  | 'CASH'
  | 'BANK_TRANSFER'
  | 'CHEQUE'
  | 'BKASH'
  | 'NAGAD'
  | 'ROCKET'
  | 'OTHER';

export type MoneyReceiptStatus = 'DRAFT' | 'APPROVED' | 'POSTED' | 'CANCELLED';

export interface IMoneyReceipt extends Document {
  _id: Types.ObjectId;
  receiptNumber: string;
  organizationId: Types.ObjectId;
  customerId: Types.ObjectId;
  salesInvoiceId?: Types.ObjectId;
  receiptDate: Date;
  paymentMethod: PaymentMethodEnum;
  transactionRef?: string;
  bankName?: string;
  chequeNumber?: string;
  chequeDate?: Date;
  amount: number;
  amountInWordsEn: string;
  amountInWordsBn: string;
  forParticulars: string;
  status: MoneyReceiptStatus;
  journalEntryId?: Types.ObjectId;
  templateId?: Types.ObjectId;
  receivedBy: Types.ObjectId;
  approvedBy?: Types.ObjectId;
  notes?: string;
  snapshot?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export const MoneyReceiptSchema = new Schema<IMoneyReceipt>(
  {
    receiptNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    customerId: {
      type: Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
      index: true,
    },
    salesInvoiceId: {
      type: Schema.Types.ObjectId,
      ref: 'SalesInvoice',
    },
    receiptDate: {
      type: Date,
      default: Date.now,
      required: true,
    },
    paymentMethod: {
      type: String,
      enum: ['CASH', 'BANK_TRANSFER', 'CHEQUE', 'BKASH', 'NAGAD', 'ROCKET', 'OTHER'],
      default: 'CASH',
      required: true,
    },
    transactionRef: { type: String, trim: true },
    bankName: { type: String, trim: true },
    chequeNumber: { type: String, trim: true },
    chequeDate: { type: Date },
    amount: {
      type: Number,
      required: true,
      min: 0.01,
    },
    amountInWordsEn: { type: String, default: '' },
    amountInWordsBn: { type: String, default: '' },
    forParticulars: {
      type: String,
      default: 'Payment received against sales invoice',
    },
    status: {
      type: String,
      enum: ['DRAFT', 'APPROVED', 'POSTED', 'CANCELLED'],
      default: 'DRAFT',
      required: true,
      index: true,
    },
    journalEntryId: {
      type: Schema.Types.ObjectId,
      ref: 'JournalEntry',
    },
    templateId: {
      type: Schema.Types.ObjectId,
      ref: 'DocumentTemplate',
    },
    receivedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    notes: { type: String },
    snapshot: { type: Schema.Types.Mixed },
  },
  {
    timestamps: true,
  }
);

MoneyReceiptSchema.index({ organizationId: 1, status: 1 });
MoneyReceiptSchema.index({ customerId: 1, status: 1 });

export const MoneyReceiptModel = model<IMoneyReceipt>(
  'MoneyReceipt',
  MoneyReceiptSchema,
  'money_receipts'
);

export default MoneyReceiptModel;
