import { Schema, model, Document, Types } from 'mongoose';

export interface IUomConversion extends Document {
  _id: Types.ObjectId;
  productId: Types.ObjectId;
  sku: string;
  fromUom: string;
  toUom: string;
  conversionFactor: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const UomConversionSchema = new Schema<IUomConversion>(
  {
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
    fromUom: {
      type: String,
      required: true,
      trim: true,
    },
    toUom: {
      type: String,
      required: true,
      trim: true,
    },
    conversionFactor: {
      type: Number,
      required: true,
      min: 0.0001,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Explicit canonical index declarations per Database-Schema.md §2.2
UomConversionSchema.index({ productId: 1, fromUom: 1, toUom: 1 }, { unique: true });
UomConversionSchema.index({ sku: 1 });

export const UomConversionModel = model<IUomConversion>(
  'UomConversion',
  UomConversionSchema,
  'uom_conversions'
);
export default UomConversionModel;
