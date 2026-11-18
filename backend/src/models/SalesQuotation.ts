import { Schema, model, Document, Types } from 'mongoose';

export type QuotationStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'APPROVED'
  | 'SENT'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'EXPIRED'
  | 'CONVERTED';

export interface IQuotationItem {
  productId?: Types.ObjectId;
  sku: string;
  productName: string;
  description?: string;
  brand?: string;
  origin?: string;
  uom: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  taxRate: number;
  taxAmount: number;
  lineTotal: number;
  notes?: string;
}

export interface ISalesQuotation extends Document {
  _id: Types.ObjectId;
  quotationNumber: string;
  organizationId: Types.ObjectId;
  customerId: Types.ObjectId;
  quotationDate: Date;
  validityDays: number;
  expiryDate: Date;
  subject: string;
  currency: 'BDT' | 'USD' | 'EUR';
  items: IQuotationItem[];
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  shippingCharge: number;
  grandTotal: number;
  amountInWordsEn: string;
  amountInWordsBn: string;
  status: QuotationStatus;
  convertedToProformaId?: Types.ObjectId;
  convertedToInvoiceId?: Types.ObjectId;
  templateId?: Types.ObjectId;
  termsAndConditions: string[];
  notes?: string;
  createdBy: Types.ObjectId;
  approvedBy?: Types.ObjectId;
  approvedAt?: Date;
  snapshot?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export const SalesQuotationSchema = new Schema<ISalesQuotation>(
  {
    quotationNumber: {
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
    quotationDate: {
      type: Date,
      default: Date.now,
      required: true,
    },
    validityDays: {
      type: Number,
      default: 30,
    },
    expiryDate: {
      type: Date,
      required: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    currency: {
      type: String,
      enum: ['BDT', 'USD', 'EUR'],
      default: 'BDT',
    },
    items: [
      {
        productId: {
          type: Schema.Types.ObjectId,
          ref: 'Product',
        },
        sku: { type: String, required: true, trim: true, uppercase: true },
        productName: { type: String, required: true, trim: true },
        description: { type: String },
        brand: { type: String },
        origin: { type: String },
        uom: { type: String, default: 'PIECE' },
        quantity: { type: Number, required: true, min: 0.001 },
        unitPrice: { type: Number, required: true, min: 0 },
        discount: { type: Number, default: 0, min: 0 },
        taxRate: { type: Number, default: 0, min: 0 },
        taxAmount: { type: Number, default: 0, min: 0 },
        lineTotal: { type: Number, required: true, min: 0 },
        notes: { type: String },
      },
    ],
    subtotal: { type: Number, required: true, default: 0 },
    discountTotal: { type: Number, default: 0 },
    taxTotal: { type: Number, default: 0 },
    shippingCharge: { type: Number, default: 0 },
    grandTotal: { type: Number, required: true, default: 0 },
    amountInWordsEn: { type: String, default: '' },
    amountInWordsBn: { type: String, default: '' },
    status: {
      type: String,
      enum: [
        'DRAFT',
        'SUBMITTED',
        'APPROVED',
        'SENT',
        'ACCEPTED',
        'REJECTED',
        'EXPIRED',
        'CONVERTED',
      ],
      default: 'DRAFT',
      required: true,
      index: true,
    },
    convertedToProformaId: {
      type: Schema.Types.ObjectId,
      ref: 'ProformaInvoice',
    },
    convertedToInvoiceId: {
      type: Schema.Types.ObjectId,
      ref: 'SalesInvoice',
    },
    templateId: {
      type: Schema.Types.ObjectId,
      ref: 'DocumentTemplate',
    },
    termsAndConditions: [{ type: String }],
    notes: { type: String },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    approvedAt: { type: Date },
    snapshot: { type: Schema.Types.Mixed },
  },
  {
    timestamps: true,
  }
);

SalesQuotationSchema.index({ organizationId: 1, status: 1 });
SalesQuotationSchema.index({ customerId: 1, status: 1 });

export const SalesQuotationModel = model<ISalesQuotation>(
  'SalesQuotation',
  SalesQuotationSchema,
  'sales_quotations'
);

export default SalesQuotationModel;
