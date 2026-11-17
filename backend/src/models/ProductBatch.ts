import { Schema, model, Document, Types } from 'mongoose';

export type ProductBatchCategory = 'EXPIRY_CONTROLLED' | 'NON_EXPIRING';
export type LocationStatus = 'ON_HAND' | 'IN_TRANSIT';

export interface IProductBatch extends Document {
  _id: Types.ObjectId;
  organizationId?: Types.ObjectId;
  productId: Types.ObjectId;
  sku: string;
  batchNumber: string;
  category: ProductBatchCategory;
  manufacturingDate?: Date;
  expiryDate?: Date;
  baseUom: string;
  currentQty: number; // Available sellable stock
  reservedQty: number; // TTL-locked by cart/orders
  damagedQty?: number;
  expiredQty?: number;
  unitCost: number; // Moving WAC unit cost in BDT
  hasIndividualSerials: boolean;
  warrantyMonths: number;
  warehouseId: Types.ObjectId;
  binId?: Types.ObjectId;
  locationStatus: LocationStatus;
  createdAt: Date;
  updatedAt: Date;
}

export const ProductBatchSchema = new Schema<IProductBatch>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
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
    batchNumber: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: ['EXPIRY_CONTROLLED', 'NON_EXPIRING'],
      required: true,
    },
    manufacturingDate: {
      type: Date,
    },
    expiryDate: {
      type: Date,
    },
    baseUom: {
      type: String,
      required: true,
      trim: true,
    },
    currentQty: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    reservedQty: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    damagedQty: {
      type: Number,
      default: 0,
      min: 0,
    },
    expiredQty: {
      type: Number,
      default: 0,
      min: 0,
    },
    unitCost: {
      type: Number,
      required: true,
      min: 0,
    },
    hasIndividualSerials: {
      type: Boolean,
      default: false,
    },
    warrantyMonths: {
      type: Number,
      default: 0,
      min: 0,
    },
    warehouseId: {
      type: Schema.Types.ObjectId,
      ref: 'Warehouse',
      required: true,
    },
    binId: {
      type: Schema.Types.ObjectId,
      ref: 'WarehouseBin',
    },
    locationStatus: {
      type: String,
      enum: ['ON_HAND', 'IN_TRANSIT'],
      default: 'ON_HAND',
    },
  },
  {
    timestamps: true,
  }
);

// Explicit canonical index declarations per Database-Schema.md §2.3
ProductBatchSchema.index({ sku: 1, batchNumber: 1, warehouseId: 1 }, { unique: true });
ProductBatchSchema.index({ expiryDate: 1 });
ProductBatchSchema.index({ warehouseId: 1, currentQty: 1 });
ProductBatchSchema.index({ organizationId: 1, currentQty: 1 });
ProductBatchSchema.index({ productId: 1 });

export const ProductBatchModel = model<IProductBatch>(
  'ProductBatch',
  ProductBatchSchema,
  'product_batches'
);
export default ProductBatchModel;
