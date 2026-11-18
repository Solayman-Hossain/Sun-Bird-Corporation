import { Schema, model, Document, Types } from 'mongoose';

export type CreditNoteReason =
  | 'SALES_RETURN'
  | 'PRICE_ADJUSTMENT'
  | 'GOODS_DAMAGED'
  | 'DISCOUNT'
  | 'OTHER';

export type CreditNoteStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'POSTED' | 'CANCELLED';

export interface ICreditNoteItem {
  productId?: Types.ObjectId;
  sku: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  taxAmount: number;
  totalAmount: number;
  reason?: string;
}

export interface ICreditNote extends Document {
  _id: Types.ObjectId;
  creditNoteNumber: string;
  organizationId: Types.ObjectId;
  customerId: Types.ObjectId;
  salesInvoiceId?: Types.ObjectId;
  creditDate: Date;
  reason: CreditNoteReason;
  items: ICreditNoteItem[];
  subtotal: number;
  taxTotal: number;
  totalAmount: number;
  amountInWordsEn: string;
  amountInWordsBn: string;
  status: CreditNoteStatus;
  journalEntryId?: Types.ObjectId;
  templateId?: Types.ObjectId;
  issuedBy: Types.ObjectId;
  approvedBy?: Types.ObjectId;
  approvedAt?: Date;
  notes?: string;
  snapshot?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export const CreditNoteSchema = new Schema<ICreditNote>(
  {
    creditNoteNumber: {
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
    creditDate: {
      type: Date,
      default: Date.now,
      required: true,
    },
    reason: {
      type: String,
      enum: ['SALES_RETURN', 'PRICE_ADJUSTMENT', 'GOODS_DAMAGED', 'DISCOUNT', 'OTHER'],
      default: 'SALES_RETURN',
      required: true,
    },
    items: [
      {
        productId: {
          type: Schema.Types.ObjectId,
          ref: 'Product',
        },
        sku: { type: String, required: true, trim: true, uppercase: true },
        productName: { type: String, required: true, trim: true },
        quantity: { type: Number, required: true, min: 0.001 },
        unitPrice: { type: Number, required: true, min: 0 },
        taxAmount: { type: Number, default: 0, min: 0 },
        totalAmount: { type: Number, required: true, min: 0 },
        reason: { type: String },
      },
    ],
    subtotal: { type: Number, required: true, default: 0 },
    taxTotal: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true, default: 0 },
    amountInWordsEn: { type: String, default: '' },
    amountInWordsBn: { type: String, default: '' },
    status: {
      type: String,
      enum: ['DRAFT', 'SUBMITTED', 'APPROVED', 'POSTED', 'CANCELLED'],
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
    issuedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    approvedAt: { type: Date },
    notes: { type: String },
    snapshot: { type: Schema.Types.Mixed },
  },
  {
    timestamps: true,
  }
);

CreditNoteSchema.index({ organizationId: 1, status: 1 });
CreditNoteSchema.index({ customerId: 1, status: 1 });

export const CreditNoteModel = model<ICreditNote>('CreditNote', CreditNoteSchema, 'credit_notes');

export default CreditNoteModel;
