import { Schema, model, Document, Types } from 'mongoose';

export interface IProductAttribute extends Document {
  _id: Types.ObjectId;
  name: string;
  code: string;
  values: string[];
  displayOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const ProductAttributeSchema = new Schema<IProductAttribute>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    values: [
      {
        type: String,
        trim: true,
      },
    ],
    displayOrder: {
      type: Number,
      default: 0,
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

ProductAttributeSchema.index({ isActive: 1, displayOrder: 1 });

export const ProductAttributeModel = model<IProductAttribute>(
  'ProductAttribute',
  ProductAttributeSchema,
  'product_attributes'
);
export default ProductAttributeModel;
