import { Schema, model, Document, Types } from 'mongoose';

export type PickingStatus =
  | 'PENDING'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'PARTIALLY_PICKED'
  | 'PICKED'
  | 'FAILED'
  | 'CANCELLED';

export interface IPickingItem {
  productId: Types.ObjectId;
  sku: string;
  productName: string;
  barcode?: string;
  batchNumber?: string;
  rack?: string;
  shelf?: string;
  bin?: string;
  requiredQty: number;
  reservedQty: number;
  pickedQty: number;
  status: 'PENDING' | 'PICKED' | 'SHORT' | 'DISCREPANCY';
  notes?: string;
}

export interface IPickingSession extends Document {
  pickingNumber: string;
  orderId: Types.ObjectId;
  orderNo: string;
  organizationId?: Types.ObjectId;
  warehouseId: Types.ObjectId;
  pickerId?: Types.ObjectId;
  pickerName?: string;
  status: PickingStatus;
  items: IPickingItem[];
  startedAt?: Date;
  completedAt?: Date;
  discrepancyNotes?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PickingItemSchema = new Schema<IPickingItem>(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    sku: { type: String, required: true, trim: true, uppercase: true },
    productName: { type: String, required: true },
    barcode: { type: String, trim: true },
    batchNumber: { type: String, trim: true },
    rack: { type: String, trim: true },
    shelf: { type: String, trim: true },
    bin: { type: String, trim: true },
    requiredQty: { type: Number, required: true, min: 1 },
    reservedQty: { type: Number, required: true, min: 0 },
    pickedQty: { type: Number, default: 0, min: 0 },
    status: {
      type: String,
      enum: ['PENDING', 'PICKED', 'SHORT', 'DISCREPANCY'],
      default: 'PENDING',
    },
    notes: { type: String },
  },
  { _id: false }
);

export const PickingSessionSchema = new Schema<IPickingSession>(
  {
    pickingNumber: { type: String, required: true, unique: true, trim: true },
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    orderNo: { type: String, required: true, trim: true, index: true },
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', index: true },
    warehouseId: { type: Schema.Types.ObjectId, ref: 'Warehouse', required: true, index: true },
    pickerId: { type: Schema.Types.ObjectId, ref: 'User' },
    pickerName: { type: String },
    status: {
      type: String,
      enum: ['PENDING', 'ASSIGNED', 'IN_PROGRESS', 'PARTIALLY_PICKED', 'PICKED', 'FAILED', 'CANCELLED'],
      default: 'PENDING',
      index: true,
    },
    items: { type: [PickingItemSchema], required: true },
    startedAt: { type: Date },
    completedAt: { type: Date },
    discrepancyNotes: { type: String },
    notes: { type: String },
  },
  { timestamps: true }
);

PickingSessionSchema.index({ organizationId: 1, status: 1 });

export const PickingSessionModel = model<IPickingSession>(
  'PickingSession',
  PickingSessionSchema,
  'order_pickings'
);
export default PickingSessionModel;
