import { Schema, model, Document, Types } from 'mongoose';

export type ProformaStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'APPROVED'
  | 'SENT'
  | 'CONVERTED'
  | 'CANCELLED';

export interface IProformaItem {
  productId?: Types.ObjectId;
  sku: string;
  productName: string;
  uom: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  taxRate: number;
  taxAmount: number;
  lineTotal: number;
}

export interface IProformaInvoice extends Document {
  _id: Types.ObjectId;
  proformaNumber: string;
  organizationId: Types.ObjectId;
  customerId: Types.ObjectId;
  quotationId?: Types.ObjectId;
  proformaDate: Date;
  paymentTerms: string;
  deliveryTerms?: string;
  currency: 'BDT' | 'USD' | 'EUR';
  items: IProformaItem[];
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  shippingCharge: number;
  grandTotal: number;
  amountInWordsEn: string;
  amountInWordsBn: string;
  bankAccountId?: string;
  status: ProformaStatus;
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

export const ProformaInvoiceSchema = new Schema<IProformaInvoice>(
  {
    proformaNumber: {
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
    quotationId: {
      type: Schema.Types.ObjectId,
      ref: 'SalesQuotation',
    },
    proformaDate: {
      type: Date,
      default: Date.now,
      required: true,
    },
    paymentTerms: {
      type: String,
      default: '100% Advance Payment / LC',
    },
    deliveryTerms: {
      type: String,
      default: 'Ex-Warehouse Dhaka',
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
        uom: { type: String, default: 'PIECE' },
        quantity: { type: Number, required: true, min: 0.001 },
        unitPrice: { type: Number, required: true, min: 0 },
        discount: { type: Number, default: 0, min: 0 },
        taxRate: { type: Number, default: 0, min: 0 },
        taxAmount: { type: Number, default: 0, min: 0 },
        lineTotal: { type: Number, required: true, min: 0 },
      },
    ],
    subtotal: { type: Number, required: true, default: 0 },
    discountTotal: { type: Number, default: 0 },
    taxTotal: { type: Number, default: 0 },
    shippingCharge: { type: Number, default: 0 },
    grandTotal: { type: Number, required: true, default: 0 },
    amountInWordsEn: { type: String, default: '' },
    amountInWordsBn: { type: String, default: '' },
    bankAccountId: { type: String },
    status: {
      type: String,
      enum: ['DRAFT', 'SUBMITTED', 'APPROVED', 'SENT', 'CONVERTED', 'CANCELLED'],
      default: 'DRAFT',
      required: true,
      index: true,
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

ProformaInvoiceSchema.index({ organizationId: 1, status: 1 });

export const ProformaInvoiceModel = model<IProformaInvoice>(
  'ProformaInvoice',
  ProformaInvoiceSchema,
  'proforma_invoices'
);

export default ProformaInvoiceModel;
