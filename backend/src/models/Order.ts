import { Schema, model, Document, Types } from 'mongoose';

export type OrderChannel =
  | 'ECOMMERCE'
  | 'POS_SHOWROOM'
  | 'B2B_DIRECT'
  | 'RESELLER'
  | 'WEB'
  | 'MOBILE'
  | 'POS'
  | 'B2B_PORTAL';

export type PaymentMethod =
  | 'COD'
  | 'ONLINE'
  | 'ONLINE_SSLCOMMERZ'
  | 'BANK_TRANSFER'
  | 'CREDIT';
export type CodOtpStatus = 'NOT_REQUIRED' | 'PENDING' | 'VERIFIED';
export type OrderPaymentStatus =
  | 'UNPAID'
  | 'PAID'
  | 'PARTIAL'
  | 'COLLECTED'
  | 'SETTLED'
  | 'RECONCILED'
  | 'REFUNDED';

export type OrderStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'PENDING'
  | 'PENDING_VERIFICATION'
  | 'PENDING_APPROVAL'
  | 'PARTIALLY_PENDING'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'PARTIALLY_RESERVED'
  | 'RESERVED'
  | 'ALLOCATED'
  | 'PICKING'
  | 'PICKED'
  | 'PACKING'
  | 'PACKED'
  | 'READY_FOR_DISPATCH'
  | 'DISPATCHED'
  | 'IN_TRANSIT'
  | 'OUT_FOR_DELIVERY'
  | 'PARTIALLY_DELIVERED'
  | 'DELIVERED'
  | 'COMPLETED'
  | 'ON_HOLD'
  | 'PAYMENT_PENDING'
  | 'CANCELLED'
  | 'REJECTED'
  | 'RTO_IN_TRANSIT'
  | 'RESTOCKED'
  | 'CART'
  | 'UNVERIFIED_COD'
  | 'CREDIT_LIMIT_EXCEEDED'
  | 'RETURNED';

export interface IOrderItem {
  productId: Types.ObjectId;
  sku: string;
  productName?: string;
  barcode?: string;
  batchNumber?: string;
  batchId?: Types.ObjectId;
  warehouseId?: Types.ObjectId;
  locationBin?: string;
  qty: number;
  reservedQty?: number;
  pickedQty?: number;
  packedQty?: number;
  dispatchedQty?: number;
  deliveredQty?: number;
  uom: string;
  unitPrice: number;
  discountAmount?: number;
  taxRate?: number;
  taxAmount?: number;
  lineTotal: number;
  vatAmount: number;
  itemNotes?: string;
}

export interface IOrderTimelineEvent {
  status: string;
  event: string;
  timestamp: Date;
  userId?: Types.ObjectId;
  userName?: string;
  description?: string;
  metadata?: Record<string, any>;
}

export interface IOrderPaymentRecord {
  paymentNumber: string;
  paymentMethod: string;
  amount: number;
  transactionRef?: string;
  paymentDate: Date;
  status: 'PENDING' | 'VERIFIED' | 'REJECTED' | 'REFUNDED';
  verifiedBy?: Types.ObjectId;
  verifiedAt?: Date;
  rejectionReason?: string;
  notes?: string;
  evidenceUrl?: string;
}

