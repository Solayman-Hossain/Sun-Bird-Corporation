import { Schema, model, Document, Types } from 'mongoose';

export type PurchaseReturnStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'APPROVED'
  | 'POSTED'
  | 'REJECTED'
  | 'CANCELLED';

export interface IPurchaseReturnItem {
  productId: Types.ObjectId;
  sku: string;
  productName: string;
  batchNumber?: string;
  batchId?: Types.ObjectId;
  returnedQty: number;
  uom: string;
  unitCost: number;
  lineTotal: number;
  returnReason?: string;
}

export interface IPurchaseReturn extends Document {
  _id: Types.ObjectId;
  returnNumber: string;
  organizationId: Types.ObjectId;
  supplierId: Types.ObjectId;
  grnId?: Types.ObjectId;
  invoiceId?: Types.ObjectId;
  warehouseId: Types.ObjectId;
  returnDate: Date;
  reason: string;
  items: IPurchaseReturnItem[];
  totalReturnValue: number;
  notes?: string;
  attachments: string[];
  status: PurchaseReturnStatus;
  approvalRequestId?: Types.ObjectId;
  journalEntryId?: Types.ObjectId;
  postedAt?: Date;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const PurchaseReturnItemSchema = new Schema<IPurchaseReturnItem>(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    sku: { type: String, required: true, trim: true, uppercase: true },
    productName: { type: String, required: true, trim: true },
    batchNumber: { type: String, trim: true },
    batchId: { type: Schema.Types.ObjectId, ref: 'ProductBatch' },
    returnedQty: { type: Number, required: true, min: 0 },
    uom: { type: String, required: true, trim: true },
    unitCost: { type: Number, required: true, min: 0 },
    lineTotal: { type: Number, required: true, min: 0 },
    returnReason: { type: String, trim: true },
  },
  { _id: false }
);

export const PurchaseReturnSchema = new Schema<IPurchaseReturn>(
  {
    returnNumber: { type: String, required: true, trim: true, uppercase: true },
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    supplierId: { type: Schema.Types.ObjectId, ref: 'Supplier', required: true },
    grnId: { type: Schema.Types.ObjectId, ref: 'GoodsReceiveNote' },
    invoiceId: { type: Schema.Types.ObjectId, ref: 'PurchaseInvoice' },
    warehouseId: { type: Schema.Types.ObjectId, ref: 'Warehouse', required: true },
    returnDate: { type: Date, required: true, default: Date.now },
    reason: { type: String, required: true, trim: true },
    items: { type: [PurchaseReturnItemSchema], required: true, default: [] },
    totalReturnValue: { type: Number, required: true, min: 0 },
    notes: { type: String, trim: true },
    attachments: { type: [String], default: [] },
    status: {
      type: String,
      enum: ['DRAFT', 'SUBMITTED', 'APPROVED', 'POSTED', 'REJECTED', 'CANCELLED'],
      default: 'DRAFT',
      required: true,
    },
    approvalRequestId: { type: Schema.Types.ObjectId, ref: 'ApprovalRequest' },
    journalEntryId: { type: Schema.Types.ObjectId, ref: 'JournalEntry' },
    postedAt: { type: Date },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true, collection: 'purchase_returns' }
);

PurchaseReturnSchema.index({ returnNumber: 1 }, { unique: true });
PurchaseReturnSchema.index({ organizationId: 1, status: 1 });
PurchaseReturnSchema.index({ supplierId: 1 });
PurchaseReturnSchema.index({ grnId: 1 });
PurchaseReturnSchema.index({ invoiceId: 1 });

export const PurchaseReturnModel = model<IPurchaseReturn>(
  'PurchaseReturn',
  PurchaseReturnSchema
);
