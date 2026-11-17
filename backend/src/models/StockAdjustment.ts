import { Schema, model, Document, Types } from 'mongoose';

export type StockAdjustmentType =
  | 'DAMAGED'
  | 'EXPIRED'
  | 'THEFT'
  | 'COUNT_VARIANCE'
  | 'REVALUATION'
  | 'SCRAP'
  | 'INITIAL_STOCK'
  | 'OTHER';

export type StockAdjustmentStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'POSTED' | 'REJECTED';

export interface IStockAdjustmentItem {
  productId: Types.ObjectId;
  batchId: Types.ObjectId;
  binId?: Types.ObjectId;
  sku: string;
  batchNumber: string;
  currentQty: number;
  adjustedQty: number; // New quantity after adjustment
  differenceQty: number; // adjustedQty - currentQty (+ve or -ve)
  unitCost: number;
  totalValueChange: number; // differenceQty * unitCost
  reason?: string;
}

export interface IStockAdjustment extends Document {
  _id: Types.ObjectId;
  adjustmentNumber: string;
  organizationId?: Types.ObjectId;
  warehouseId: Types.ObjectId;
  adjustmentType: StockAdjustmentType;
  status: StockAdjustmentStatus;
  items: IStockAdjustmentItem[];
  totalValuationChange: number;
  journalEntryId?: Types.ObjectId;
  requestedBy: Types.ObjectId;
  approvedBy?: Types.ObjectId;
  approvedAt?: Date;
  postedBy?: Types.ObjectId;
  postedAt?: Date;
  remarks?: string;
  createdAt: Date;
  updatedAt: Date;
}

export const StockAdjustmentSchema = new Schema<IStockAdjustment>(
  {
    adjustmentNumber: {
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
    adjustmentType: {
      type: String,
      enum: [
        'DAMAGED',
        'EXPIRED',
        'THEFT',
        'COUNT_VARIANCE',
        'REVALUATION',
        'SCRAP',
        'INITIAL_STOCK',
        'OTHER',
      ],
      required: true,
    },
    status: {
      type: String,
      enum: ['DRAFT', 'SUBMITTED', 'APPROVED', 'POSTED', 'REJECTED'],
      default: 'DRAFT',
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
        currentQty: {
          type: Number,
          required: true,
          min: 0,
        },
        adjustedQty: {
          type: Number,
          required: true,
          min: 0,
        },
        differenceQty: {
          type: Number,
          required: true,
        },
        unitCost: {
          type: Number,
          required: true,
          min: 0,
        },
        totalValueChange: {
          type: Number,
          required: true,
        },
        reason: {
          type: String,
        },
      },
    ],
    totalValuationChange: {
      type: Number,
      required: true,
      default: 0,
    },
    journalEntryId: {
      type: Schema.Types.ObjectId,
      ref: 'JournalEntry',
    },
    requestedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    approvedAt: {
      type: Date,
    },
    postedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    postedAt: {
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

StockAdjustmentSchema.index({ organizationId: 1, status: 1 });
StockAdjustmentSchema.index({ warehouseId: 1, status: 1 });
StockAdjustmentSchema.index({ adjustmentType: 1 });

export const StockAdjustmentModel = model<IStockAdjustment>(
  'StockAdjustment',
  StockAdjustmentSchema,
  'stock_adjustments'
);

export default StockAdjustmentModel;
