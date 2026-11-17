import { Schema, model, Document, Types } from 'mongoose';

export type PhysicalCountType = 'FULL' | 'CYCLE' | 'CATEGORY' | 'ZONE';
export type PhysicalCountStatus =
  | 'PLANNED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'RECONCILED'
  | 'CANCELLED';

export interface IPhysicalCountItem {
  productId: Types.ObjectId;
  batchId: Types.ObjectId;
  binId?: Types.ObjectId;
  sku: string;
  batchNumber: string;
  systemQty: number;
  countedQty: number;
  varianceQty: number; // countedQty - systemQty
  unitCost: number;
  varianceValue: number; // varianceQty * unitCost
  countedBy?: Types.ObjectId;
  countedAt?: Date;
  notes?: string;
}

export interface IPhysicalCount extends Document {
  _id: Types.ObjectId;
  countNumber: string;
  organizationId?: Types.ObjectId;
  warehouseId: Types.ObjectId;
  countDate: Date;
  countType: PhysicalCountType;
  status: PhysicalCountStatus;
  items: IPhysicalCountItem[];
  totalVarianceValue: number;
  reconciliationAdjustmentId?: Types.ObjectId;
  conductedBy: Types.ObjectId;
  reconciledBy?: Types.ObjectId;
  reconciledAt?: Date;
  remarks?: string;
  createdAt: Date;
  updatedAt: Date;
}

export const PhysicalCountSchema = new Schema<IPhysicalCount>(
  {
    countNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
    },
    warehouseId: {
      type: Schema.Types.ObjectId,
      ref: 'Warehouse',
      required: true,
    },
    countDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    countType: {
      type: String,
      enum: ['FULL', 'CYCLE', 'CATEGORY', 'ZONE'],
      default: 'FULL',
      required: true,
    },
    status: {
      type: String,
      enum: ['PLANNED', 'IN_PROGRESS', 'COMPLETED', 'RECONCILED', 'CANCELLED'],
      default: 'PLANNED',
      required: true,
    },
    items: [
      {
        productId: {
          type: Schema.Types.ObjectId,
          ref: 'Product',
          required: true,
        },
        batchId: {
          type: Schema.Types.ObjectId,
          ref: 'ProductBatch',
          required: true,
        },
        binId: {
          type: Schema.Types.ObjectId,
          ref: 'WarehouseBin',
        },
        sku: {
          type: String,
          required: true,
          trim: true,
          uppercase: true,
        },
        batchNumber: {
          type: String,
          required: true,
          trim: true,
        },
        systemQty: {
          type: Number,
          required: true,
          default: 0,
        },
        countedQty: {
          type: Number,
          required: true,
          default: 0,
        },
        varianceQty: {
          type: Number,
          required: true,
          default: 0,
        },
        unitCost: {
          type: Number,
          required: true,
          min: 0,
        },
        varianceValue: {
          type: Number,
          required: true,
          default: 0,
        },
        countedBy: {
          type: Schema.Types.ObjectId,
          ref: 'User',
        },
        countedAt: {
          type: Date,
        },
        notes: {
          type: String,
        },
      },
    ],
    totalVarianceValue: {
      type: Number,
      required: true,
      default: 0,
    },
    reconciliationAdjustmentId: {
      type: Schema.Types.ObjectId,
      ref: 'StockAdjustment',
    },
    conductedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    reconciledBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    reconciledAt: {
      type: Date,
    },
    remarks: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

PhysicalCountSchema.index({ organizationId: 1, status: 1 });
PhysicalCountSchema.index({ warehouseId: 1, status: 1 });

export const PhysicalCountModel = model<IPhysicalCount>(
  'PhysicalCount',
  PhysicalCountSchema,
  'physical_counts'
);

export default PhysicalCountModel;
