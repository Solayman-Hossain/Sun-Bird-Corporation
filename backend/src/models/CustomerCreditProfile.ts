import { Schema, model, Document, Types } from 'mongoose';

export interface ICustomerCreditProfile extends Document {
  customerId: Types.ObjectId;
  creditLimitBDT: number;
  creditTermDays: number;
  currentOutstandingAR: number;
  unbilledDispatches: number;
  isCreditLocked: boolean;
  lockReason?: string;
  approvedByDirector?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export const CustomerCreditProfileSchema = new Schema<ICustomerCreditProfile>(
  {
    customerId: {
      type: Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
      unique: true,
    },
    creditLimitBDT: {
      type: Number,
      required: true,
      default: 0.0,
      min: 0,
    },
    creditTermDays: {
      type: Number,
      required: true,
      default: 30, // Net 15/30/60
    },
    currentOutstandingAR: {
      type: Number,
      default: 0.0,
    },
    unbilledDispatches: {
      type: Number,
      default: 0.0,
    },
    isCreditLocked: {
      type: Boolean,
      default: false,
    },
    lockReason: {
      type: String,
      trim: true,
    },
    approvedByDirector: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Explicit canonical indexes per Database-Schema.md §4.2 & Prompt 24
// customerId is unique in definition, also add schema index
CustomerCreditProfileSchema.index({ isCreditLocked: 1 });

export const CustomerCreditProfileModel = model<ICustomerCreditProfile>(
  'CustomerCreditProfile',
  CustomerCreditProfileSchema,
  'customer_credit_profiles'
);
export default CustomerCreditProfileModel;
