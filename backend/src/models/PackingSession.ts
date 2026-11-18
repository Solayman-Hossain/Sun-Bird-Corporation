import { Schema, model, Document, Types } from 'mongoose';

export type PackingStatus =
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'PARTIALLY_PACKED'
  | 'PACKED'
  | 'REPACKED'
  | 'CANCELLED';

export interface IPackageItem {
  sku: string;
  productName: string;
  qty: number;
  batchNumber?: string;
}

export interface IPackage {
  packageNumber: string;
  packageType: string; // CARTON, BOX, PALLET, ENVELOPE
  weightKg?: number;
  lengthCm?: number;
  widthCm?: number;
  heightCm?: number;
  packagingMaterial?: string;
  items: IPackageItem[];
  trackingNumber?: string;
  status: 'PACKED' | 'SEALED' | 'LABELLED';
  notes?: string;
}

export interface IPackingSession extends Document {
  packingNumber: string;
  orderId: Types.ObjectId;
  orderNo: string;
  organizationId?: Types.ObjectId;
  warehouseId: Types.ObjectId;
  packerId?: Types.ObjectId;
  packerName?: string;
  status: PackingStatus;
  packages: IPackage[];
  startedAt?: Date;
  completedAt?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PackageItemSchema = new Schema<IPackageItem>(
  {
    sku: { type: String, required: true, trim: true, uppercase: true },
    productName: { type: String, required: true },
    qty: { type: Number, required: true, min: 1 },
    batchNumber: { type: String, trim: true },
  },
  { _id: false }
);

const PackageSchema = new Schema<IPackage>(
  {
    packageNumber: { type: String, required: true },
    packageType: { type: String, default: 'CARTON' },
    weightKg: { type: Number, default: 0 },
    lengthCm: { type: Number },
    widthCm: { type: Number },
    heightCm: { type: Number },
    packagingMaterial: { type: String },
    items: { type: [PackageItemSchema], required: true },
    trackingNumber: { type: String },
    status: { type: String, enum: ['PACKED', 'SEALED', 'LABELLED'], default: 'PACKED' },
    notes: { type: String },
  },
  { _id: false }
);

export const PackingSessionSchema = new Schema<IPackingSession>(
  {
    packingNumber: { type: String, required: true, unique: true, trim: true },
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    orderNo: { type: String, required: true, trim: true, index: true },
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', index: true },
    warehouseId: { type: Schema.Types.ObjectId, ref: 'Warehouse', required: true, index: true },
    packerId: { type: Schema.Types.ObjectId, ref: 'User' },
    packerName: { type: String },
    status: {
      type: String,
      enum: ['PENDING', 'IN_PROGRESS', 'PARTIALLY_PACKED', 'PACKED', 'REPACKED', 'CANCELLED'],
      default: 'PENDING',
      index: true,
    },
    packages: { type: [PackageSchema], default: [] },
    startedAt: { type: Date },
    completedAt: { type: Date },
    notes: { type: String },
  },
  { timestamps: true }
);

PackingSessionSchema.index({ organizationId: 1, status: 1 });

export const PackingSessionModel = model<IPackingSession>(
  'PackingSession',
  PackingSessionSchema,
  'order_packings'
);
export default PackingSessionModel;
