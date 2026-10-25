import { Schema, model, Document, Types } from 'mongoose';

export type RfqStatus = 'OPEN' | 'CLOSED' | 'AWARDED';

export interface IRfq extends Document {
  _id: Types.ObjectId;
  rfqNumber: string;
  title: string;
  productId: Types.ObjectId;
  sku: string;
  targetQuantity: number;
  uom: string;
  targetDeliveryDate?: Date;
  deadline: Date;
  invitedSuppliers: Types.ObjectId[];
  status: RfqStatus;
  notes?: string;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export const RfqSchema = new Schema<IRfq>(
  {
    rfqNumber: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
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
    targetQuantity: {
      type: Number,
      required: true,
      min: 1,
    },
    uom: {
      type: String,
      required: true,
      trim: true,
    },
    targetDeliveryDate: {
      type: Date,
    },
    deadline: {
      type: Date,
      required: true,
    },
    invitedSuppliers: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Supplier',
      },
    ],
    status: {
      type: String,
      enum: ['OPEN', 'CLOSED', 'AWARDED'],
      default: 'OPEN',
      required: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

RfqSchema.index({ rfqNumber: 1 }, { unique: true });
RfqSchema.index({ status: 1 });
RfqSchema.index({ sku: 1 });
RfqSchema.index({ deadline: 1 });

export const RfqModel = model<IRfq>('Rfq', RfqSchema);
