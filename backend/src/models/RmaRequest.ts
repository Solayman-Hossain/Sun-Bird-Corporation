import { Schema, model, Document, Types } from 'mongoose';

export type RmaItemReason =
  | 'DEFECTIVE'
  | 'TRANSIT_DAMAGE'
  | 'INCORRECT_ITEM'
  | 'NOT_AS_DESCRIBED'
  | 'EXPIRED'
  | 'CUSTOMER_CHANGE_MIND';

export type RmaRequestedAction = 'REPLACEMENT' | 'REFUND' | 'EXCHANGE' | 'REPAIR';

export type RmaReturnType =
  | 'RETURN_FOR_REFUND'
  | 'RETURN_FOR_REPLACEMENT'
  | 'RETURN_FOR_EXCHANGE'
  | 'RETURN_FOR_REPAIR';

export type RmaStatus =
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'SHIPPING_REQUESTED'
  | 'RECEIVED'
  | 'INSPECTED'
  | 'COMPLETED'
  | 'CANCELLED';

export interface IRmaItem {
  productId: Types.ObjectId;
  productName: string;
  productSku: string;
  serialNumber?: string;
  batchNumber?: string;
  quantity: number;
  unitPrice: number;
  reason: RmaItemReason;
  reasonDetails?: string;
  requestedAction: RmaRequestedAction;
  exchangeProductId?: Types.ObjectId;
  exchangeProductName?: string;
}

export interface IRmaRequest extends Document {
  _id: Types.ObjectId;
  organizationId: Types.ObjectId;
  rmaNumber: string; // RMA-2026-0001
  ticketId?: Types.ObjectId;
  orderId?: Types.ObjectId;
  orderNumber?: string;
  invoiceNumber?: string;
  customerId?: Types.ObjectId;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  items: IRmaItem[];
  returnType: RmaReturnType;
  status: RmaStatus;
  approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  approvedBy?: Types.ObjectId;
  approvedAt?: Date;
  rejectionReason?: string;
  shippingMethod: 'CUSTOMER_DROP_OFF' | 'COURIER_PICKUP' | 'COMPANY_DRIVER';
  pickupAddress?: string;
  courierTrackingNumber?: string;
  courierName?: string;
  pickupScheduledDate?: Date;
  receivedAtWarehouseId?: Types.ObjectId;
  receivedDate?: Date;
  totalReturnAmount: number;
  refundStatus: 'NOT_APPLICABLE' | 'PENDING_APPROVAL' | 'APPROVED' | 'REFUNDED';
  refundVoucherNumber?: string;
  replacementOrderId?: Types.ObjectId;
  replacementOrderNumber?: string;
  aiEligibilityAssessment?: {
    isEligible: boolean;
    confidenceScore: number;
    policyViolations: string[];
    recommendedAction: string;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  };
  internalNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const RmaRequestSchema = new Schema<IRmaRequest>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    rmaNumber: { type: String, required: true, unique: true, uppercase: true, trim: true },
    ticketId: { type: Schema.Types.ObjectId, ref: 'SupportTicket' },
    orderId: { type: Schema.Types.ObjectId, ref: 'Order' },
    orderNumber: { type: String, trim: true },
    invoiceNumber: { type: String, trim: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer' },
    customerName: { type: String, required: true, trim: true },
    customerPhone: { type: String, required: true, trim: true },
    customerEmail: { type: String, lowercase: true, trim: true },
    items: [
      {
        productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
        productName: { type: String, required: true },
        productSku: { type: String, required: true },
        serialNumber: { type: String },
        batchNumber: { type: String },
        quantity: { type: Number, required: true, min: 1 },
        unitPrice: { type: Number, required: true, default: 0 },
        reason: {
          type: String,
          enum: ['DEFECTIVE', 'TRANSIT_DAMAGE', 'INCORRECT_ITEM', 'NOT_AS_DESCRIBED', 'EXPIRED', 'CUSTOMER_CHANGE_MIND'],
          required: true,
        },
        reasonDetails: { type: String },
        requestedAction: {
          type: String,
          enum: ['REPLACEMENT', 'REFUND', 'EXCHANGE', 'REPAIR'],
          default: 'REPLACEMENT',
        },
        exchangeProductId: { type: Schema.Types.ObjectId, ref: 'Product' },
        exchangeProductName: { type: String },
      },
    ],
    returnType: {
      type: String,
      enum: ['RETURN_FOR_REFUND', 'RETURN_FOR_REPLACEMENT', 'RETURN_FOR_EXCHANGE', 'RETURN_FOR_REPAIR'],
      default: 'RETURN_FOR_REPLACEMENT',
      index: true,
    },
    status: {
      type: String,
      enum: ['SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'SHIPPING_REQUESTED', 'RECEIVED', 'INSPECTED', 'COMPLETED', 'CANCELLED'],
      default: 'SUBMITTED',
      index: true,
    },
    approvalStatus: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED'],
      default: 'PENDING',
    },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    approvedAt: { type: Date },
    rejectionReason: { type: String },
    shippingMethod: {
      type: String,
      enum: ['CUSTOMER_DROP_OFF', 'COURIER_PICKUP', 'COMPANY_DRIVER'],
      default: 'COURIER_PICKUP',
    },
    pickupAddress: { type: String },
    courierTrackingNumber: { type: String },
    courierName: { type: String },
    pickupScheduledDate: { type: Date },
    receivedAtWarehouseId: { type: Schema.Types.ObjectId, ref: 'Warehouse' },
    receivedDate: { type: Date },
    totalReturnAmount: { type: Number, default: 0 },
    refundStatus: {
      type: String,
      enum: ['NOT_APPLICABLE', 'PENDING_APPROVAL', 'APPROVED', 'REFUNDED'],
      default: 'NOT_APPLICABLE',
    },
    refundVoucherNumber: { type: String },
    replacementOrderId: { type: Schema.Types.ObjectId, ref: 'Order' },
    replacementOrderNumber: { type: String },
    aiEligibilityAssessment: {
      isEligible: { type: Boolean },
      confidenceScore: { type: Number },
      policyViolations: [{ type: String }],
      recommendedAction: { type: String },
      riskLevel: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH'] },
    },
    internalNotes: { type: String },
  },
  {
    timestamps: true,
  }
);

RmaRequestSchema.index({ organizationId: 1, status: 1 });
RmaRequestSchema.index({ organizationId: 1, customerPhone: 1 });

export const RmaRequest = model<IRmaRequest>('RmaRequest', RmaRequestSchema);
