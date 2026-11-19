import { Schema, model, Document, Types } from 'mongoose';

export type SalaryComponentType = 'EARNING' | 'DEDUCTION';
export type SalaryCalculationType = 'FIXED' | 'PERCENTAGE';

export interface ISalaryComponent extends Document {
  _id: Types.ObjectId;
  code: string;
  name: string;
  type: SalaryComponentType;
  calculationType: SalaryCalculationType;
  percentageBasis?: 'BASIC' | 'GROSS';
  percentageValue?: number;
  isTaxable: boolean;
  organizationId?: Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const SalaryComponentSchema = new Schema<ISalaryComponent>(
  {
    code: {
      type: String,
      required: [true, 'Component code is required'],
      trim: true,
      uppercase: true,
    },
    name: {
      type: String,
      required: [true, 'Component name is required'],
      trim: true,
    },
    type: {
      type: String,
      enum: ['EARNING', 'DEDUCTION'],
      required: [true, 'Type must be EARNING or DEDUCTION'],
    },
    calculationType: {
      type: String,
      enum: ['FIXED', 'PERCENTAGE'],
      required: [true, 'Calculation type is required'],
    },
    percentageBasis: {
      type: String,
      enum: ['BASIC', 'GROSS'],
    },
    percentageValue: {
      type: Number,
      min: 0,
    },
    isTaxable: {
      type: Boolean,
      default: false,
    },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
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

SalaryComponentSchema.index({ code: 1 }, { unique: true });

export const SalaryComponentModel = model<ISalaryComponent>('SalaryComponent', SalaryComponentSchema);
