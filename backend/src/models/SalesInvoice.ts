import { Schema, model, Document, Types } from 'mongoose';

export type InvoicePaymentStatus = 'UNPAID' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE';
export type InvoiceStatus = 'DRAFT' | 'ISSUED' | 'PAID' | 'VOID';

export interface ISalesInvoice extends Document {
  invoiceNo: string;
  challanId?: Types.ObjectId;
  orderId: Types.ObjectId;
  customerId: Types.ObjectId;
  branchId?: Types.ObjectId;
  invoiceDate: Date;
  dueDate: Date;
  mushakInvoiceNo?: string;
  subtotal: number;
  discountAmount: number;
  vatRate: number;
  vatTotal: number;
  grandTotal: number;
  paidAmount: number;
  dueAmount: number;
  paymentStatus: InvoicePaymentStatus;
  status: InvoiceStatus;
  preparedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export const SalesInvoiceSchema = new Schema<ISalesInvoice>(
  {
    invoiceNo: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    challanId: {
      type: Schema.Types.ObjectId,
      ref: 'DeliveryChallan',
    },
    orderId: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
    },
    customerId: {
      type: Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
    },
    branchId: {
      type: Schema.Types.ObjectId,
      ref: 'Warehouse',
    },
    invoiceDate: {
      type: Date,
      default: Date.now,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    mushakInvoiceNo: {
      type: String,
      trim: true,
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    discountAmount: {
      type: Number,
      default: 0.0,
      min: 0,
    },
    vatRate: {
      type: Number,
      default: 15.0,
      min: 0,
    },
    vatTotal: {
      type: Number,
      default: 0.0,
      min: 0,
    },
    grandTotal: {
      type: Number,
      required: true,
      min: 0,
    },
    paidAmount: {
      type: Number,
      default: 0.0,
      min: 0,
    },
    dueAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentStatus: {
      type: String,
      enum: ['UNPAID', 'PARTIALLY_PAID', 'PAID', 'OVERDUE'],
      default: 'UNPAID',
    },
    status: {
      type: String,
      enum: ['DRAFT', 'ISSUED', 'PAID', 'VOID'],
      default: 'DRAFT',
    },
    preparedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Explicit canonical indexes per Database-Schema.md §4.5 & Prompt 24
// Note: invoiceNo is unique in schema definition
SalesInvoiceSchema.index({ customerId: 1, paymentStatus: 1 });
SalesInvoiceSchema.index({ status: 1 });
SalesInvoiceSchema.index({ dueDate: 1 });
SalesInvoiceSchema.index({ orderId: 1 });

export const SalesInvoiceModel = model<ISalesInvoice>(
  'SalesInvoice',
  SalesInvoiceSchema,
  'sales_invoices'
);
export default SalesInvoiceModel;