export interface IOrder extends Document {
  orderNo: string;
  organizationId?: Types.ObjectId;
  warehouseId?: Types.ObjectId;
  customerId: Types.ObjectId;
  salesRepId?: Types.ObjectId;
  orderSource?: string;
  orderChannel: OrderChannel;
  channel?: OrderChannel;
  externalReference?: string;
  items: IOrderItem[];
  subtotal: number;
  discountTotal?: number;
  vatTotal: number;
  shippingCharge?: number;
  grandTotal: number;
  paidAmount?: number;
  dueAmount?: number;
  paymentMethod: PaymentMethod;
  codOtpStatus: CodOtpStatus;
  paymentStatus: OrderPaymentStatus;
  orderStatus: OrderStatus;
  redisReservationKey?: string;
  shippingAddress: string;
  billingAddress?: string;
  contactPhone?: string;
  contactEmail?: string;
  deliveryInstructions?: string;
  notes?: string;
  deliveryDate?: Date;
  requiredDeliveryDate?: Date;
  isHold?: boolean;
  holdReason?: string;
  holdBy?: Types.ObjectId;
  holdAt?: Date;
  releaseHoldReason?: string;
  cancelledReason?: string;
  cancelledBy?: Types.ObjectId;
  cancelledAt?: Date;
  approvalStatus?: 'NOT_REQUIRED' | 'PENDING' | 'APPROVED' | 'REJECTED';
  approvalRequestId?: Types.ObjectId;
  pickingStatus?: 'PENDING' | 'ASSIGNED' | 'IN_PROGRESS' | 'PARTIALLY_PICKED' | 'PICKED' | 'FAILED' | 'CANCELLED';
  packingStatus?: 'PENDING' | 'IN_PROGRESS' | 'PARTIALLY_PACKED' | 'PACKED' | 'REPACKED' | 'CANCELLED';
  dispatchStatus?: 'PENDING' | 'READY' | 'ASSIGNED' | 'DISPATCHED' | 'IN_TRANSIT' | 'DELAYED' | 'FAILED' | 'RETURNED' | 'DELIVERED' | 'CANCELLED';
  deliveryStatus?: 'PENDING' | 'ASSIGNED' | 'DISPATCHED' | 'IN_TRANSIT' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'PARTIALLY_DELIVERED' | 'FAILED' | 'CUSTOMER_UNAVAILABLE' | 'RESCHEDULED' | 'RETURNED' | 'CANCELLED';
  codStatus?: 'NOT_APPLICABLE' | 'PENDING_COLLECTION' | 'COLLECTED' | 'PARTIALLY_COLLECTED' | 'NOT_COLLECTED' | 'DEPOSITED' | 'RECONCILED' | 'DISPUTED';
  codCollectionAmount?: number;
  codCollectionDate?: Date;
  codDepositDate?: Date;
  codDepositAccount?: number;
  codCollectionNotes?: string;
  timeline?: IOrderTimelineEvent[];
  paymentRecords?: IOrderPaymentRecord[];
  splitShipmentRef?: Types.ObjectId[];
  creditOverrideBy?: Types.ObjectId;
  idempotencyKey?: string;
  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema = new Schema<IOrderItem>(
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
      trim: true,
    },
    barcode: {
      type: String,
      trim: true,
    },
    batchNumber: {
      type: String,
      trim: true,
    },
    batchId: {
      type: Schema.Types.ObjectId,
      ref: 'ProductBatch',
    },
    warehouseId: {
      type: Schema.Types.ObjectId,
      ref: 'Warehouse',
    },
    locationBin: {
      type: String,
      trim: true,
    },
    qty: {
      type: Number,
      required: true,
      min: 1,
    },
    reservedQty: {
      type: Number,
      default: 0,
      min: 0,
    },
    pickedQty: {
      type: Number,
      default: 0,
      min: 0,
    },
    packedQty: {
      type: Number,
      default: 0,
      min: 0,
    },
    dispatchedQty: {
      type: Number,
      default: 0,
      min: 0,
    },
    deliveredQty: {
      type: Number,
      default: 0,
      min: 0,
    },
    uom: {
      type: String,
      required: true,
      trim: true,
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    discountAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    taxRate: {
      type: Number,
      default: 0,
      min: 0,
    },
    taxAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    lineTotal: {
      type: Number,
      required: true,
      min: 0,
    },
    vatAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    itemNotes: {
      type: String,
      trim: true,
    },
  },
  { _id: false }
);

const TimelineEventSchema = new Schema<IOrderTimelineEvent>(
  {
    status: { type: String, required: true },
    event: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    userName: { type: String },
    description: { type: String },
    metadata: { type: Schema.Types.Mixed },
  },
  { _id: false }
);

const PaymentRecordSchema = new Schema<IOrderPaymentRecord>(
  {
    paymentNumber: { type: String, required: true },
    paymentMethod: { type: String, required: true },
    amount: { type: Number, required: true, min: 0 },
    transactionRef: { type: String },
    paymentDate: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ['PENDING', 'VERIFIED', 'REJECTED', 'REFUNDED'],
      default: 'PENDING',
    },
    verifiedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    verifiedAt: { type: Date },
    rejectionReason: { type: String },
    notes: { type: String },
    evidenceUrl: { type: String },
  },
  { _id: false }
);

