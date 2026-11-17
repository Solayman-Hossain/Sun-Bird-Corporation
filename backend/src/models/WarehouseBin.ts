import { Schema, model, Document, Types } from 'mongoose';

export type BinType = 'STANDARD' | 'COLD_STORAGE' | 'HAZARDOUS' | 'QUARANTINE' | 'STAGING';

export interface IWarehouseBin extends Document {
  _id: Types.ObjectId;
  organizationId?: Types.ObjectId;
  warehouseId: Types.ObjectId;
  binCode: string;
  zone: string;
  aisle: string;
  rack: string;
  shelf: string;
  binType: BinType;
  capacityCbf?: number;
  currentUtilizedCbf?: number;
  maxWeightKg?: number;
  isActive: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export const WarehouseBinSchema = new Schema<IWarehouseBin>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
    },
    warehouseId: {
      type: Schema.Types.ObjectId,
      ref: 'Warehouse',
      required: true,
    },
    binCode: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    zone: {
      type: String,
      required: true,
      trim: true,
    },
    aisle: {
      type: String,
      required: true,
      trim: true,
    },
    rack: {
      type: String,
      required: true,
      trim: true,
    },
    shelf: {
      type: String,
      required: true,
      trim: true,
    },
    binType: {
      type: String,
      enum: ['STANDARD', 'COLD_STORAGE', 'HAZARDOUS', 'QUARANTINE', 'STAGING'],
      default: 'STANDARD',
      required: true,
    },
    capacityCbf: {
      type: Number,
      min: 0,
    },
    currentUtilizedCbf: {
      type: Number,
      default: 0,
      min: 0,
    },
    maxWeightKg: {
      type: Number,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true, collection: 'warehouse_bins' }
);

WarehouseBinSchema.index({ warehouseId: 1, binCode: 1 }, { unique: true });
WarehouseBinSchema.index({ warehouseId: 1, zone: 1 });
WarehouseBinSchema.index({ organizationId: 1 });

export const WarehouseBinModel = model<IWarehouseBin>('WarehouseBin', WarehouseBinSchema);
export default WarehouseBinModel;
