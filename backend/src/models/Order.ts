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
  | 'PENDING'
  | 'PARTIALLY_PENDING'
  | 'CONFIRMED'
  | 'ALLOCATED'
  | 'DISPATCHED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'RTO_IN_TRANSIT'
  | 'RESTOCKED'
  | 'CART'
  | 'UNVERIFIED_COD'
  | 'CREDIT_LIMIT_EXCEEDED'
  | 'PACKING'
  | 'RETURNED';

export interface IOrderItem {
  productId: Types.ObjectId;
  sku: string;
  batchNumber?: string;
  qty: number;
  uom: string;
  unitPrice: number;
  lineTotal: number;
  vatAmount: number;
}

export interface IOrder extends Document {
  orderNo: string;
  customerId: Types.ObjectId;
  salesRepId?: Types.ObjectId;
  orderChannel: OrderChannel;
  channel?: OrderChannel;
  items: IOrderItem[];
  subtotal: number;
  vatTotal: number;
  grandTotal: number;
  paymentMethod: PaymentMethod;
  codOtpStatus: CodOtpStatus;
  paymentStatus: OrderPaymentStatus;
  orderStatus: OrderStatus;
  redisReservationKey?: string;
  shippingAddress: string;
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
    batchNumber: {
      type: String,
      trim: true,
    },
    qty: {
      type: Number,
      required: true,
      min: 1,
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
    customerId: {
      type: Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
    },
    salesRepId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    orderChannel: {
      type: String,
      enum: [
        'ECOMMERCE',
        'POS_SHOWROOM',
        'B2B_DIRECT',
        'RESELLER',
        'WEB',
        'MOBILE',
        'POS',
        'B2B_PORTAL',
      ],
      required: true,
      default: 'ECOMMERCE',
    },
    channel: {
      type: String,
      enum: [
        'ECOMMERCE',
        'POS_SHOWROOM',
        'B2B_DIRECT',
        'RESELLER',
        'WEB',
        'MOBILE',
        'POS',
        'B2B_PORTAL',
      ],
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
    vatTotal: {
      type: Number,
      default: 0,
      min: 0,
    },
    grandTotal: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentMethod: {
      type: String,
      enum: ['COD', 'ONLINE', 'ONLINE_SSLCOMMERZ', 'BANK_TRANSFER', 'CREDIT'],
      required: true,
    },
    codOtpStatus: {
      type: String,
      enum: ['NOT_REQUIRED', 'PENDING', 'VERIFIED'],
      default: 'NOT_REQUIRED',
    },
    paymentStatus: {
      type: String,
      enum: ['UNPAID', 'PAID', 'PARTIAL', 'COLLECTED', 'SETTLED', 'RECONCILED', 'REFUNDED'],
      default: 'UNPAID',
    },
    orderStatus: {
      type: String,
      enum: [
        'PENDING',
        'PARTIALLY_PENDING',
        'CONFIRMED',
        'ALLOCATED',
        'DISPATCHED',
        'DELIVERED',
        'CANCELLED',
        'RTO_IN_TRANSIT',
        'RESTOCKED',
        'CART',
        'UNVERIFIED_COD',
        'CREDIT_LIMIT_EXCEEDED',
        'PACKING',
        'RETURNED',
      ],
      default: 'PENDING',
    },
    redisReservationKey: {
      type: String,
    },
    shippingAddress: {
      type: String,
      required: true,
      trim: true,
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
