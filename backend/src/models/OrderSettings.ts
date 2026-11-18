import { Schema, model, Document, Types } from 'mongoose';

export interface IOrderSettings extends Document {
  organizationId: Types.ObjectId;
  orderPrefix: string;
  autoConfirmOnlineOrders: boolean;
  autoReserveOnConfirm: boolean;
  autoInvoiceOnDelivery: boolean;
  requirePaymentVerificationForBank: boolean;
  codMaxLimit: number;
  defaultWarehouseId?: Types.ObjectId;
  courierPartners: string[];
  cancellationAllowedStatuses: string[];
  approvalThresholdAmount: number;
  allowPartialDelivery: boolean;
  defaultPaymentTerms: string;
  orderNotesTemplate?: string;
  createdAt: Date;
  updatedAt: Date;
}

export const OrderSettingsSchema = new Schema<IOrderSettings>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      unique: true,
      index: true,
    },
    orderPrefix: {
      type: String,
      default: 'SBC-ORD',
      trim: true,
      uppercase: true,
    },
    autoConfirmOnlineOrders: {
      type: Boolean,
      default: false,
    },
    autoReserveOnConfirm: {
      type: Boolean,
      default: true,
    },
    autoInvoiceOnDelivery: {
      type: Boolean,
      default: true,
    },
    requirePaymentVerificationForBank: {
      type: Boolean,
      default: true,
    },
    codMaxLimit: {
      type: Number,
      default: 50000,
      min: 0,
    },
    defaultWarehouseId: {
      type: Schema.Types.ObjectId,
      ref: 'Warehouse',
    },
    courierPartners: {
      type: [String],
      default: ['PATHAO', 'STEADFAST', 'OWN_FLEET'],
    },
    cancellationAllowedStatuses: {
      type: [String],
      default: ['DRAFT', 'SUBMITTED', 'PENDING', 'PENDING_VERIFICATION', 'CONFIRMED', 'PROCESSING', 'RESERVED', 'ON_HOLD'],
    },
    approvalThresholdAmount: {
      type: Number,
      default: 500000,
      min: 0,
    },
    allowPartialDelivery: {
      type: Boolean,
      default: true,
    },
    defaultPaymentTerms: {
      type: String,
      default: '30_DAYS',
    },
    orderNotesTemplate: {
      type: String,
      default: 'Thank you for choosing Sun Bird Corporation. Please inspect goods upon delivery.',
    },
  },
  { timestamps: true }
);

export const OrderSettingsModel = model<IOrderSettings>(
  'OrderSettings',
  OrderSettingsSchema,
  'order_settings'
);
export default OrderSettingsModel;