export const OrderSchema = new Schema<IOrder>(
  {
    orderNo: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      index: true,
    },
    warehouseId: {
      type: Schema.Types.ObjectId,
      ref: 'Warehouse',
      index: true,
    },
    customerId: {
      type: Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
      index: true,
    },
    salesRepId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    orderSource: {
      type: String,
      default: 'ECOMMERCE',
      trim: true,
    },
    orderChannel: {
      type: String,
      required: true,
      default: 'ECOMMERCE',
    },
    channel: {
      type: String,
    },
    externalReference: {
      type: String,
      trim: true,
    },
    items: {
      type: [OrderItemSchema],
      required: true,
      validate: [(val: IOrderItem[]) => val.length > 0, 'Order must contain at least one item'],
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    discountTotal: {
      type: Number,
      default: 0,
      min: 0,
    },
    vatTotal: {
      type: Number,
      default: 0,
      min: 0,
    },
    shippingCharge: {
      type: Number,
      default: 0,
      min: 0,
    },
    grandTotal: {
      type: Number,
      required: true,
      min: 0,
    },
    paidAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    dueAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    paymentMethod: {
      type: String,
      required: true,
    },
    codOtpStatus: {
      type: String,
      enum: ['NOT_REQUIRED', 'PENDING', 'VERIFIED'],
      default: 'NOT_REQUIRED',
    },
    paymentStatus: {
      type: String,
      default: 'UNPAID',
    },
    orderStatus: {
      type: String,
      default: 'PENDING',
      index: true,
    },
    redisReservationKey: {
      type: String,
    },
    shippingAddress: {
      type: String,
      required: true,
      trim: true,
    },
    billingAddress: {
      type: String,
      trim: true,
    },
    contactPhone: {
      type: String,
      trim: true,
    },
    contactEmail: {
      type: String,
      trim: true,
    },
    deliveryInstructions: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    deliveryDate: {
      type: Date,
    },
    requiredDeliveryDate: {
      type: Date,
    },
    isHold: {
      type: Boolean,
      default: false,
    },
    holdReason: {
      type: String,
      trim: true,
    },
    holdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    holdAt: {
      type: Date,
    },
    releaseHoldReason: {
      type: String,
      trim: true,
    },
    cancelledReason: {
      type: String,
      trim: true,
    },
    cancelledBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    cancelledAt: {
      type: Date,
    },
    approvalStatus: {
      type: String,
      enum: ['NOT_REQUIRED', 'PENDING', 'APPROVED', 'REJECTED'],
      default: 'NOT_REQUIRED',
    },
    approvalRequestId: {
      type: Schema.Types.ObjectId,
      ref: 'ApprovalRequest',
    },
    pickingStatus: {
      type: String,
      default: 'PENDING',
    },
    packingStatus: {
      type: String,
      default: 'PENDING',
    },
    dispatchStatus: {
      type: String,
      default: 'PENDING',
    },
    deliveryStatus: {
      type: String,
      default: 'PENDING',
    },
    codStatus: {
      type: String,
      default: 'NOT_APPLICABLE',
    },
    codCollectionAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    codCollectionDate: {
      type: Date,
    },
    codDepositDate: {
      type: Date,
    },
    codDepositAccount: {
      type: Number,
    },
    codCollectionNotes: {
      type: String,
    },
    timeline: {
      type: [TimelineEventSchema],
      default: [],
    },
    paymentRecords: {
      type: [PaymentRecordSchema],
      default: [],
    },
    splitShipmentRef: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Order',
      },
    ],
    creditOverrideBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    idempotencyKey: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Explicit canonical indexes per Database-Schema.md §4.3 & Prompt 24
// Note: orderNo has unique: true in schema definition
OrderSchema.index({ customerId: 1, orderStatus: 1 });
OrderSchema.index({ orderStatus: 1, createdAt: -1 });
OrderSchema.index({ paymentStatus: 1 });
OrderSchema.index({ salesRepId: 1 });
OrderSchema.index({ createdAt: -1 });

export const OrderModel = model<IOrder>('Order', OrderSchema, 'orders');
export default OrderModel;
