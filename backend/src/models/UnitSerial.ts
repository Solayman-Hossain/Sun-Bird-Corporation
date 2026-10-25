import { Schema, model, Document, Types } from 'mongoose';

export type UnitSerialStatus =
  | 'IN_STOCK'
  | 'RESERVED'
  | 'SOLD'
  | 'RMA_CLAIMED'
  | 'DEFECTIVE';

export interface IUnitSerial extends Document {
  _id: Types.ObjectId;
  batchId: Types.ObjectId;
  productId: Types.ObjectId;
  sku: string;
  serialNumber: string;
  qrCodeUrl?: string;
  status: UnitSerialStatus;
  soldToCustomerId?: Types.ObjectId;
  deliveryChallanNo?: string;
  soldAt?: Date;
  warrantyExpiryDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export const UnitSerialSchema = new Schema<IUnitSerial>(
  {
    batchId: {
      type: Schema.Types.ObjectId,
      ref: 'ProductBatch',
      required: true,
    },
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    sku: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    serialNumber: {
      type: String,
      required: true,
      trim: true,
    },
    qrCodeUrl: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['IN_STOCK', 'RESERVED', 'SOLD', 'RMA_CLAIMED', 'DEFECTIVE'],
      default: 'IN_STOCK',
      required: true,
    },
    soldToCustomerId: {
      type: Schema.Types.ObjectId,
      ref: 'Customer',
    },
    deliveryChallanNo: {
      type: String,
      trim: true,
    },
    soldAt: {
      type: Date,
    },
    warrantyExpiryDate: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Explicit canonical index declarations per Database-Schema.md §2.4
UnitSerialSchema.index({ serialNumber: 1 }, { unique: true });
UnitSerialSchema.index({ status: 1 });
UnitSerialSchema.index({ batchId: 1 });
UnitSerialSchema.index({ productId: 1 });
UnitSerialSchema.index({ soldToCustomerId: 1 });
UnitSerialSchema.index({ warrantyExpiryDate: 1 });

export const UnitSerialModel = model<IUnitSerial>(
  'UnitSerial',
  UnitSerialSchema,
  'unit_serials'
);
export default UnitSerialModel;
