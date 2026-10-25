import { Schema, model, Document, Types } from 'mongoose';

export type POCurrency = 'BDT' | 'USD' | 'EUR' | 'CNY';
export type POStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'APPROVED'
  | 'PARTIALLY_RECEIVED'
  | 'COMPLETED'
  | 'CANCELLED';

export interface IPOItem {
  productId: Types.ObjectId;
  sku: string;
  productName: string;
  quantity: number;
  uom: string;
  unitPrice: number;
  lineTotal: number;
  receivedQty: number;
}

export interface IPurchaseOrder extends Document {
  _id: Types.ObjectId;
  poNumber: string;
  csId?: Types.ObjectId;
  supplierId: Types.ObjectId;
  poDate: Date;
  deliveryDeadline: Date;
  currency: POCurrency;
  exchangeRate: number;
  items: IPOItem[];
  subtotal: number;
  taxAmount: number;
  grandTotal: number;
  paymentTerms: string;
  shippingTerms?: string;
  deliveryWarehouseId: Types.ObjectId;
  status: POStatus;
  approvalQuorumTier: number;
  approvedBy?: Types.ObjectId;
  issuedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export const POItemSchema = new Schema<IPOItem>(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    sku: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    productName: {
      type: String,
      required: true,
      trim: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    uom: {
      type: String,
      required: true,
      trim: true,
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    lineTotal: {
      type: Number,
      required: true,
      min: 0,
    },
    receivedQty: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { _id: false }
);

export const PurchaseOrderSchema = new Schema<IPurchaseOrder>(
  {
    poNumber: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    csId: {
      type: Schema.Types.ObjectId,
      ref: 'ComparativeStatement',
    },
    supplierId: {
      type: Schema.Types.ObjectId,
      ref: 'Supplier',
      required: true,
    },
    poDate: {
      type: Date,
      default: Date.now,
      required: true,
    },
    deliveryDeadline: {
      type: Date,
      required: true,
    },
    currency: {
      type: String,
      enum: ['BDT', 'USD', 'EUR', 'CNY'],
      default: 'BDT',
      required: true,
    },
    exchangeRate: {
      type: Number,
      default: 1.0,
      min: 0,
    },
    items: [POItemSchema],
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    taxAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    grandTotal: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentTerms: {
      type: String,
      required: true,
      trim: true,
    },
    shippingTerms: {
      type: String,
      trim: true,
    },
    deliveryWarehouseId: {
      type: Schema.Types.ObjectId,
      ref: 'Warehouse',
      required: true,
    },
    status: {
      type: String,
      enum: [
        'DRAFT',
        'SUBMITTED',
        'APPROVED',
        'PARTIALLY_RECEIVED',
        'COMPLETED',
        'CANCELLED',
      ],
      default: 'DRAFT',
      required: true,
    },
    approvalQuorumTier: {
      type: Number,
      enum: [1, 2, 3, 4],
      default: 1,
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    issuedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

// Explicit Indexes per Database-Schema.md §3.4 & prompt.md §17.4
PurchaseOrderSchema.index({ poNumber: 1 }, { unique: true });
PurchaseOrderSchema.index({ supplierId: 1, status: 1 });
PurchaseOrderSchema.index({ status: 1 });

export const PurchaseOrderModel = model<IPurchaseOrder>(
  'PurchaseOrder',
  PurchaseOrderSchema
);
