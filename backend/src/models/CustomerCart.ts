import { Schema, model, Document, Types } from 'mongoose';

export interface ICartItem {
  productId: Types.ObjectId;
  sku: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  variant?: string;
  maxQtyAllowed?: number;
}

export interface ICustomerCart extends Document {
  cartId: string;
  customerId?: Types.ObjectId;
  sessionId?: string;
  items: ICartItem[];
  appliedCoupon?: {
    code: string;
    discountType: 'PERCENTAGE' | 'FIXED';
    discountValue: number;
    discountAmount: number;
  };
  subtotal: number;
  discountTotal: number;
  estimatedDeliveryFee: number;
  grandTotal: number;
  createdAt: Date;
  updatedAt: Date;
}

export const CartItemSchema = new Schema<ICartItem>(
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
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },
    imageUrl: {
      type: String,
    },
    variant: {
      type: String,
    },
    maxQtyAllowed: {
      type: Number,
      default: 50,
    },
  },
  { _id: false }
);

export const CustomerCartSchema = new Schema<ICustomerCart>(
  {
    cartId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    customerId: {
      type: Schema.Types.ObjectId,
      ref: 'Customer',
      index: true,
    },
    sessionId: {
      type: String,
      index: true,
    },
    items: [CartItemSchema],
    appliedCoupon: {
      code: { type: String, trim: true, uppercase: true },
      discountType: { type: String, enum: ['PERCENTAGE', 'FIXED'] },
      discountValue: { type: Number },
      discountAmount: { type: Number, default: 0 },
    },
    subtotal: {
      type: Number,
      default: 0,
    },
    discountTotal: {
      type: Number,
      default: 0,
    },
    estimatedDeliveryFee: {
      type: Number,
      default: 120, // Standard Dhaka delivery in BDT
    },
    grandTotal: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Auto-purge abandoned carts after 30 days of inactivity
CustomerCartSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 2592000 });

export const CustomerCart = model<ICustomerCart>('CustomerCart', CustomerCartSchema);
