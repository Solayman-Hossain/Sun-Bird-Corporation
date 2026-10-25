import { Schema, model, Document, Types } from 'mongoose';

export type CourierPartner = 'PATHAO' | 'STEADFAST';
export type CourierDeliveryStatus =
  | 'BOOKED'
  | 'IN_TRANSIT'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'RTO_RETURNED'
  | 'CANCELLED';

export interface ICourierConsignment extends Document {
  orderId: Types.ObjectId;
  challanId?: Types.ObjectId;
  courierPartner: CourierPartner;
  consignmentId: string;
  trackingCode: string;
  recipientName: string;
  recipientPhone: string;
  recipientAddress: string;
  weightKg: number;
  codAmount: number;
  courierFee: number;
  deliveryStatus: CourierDeliveryStatus;
  deliveredAt?: Date;
  remittanceId?: string;
  remittanceAmount: number;
  createdAt: Date;
  updatedAt: Date;
}

export const CourierConsignmentSchema = new Schema<ICourierConsignment>(
  {
    orderId: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
    },
    challanId: {
      type: Schema.Types.ObjectId,
      ref: 'DeliveryChallan',
    },
    courierPartner: {
      type: String,
      enum: ['PATHAO', 'STEADFAST'],
      required: true,
    },
    consignmentId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    trackingCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    recipientName: {
      type: String,
      required: true,
      trim: true,
    },
    recipientPhone: {
      type: String,
      required: true,
      trim: true,
    },
    recipientAddress: {
      type: String,
      required: true,
      trim: true,
    },
    weightKg: {
      type: Number,
      required: true,
      min: 0,
    },
    codAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    courierFee: {
      type: Number,
      default: 0,
      min: 0,
    },
    deliveryStatus: {
      type: String,
      enum: ['BOOKED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'RTO_RETURNED', 'CANCELLED'],
      default: 'BOOKED',
    },
    deliveredAt: {
      type: Date,
    },
    remittanceId: {
      type: String,
      trim: true,
    },
    remittanceAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Explicit canonical indexes per Database-Schema.md §4.6 & Prompt 24
// Note: consignmentId and trackingCode are declared unique in schema definition
CourierConsignmentSchema.index({ orderId: 1 });
CourierConsignmentSchema.index({ deliveryStatus: 1 });
CourierConsignmentSchema.index({ remittanceId: 1 });

export const CourierConsignmentModel = model<ICourierConsignment>(
  'CourierConsignment',
  CourierConsignmentSchema,
  'courier_consignments'
);
export default CourierConsignmentModel;
