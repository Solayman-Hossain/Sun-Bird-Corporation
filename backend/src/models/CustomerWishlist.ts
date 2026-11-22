import { Schema, model, Document, Types } from 'mongoose';

export interface IWishlistItem {
  productId: Types.ObjectId;
  sku: string;
  name: string;
  price: number;
  imageUrl?: string;
  addedAt: Date;
}

export interface ICustomerWishlist extends Document {
  customerId?: Types.ObjectId;
  sessionId?: string;
  items: IWishlistItem[];
  createdAt: Date;
  updatedAt: Date;
}

export const WishlistItemSchema = new Schema<IWishlistItem>(
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
    imageUrl: {
      type: String,
    },
    addedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

export const CustomerWishlistSchema = new Schema<ICustomerWishlist>(
  {
    customerId: {
      type: Schema.Types.ObjectId,
      ref: 'Customer',
      index: true,
    },
    sessionId: {
      type: String,
      index: true,
    },
    items: [WishlistItemSchema],
  },
  {
    timestamps: true,
  }
);

// Auto-purge abandoned guest wishlists after 60 days
CustomerWishlistSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 5184000 });

export const CustomerWishlist = model<ICustomerWishlist>('CustomerWishlist', CustomerWishlistSchema);
