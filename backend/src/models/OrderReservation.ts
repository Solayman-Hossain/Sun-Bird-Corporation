import { Schema, model, Document, Types } from 'mongoose';

export type ReservationStatus =
  | 'PENDING'
  | 'RESERVED'
  | 'PARTIALLY_RESERVED'
  | 'RELEASED'
  | 'EXPIRED'
  | 'FULFILLED'
  | 'CANCELLED';

export interface IReservationItem {
  productId: Types.ObjectId;
  sku: string;
  batchId?: Types.ObjectId;
  batchNumber?: string;
  warehouseId: Types.ObjectId;
  binId?: Types.ObjectId;
  locationBin?: string;
  requestedQty: number;
  reservedQty: number;
  status: ReservationStatus;
}

export interface IOrderReservation extends Document {
  orderId: Types.ObjectId;
  orderNo: string;
  organizationId?: Types.ObjectId;
  warehouseId: Types.ObjectId;
  status: ReservationStatus;
  items: IReservationItem[];
  expiresAt?: Date;
  allocatedBy?: Types.ObjectId;
  releasedBy?: Types.ObjectId;
  releasedAt?: Date;
  releaseReason?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ReservationItemSchema = new Schema<IReservationItem>(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    sku: { type: String, required: true, trim: true, uppercase: true },
    batchId: { type: Schema.Types.ObjectId, ref: 'ProductBatch' },
    batchNumber: { type: String, trim: true },
    warehouseId: { type: Schema.Types.ObjectId, ref: 'Warehouse', required: true },
    binId: { type: Schema.Types.ObjectId, ref: 'WarehouseBin' },
    locationBin: { type: String, trim: true },
    requestedQty: { type: Number, required: true, min: 1 },
    reservedQty: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ['PENDING', 'RESERVED', 'PARTIALLY_RESERVED', 'RELEASED', 'EXPIRED', 'FULFILLED', 'CANCELLED'],
      default: 'RESERVED',
    },
  },
  { _id: false }
);

export const OrderReservationSchema = new Schema<IOrderReservation>(
  {
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    orderNo: { type: String, required: true, trim: true, index: true },
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', index: true },
    warehouseId: { type: Schema.Types.ObjectId, ref: 'Warehouse', required: true, index: true },
    status: {
      type: String,
      enum: ['PENDING', 'RESERVED', 'PARTIALLY_RESERVED', 'RELEASED', 'EXPIRED', 'FULFILLED', 'CANCELLED'],
      default: 'RESERVED',
      index: true,
    },
    items: { type: [ReservationItemSchema], required: true },
    expiresAt: { type: Date },
    allocatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    releasedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    releasedAt: { type: Date },
    releaseReason: { type: String },
    notes: { type: String },
  },
  { timestamps: true }
);

OrderReservationSchema.index({ organizationId: 1, status: 1 });
OrderReservationSchema.index({ orderId: 1, warehouseId: 1 });

export const OrderReservationModel = model<IOrderReservation>(
  'OrderReservation',
  OrderReservationSchema,
  'order_reservations'
);
export default OrderReservationModel;
