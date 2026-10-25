import { Schema, model, Document, Types } from 'mongoose';

export type TransporterType = 'PATHAO' | 'STEADFAST' | 'OWN_FLEET' | 'THIRD_PARTY';
export type ChallanStatus =
  | 'DRAFT'
  | 'APPROVED'
  | 'DISPATCHED'
  | 'DELIVERED'
  | 'REVISED'
  | 'CANCELLED'
  | 'RETURNED_RTO'
  | 'SPLIT_PARTIAL';

export interface IChallanItem {
  productId: Types.ObjectId;
  sku: string;
  productName: string;
  hsCode: string;
  batchNumber: string;
  dispatchedQty: number;
  uom: string;
  dispatchedSerials: string[];
  vatRate: number;
  sdRate: number;
}

export interface IDeliveryChallan extends Document {
  challanNo: string;
  orderId: Types.ObjectId;
  customerId: Types.ObjectId;
  companyBin: string;
  buyerBin?: string;
  vehicleNumber?: string;
  dispatchTime: Date;
  transporterType: TransporterType;
  consignmentTrackingId?: string;
  cartonCount: number;
  items: IChallanItem[];
  pdfS3Url?: string;
  status: ChallanStatus;
  preparedBy: Types.ObjectId;
  approvedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ChallanItemSchema = new Schema<IChallanItem>(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    sku: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    productName: {
      type: String,
      required: true,
      trim: true,
    },
    hsCode: {
      type: String,
      required: true,
      trim: true,
    },
    batchNumber: {
      type: String,
      required: true,
      trim: true,
    },
    dispatchedQty: {
      type: Number,
      required: true,
      min: 1,
    },
    uom: {
      type: String,
      required: true,
      trim: true,
    },
    dispatchedSerials: {
      type: [String],
      default: [],
    },
    vatRate: {
      type: Number,
      default: 15.0,
      min: 0,
    },
    sdRate: {
      type: Number,
      default: 0.0,
      min: 0,
    },
  },
  { _id: false }
);

export const DeliveryChallanSchema = new Schema<IDeliveryChallan>(
  {
    challanNo: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    orderId: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
    },
    customerId: {
      type: Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
    },
    companyBin: {
      type: String,
      required: true,
      trim: true,
    },
    buyerBin: {
      type: String,
      trim: true,
    },
    vehicleNumber: {
      type: String,
      trim: true,
    },
    dispatchTime: {
      type: Date,
      default: Date.now,
    },
    transporterType: {
      type: String,
      enum: ['PATHAO', 'STEADFAST', 'OWN_FLEET', 'THIRD_PARTY'],
      default: 'OWN_FLEET',
    },
    consignmentTrackingId: {
      type: String,
      trim: true,
    },
    cartonCount: {
      type: Number,
      default: 1,
      min: 1,
    },
    items: {
      type: [ChallanItemSchema],
      required: true,
      validate: [(val: IChallanItem[]) => val.length > 0, 'Challan must contain at least one item'],
    },
    pdfS3Url: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: [
        'DRAFT',
        'APPROVED',
        'DISPATCHED',
        'DELIVERED',
        'REVISED',
        'CANCELLED',
        'RETURNED_RTO',
        'SPLIT_PARTIAL',
      ],
      default: 'DRAFT',
    },
    preparedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Explicit canonical indexes per Database-Schema.md §4.4 & Prompt 24
// Note: challanNo is unique in schema definition
DeliveryChallanSchema.index({ orderId: 1 });
DeliveryChallanSchema.index({ customerId: 1 });
DeliveryChallanSchema.index({ status: 1 });
DeliveryChallanSchema.index({ dispatchTime: -1 });

export const DeliveryChallanModel = model<IDeliveryChallan>(
  'DeliveryChallan',
  DeliveryChallanSchema,
  'delivery_challans'
);
export default DeliveryChallanModel;
