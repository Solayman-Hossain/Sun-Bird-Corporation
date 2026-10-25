import { Schema, model, Document, Types } from 'mongoose';

export type StockMovementType =
  | 'GRN_IN'
  | 'RESERVE'
  | 'DISPATCH'
  | 'RETURN_RTO'
  | 'ADJUST'
  | 'TRANSFER_OUT'
  | 'TRANSFER_IN'
  | 'POS_BATCH';

export type StockReferenceType =
  | 'ORDER'
  | 'CHALLAN'
  | 'GRN'
  | 'ADJUSTMENT'
  | 'POS_BATCH';

export interface IStockLedger extends Document {
  _id: Types.ObjectId;
  sku: string;
  batchId: Types.ObjectId;
  warehouseId: Types.ObjectId;
  movementType: StockMovementType;
  qtyChange: number;
  unitCost?: number;
  referenceNo?: string;
  referenceType?: StockReferenceType;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export const StockLedgerSchema = new Schema<IStockLedger>(
  {
    sku: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    batchId: {
      type: Schema.Types.ObjectId,
      ref: 'ProductBatch',
      required: true,
    },
    warehouseId: {
      type: Schema.Types.ObjectId,
      ref: 'Warehouse',
      required: true,
    },
    movementType: {
      type: String,
      enum: [
        'GRN_IN',
        'RESERVE',
        'DISPATCH',
        'RETURN_RTO',
        'ADJUST',
        'TRANSFER_OUT',
        'TRANSFER_IN',
        'POS_BATCH',
      ],
      required: true,
    },
    qtyChange: {
      type: Number,
      required: true,
    },
    unitCost: {
      type: Number,
      min: 0,
    },
    referenceNo: {
      type: String,
      trim: true,
    },
    referenceType: {
      type: String,
      enum: ['ORDER', 'CHALLAN', 'GRN', 'ADJUSTMENT', 'POS_BATCH'],
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Explicit canonical index declarations per Database-Schema.md §2.5
StockLedgerSchema.index({ sku: 1, createdAt: -1 });
StockLedgerSchema.index({ batchId: 1, createdAt: -1 });
StockLedgerSchema.index({ warehouseId: 1, movementType: 1 });
StockLedgerSchema.index({ referenceNo: 1 });

export const StockLedgerModel = model<IStockLedger>(
  'StockLedger',
  StockLedgerSchema,
  'stock_ledger'
);
export default StockLedgerModel;
