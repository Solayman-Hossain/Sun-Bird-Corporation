import { Schema, model, Document, Types } from 'mongoose';

export interface IEmploymentType extends Document {
  _id: Types.ObjectId;
  code: string;
  name: string;
  probationMonths?: number;
  hasBenefits: boolean;
  organizationId?: Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const EmploymentTypeSchema = new Schema<IEmploymentType>(
  {
    code: {
      type: String,
      required: [true, 'Employment type code is required'],
      trim: true,
      uppercase: true,
    },
    name: {
      type: String,
      required: [true, 'Employment type name is required'],
      trim: true,
    },
    probationMonths: {
      type: Number,
      default: 6,
      min: 0,
    },
    hasBenefits: {
      type: Boolean,
      default: true,
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

EmploymentTypeSchema.index({ code: 1 }, { unique: true });

export const EmploymentTypeModel = model<IEmploymentType>('EmploymentType', EmploymentTypeSchema);
