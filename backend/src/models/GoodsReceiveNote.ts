import { Schema, model, Document, Types } from 'mongoose';

export type GRNInspectionStatus = 'PENDING' | 'PASSED' | 'FAILED' | 'PARTIAL';
export type GRNStatus = 'DRAFT' | 'POSTED' | 'REVERSED';

export interface IGRNItem {
  productId: Types.ObjectId;
  sku: string;
  productName: string;
  variantId?: Types.ObjectId;
  orderedQty: number;
  previouslyReceivedQty: number;
  currentReceivedQty: number;
  acceptedQty: number;
  rejectedQty: number;
  damagedQty: number;
  uom: string;
  batchNumber?: string;
  manufacturingDate?: Date;
  expiryDate?: Date;
  unitCost: number;
  lineTotal: number;
  inspectionStatus: GRNInspectionStatus;
  notes?: string;
}

export interface IGoodsReceiveNote extends Document {
  _id: Types.ObjectId;
  grnNumber: string;
  organizationId: Types.ObjectId;
  supplierId: Types.ObjectId;
  purchaseOrderId: Types.ObjectId;
  receivingDate: Date;
  warehouseId: Types.ObjectId;
  receivedBy: Types.ObjectId;
  items: IGRNItem[];
  totalAcceptedValue: number;
  receivingNotes?: string;
  attachments: string[];
  status: GRNStatus;
  postedAt?: Date;
  reversedAt?: Date;
  reversalReason?: string;
  createdBy: Types.ObjectId;
  idempotencyKey?: string;
  createdAt: Date;
  updatedAt: Date;
}

const GRNItemSchema = new Schema<IGRNItem>(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    sku: { type: String, required: true, trim: true, uppercase: true },
    productName: { type: String, required: true, trim: true },
    variantId: { type: Schema.Types.ObjectId, ref: 'Product' },
    orderedQty: { type: Number, required: true, min: 0 },
    previouslyReceivedQty: { type: Number, default: 0, min: 0 },
    currentReceivedQty: { type: Number, required: true, min: 0 },
    acceptedQty: { type: Number, required: true, min: 0 },
    rejectedQty: { type: Number, default: 0, min: 0 },
    damagedQty: { type: Number, default: 0, min: 0 },
    uom: { type: String, required: true, trim: true },
    batchNumber: { type: String, trim: true },
    manufacturingDate: { type: Date },
    expiryDate: { type: Date },
    unitCost: { type: Number, required: true, min: 0 },
    lineTotal: { type: Number, required: true, min: 0 },
    inspectionStatus: {
      type: String,
      enum: ['PENDING', 'PASSED', 'FAILED', 'PARTIAL'],
      default: 'PENDING',
      required: true,
    },
    notes: { type: String, trim: true },
  },
  { _id: false }
);

export const GoodsReceiveNoteSchema = new Schema<IGoodsReceiveNote>(
  {
    grnNumber: { type: String, required: true, trim: true, uppercase: true },
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    supplierId: { type: Schema.Types.ObjectId, ref: 'Supplier', required: true },
    purchaseOrderId: { type: Schema.Types.ObjectId, ref: 'PurchaseOrder', required: true },
    receivingDate: { type: Date, required: true, default: Date.now },
    warehouseId: { type: Schema.Types.ObjectId, ref: 'Warehouse', required: true },
    receivedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    items: { type: [GRNItemSchema], required: true, default: [] },
    totalAcceptedValue: { type: Number, required: true, min: 0, default: 0 },
    receivingNotes: { type: String, trim: true },
    attachments: { type: [String], default: [] },
    status: {
      type: String,
      enum: ['DRAFT', 'POSTED', 'REVERSED'],
      default: 'DRAFT',
      required: true,
    },
    postedAt: { type: Date },
    reversedAt: { type: Date },
    reversalReason: { type: String, trim: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    idempotencyKey: { type: String, trim: true, sparse: true },
  },
  { timestamps: true, collection: 'goods_receive_notes' }
);

GoodsReceiveNoteSchema.index({ grnNumber: 1 }, { unique: true });
GoodsReceiveNoteSchema.index({ organizationId: 1, status: 1 });
GoodsReceiveNoteSchema.index({ purchaseOrderId: 1 });
GoodsReceiveNoteSchema.index({ supplierId: 1 });
GoodsReceiveNoteSchema.index({ idempotencyKey: 1 }, { unique: true, sparse: true });

export const GoodsReceiveNoteModel = model<IGoodsReceiveNote>(
  'GoodsReceiveNote',
  GoodsReceiveNoteSchema
);
