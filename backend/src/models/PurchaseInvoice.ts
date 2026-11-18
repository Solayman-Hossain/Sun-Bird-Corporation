import { Schema, model, Document, Types } from 'mongoose';

export type PurchaseInvoiceStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'APPROVED'
  | 'POSTED'
  | 'PARTIALLY_PAID'
  | 'PAID'
  | 'OVERDUE'
  | 'CANCELLED';

export type InvoiceMatchingStatus = 'UNMATCHED' | 'MATCHED' | 'DISCREPANCY';

export interface IPurchaseInvoiceItem {
  productId: Types.ObjectId;
  sku: string;
  productName: string;
  qty: number;
  uom: string;
  unitPrice: number;
  discount: number;
  taxRate: number;
  taxAmount: number;
  lineTotal: number;
}

export interface IPurchaseInvoice extends Document {
  _id: Types.ObjectId;
  invoiceNumber: string;
  supplierInvoiceNumber: string;
  organizationId: Types.ObjectId;
  supplierId: Types.ObjectId;
  purchaseOrderId?: Types.ObjectId;
  grnIds: Types.ObjectId[];
  invoiceDate: Date;
  dueDate: Date;
  currency: 'BDT' | 'USD' | 'EUR' | 'CNY' | 'JPY';
  exchangeRate: number;
  items: IPurchaseInvoiceItem[];
  subtotal: number;
  totalDiscount: number;
  totalTax: number;
  freightCharges: number;
  otherCharges: number;
  grandTotal: number;
  paidAmount: number;
  outstandingAmount: number;
  dueAmount?: number;
  paymentTerms?: string;
  attachments: string[];
  notes?: string;
  status: PurchaseInvoiceStatus;
  matchingStatus: InvoiceMatchingStatus;
  approvalRequestId?: Types.ObjectId;
  journalEntryId?: Types.ObjectId;
  postedAt?: Date;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const PurchaseInvoiceItemSchema = new Schema<IPurchaseInvoiceItem>(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    sku: { type: String, required: true, trim: true, uppercase: true },
    productName: { type: String, required: true, trim: true },
    qty: { type: Number, required: true, min: 0 },
    uom: { type: String, required: true, trim: true },
    unitPrice: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    taxRate: { type: Number, default: 0, min: 0 },
    taxAmount: { type: Number, default: 0, min: 0 },
    lineTotal: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

export const PurchaseInvoiceSchema = new Schema<IPurchaseInvoice>(
  {
    invoiceNumber: { type: String, required: true, trim: true, uppercase: true },
    supplierInvoiceNumber: { type: String, required: true, trim: true },
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    supplierId: { type: Schema.Types.ObjectId, ref: 'Supplier', required: true },
    purchaseOrderId: { type: Schema.Types.ObjectId, ref: 'PurchaseOrder' },
    grnIds: [{ type: Schema.Types.ObjectId, ref: 'GoodsReceiveNote' }],
    invoiceDate: { type: Date, required: true, default: Date.now },
    dueDate: { type: Date, required: true },
    currency: {
      type: String,
      enum: ['BDT', 'USD', 'EUR', 'CNY', 'JPY'],
      default: 'BDT',
      required: true,
    },
    exchangeRate: { type: Number, default: 1, min: 0 },
    items: { type: [PurchaseInvoiceItemSchema], required: true, default: [] },
    subtotal: { type: Number, required: true, min: 0, default: 0 },
    totalDiscount: { type: Number, default: 0, min: 0 },
    totalTax: { type: Number, default: 0, min: 0 },
    freightCharges: { type: Number, default: 0, min: 0 },
    otherCharges: { type: Number, default: 0, min: 0 },
    grandTotal: { type: Number, required: true, min: 0 },
    paidAmount: { type: Number, default: 0, min: 0 },
    outstandingAmount: { type: Number, required: true, min: 0 },
    paymentTerms: { type: String, trim: true },
    attachments: { type: [String], default: [] },
    notes: { type: String, trim: true },
    status: {
      type: String,
      enum: [
        'DRAFT',
        'SUBMITTED',
        'APPROVED',
        'POSTED',
        'PARTIALLY_PAID',
        'PAID',
        'OVERDUE',
        'CANCELLED',
      ],
      default: 'DRAFT',
      required: true,
    },
    matchingStatus: {
      type: String,
      enum: ['UNMATCHED', 'MATCHED', 'DISCREPANCY'],
      default: 'UNMATCHED',
    },
    approvalRequestId: { type: Schema.Types.ObjectId, ref: 'ApprovalRequest' },
    journalEntryId: { type: Schema.Types.ObjectId, ref: 'JournalEntry' },
    postedAt: { type: Date },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true, collection: 'purchase_invoices' }
);

PurchaseInvoiceSchema.index({ invoiceNumber: 1 }, { unique: true });
PurchaseInvoiceSchema.index({ organizationId: 1, status: 1 });
PurchaseInvoiceSchema.index({ supplierId: 1 });
PurchaseInvoiceSchema.index({ purchaseOrderId: 1 });
PurchaseInvoiceSchema.index({ dueDate: 1, status: 1 });

export const PurchaseInvoiceModel = model<IPurchaseInvoice>(
  'PurchaseInvoice',
  PurchaseInvoiceSchema
);
