import { Schema, model, Document, Types } from 'mongoose';

export type StockTransferStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'APPROVED'
  | 'IN_TRANSIT'
  | 'RECEIVED'
  | 'CANCELLED';

export interface IStockTransferItem {
  productId: Types.ObjectId;
  batchId: Types.ObjectId;
  sourceBinId?: Types.ObjectId;
  destBinId?: Types.ObjectId;
  sku: string;
  batchNumber: string;
  requestedQty: number;
  dispatchedQty?: number;
  receivedQty?: number;
  damagedQty?: number;
  uom: string;
  unitCost: number;
  notes?: string;
}

export interface IStockTransfer extends Document {
  _id: Types.ObjectId;
  transferNumber: string;
  organizationId?: Types.ObjectId;
  sourceWarehouseId: Types.ObjectId;
  destinationWarehouseId: Types.ObjectId;
  status: StockTransferStatus;
  items: IStockTransferItem[];
  totalQuantity: number;
  totalValue: number;
  requestedBy: Types.ObjectId;
  approvedBy?: Types.ObjectId;
  approvedAt?: Date;
  dispatchedBy?: Types.ObjectId;
  dispatchedAt?: Date;
  receivedBy?: Types.ObjectId;
  receivedAt?: Date;
  vehicleNumber?: string;
  driverName?: string;
  driverPhone?: string;
  challanNumber?: string;
  remarks?: string;
  createdAt: Date;
  updatedAt: Date;
}

export const StockTransferSchema = new Schema<IStockTransfer>(
  {
    transferNumber: {
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
    sourceWarehouseId: {
      type: Schema.Types.ObjectId,
      ref: 'Warehouse',
      required: true,
    },
    destinationWarehouseId: {
      type: Schema.Types.ObjectId,
      ref: 'Warehouse',
      required: true,
    },
    status: {
      type: String,
      enum: ['DRAFT', 'SUBMITTED', 'APPROVED', 'IN_TRANSIT', 'RECEIVED', 'CANCELLED'],
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
        sourceBinId: {
          type: Schema.Types.ObjectId,
          ref: 'WarehouseBin',
        },
        destBinId: {
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
        requestedQty: {
          type: Number,
          required: true,
          min: 1,
        },
        dispatchedQty: {
          type: Number,
          min: 0,
          default: 0,
        },
        receivedQty: {
          type: Number,
          min: 0,
          default: 0,
        },
        damagedQty: {
          type: Number,
          min: 0,
          default: 0,
        },
        uom: {
          type: String,
          required: true,
          default: 'PIECE',
        },
        unitCost: {
          type: Number,
          required: true,
          min: 0,
        },
        notes: {
          type: String,
        },
      },
    ],
    totalQuantity: {
      type: Number,
      required: true,
      default: 0,
    },
    totalValue: {
      type: Number,
      required: true,
      default: 0,
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
    dispatchedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    dispatchedAt: {
      type: Date,
    },
    receivedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    receivedAt: {
      type: Date,
    },
    vehicleNumber: {
      type: String,
      trim: true,
    },
    driverName: {
      type: String,
      trim: true,
    },
    driverPhone: {
      type: String,
      trim: true,
    },
    challanNumber: {
      type: String,
      trim: true,
    },
    remarks: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

StockTransferSchema.index({ organizationId: 1, status: 1 });
StockTransferSchema.index({ sourceWarehouseId: 1, status: 1 });
StockTransferSchema.index({ destinationWarehouseId: 1, status: 1 });

export const StockTransferModel = model<IStockTransfer>(
  'StockTransfer',
  StockTransferSchema,
  'stock_transfers'
);

export default StockTransferModel;
