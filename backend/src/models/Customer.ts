import { Schema, model, Document } from 'mongoose';

export type CustomerType = 'RETAIL' | 'B2B_HOSPITAL' | 'B2B_CLINIC' | 'RESELLER';
export type RegisteredVia = 'WEB' | 'MOBILE' | 'WALK_IN' | 'B2B_PORTAL';

export interface ICustomer extends Document {
  fullName: string;
  email?: string;
  mobile: string;
  customerType: CustomerType;
  billingAddress?: string;
  shippingAddress?: string;
  companyName?: string;
  buyerBin?: string;
  isGuest: boolean;
  isActive: boolean;
  registeredVia: RegisteredVia;
  createdAt: Date;
  updatedAt: Date;
}

export const CustomerSchema = new Schema<ICustomer>(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      sparse: true,
    },
    mobile: {
      type: String,
      required: true,
      trim: true,
    },
    customerType: {
      type: String,
      enum: ['RETAIL', 'B2B_HOSPITAL', 'B2B_CLINIC', 'RESELLER'],
      default: 'RETAIL',
      required: true,
    },
    billingAddress: {
      type: String,
      trim: true,
    },
    shippingAddress: {
      type: String,
      trim: true,
    },
    companyName: {
      type: String,
      trim: true,
    },
    buyerBin: {
      type: String,
      trim: true,
    },
    isGuest: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    registeredVia: {
      type: String,
      enum: ['WEB', 'MOBILE', 'WALK_IN', 'B2B_PORTAL'],
      default: 'WEB',
    },
  },
  {
    timestamps: true,
  }
);

// Explicit canonical indexes per Database-Schema.md §4.1 & Prompt 24
CustomerSchema.index({ mobile: 1 }, { unique: true });
CustomerSchema.index({ customerType: 1, isActive: 1 });
CustomerSchema.index({ companyName: 1 }, { sparse: true });
CustomerSchema.index({ isGuest: 1 });

export const CustomerModel = model<ICustomer>('Customer', CustomerSchema, 'customers');
export default CustomerModel;
