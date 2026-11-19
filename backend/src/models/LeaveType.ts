import { Schema, model, Document, Types } from 'mongoose';

export interface ILeaveType extends Document {
  _id: Types.ObjectId;
  code: string;
  name: string;
  nameBn?: string;
  annualQuota: number;
  isPaid: boolean;
  canCarryForward: boolean;
  maxCarryForwardDays: number;
  organizationId?: Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const LeaveTypeSchema = new Schema<ILeaveType>(
  {
    code: {
      type: String,
      required: [true, 'Leave type code is required'],
      trim: true,
      uppercase: true,
    },
    name: {
      type: String,
      required: [true, 'Leave type name is required'],
      trim: true,
    },
    nameBn: {
      type: String,
      trim: true,
    },
    annualQuota: {
      type: Number,
      required: [true, 'Annual quota is required'],
      min: 0,
    },
    isPaid: {
      type: Boolean,
      default: true,
    },
    canCarryForward: {
      type: Boolean,
      default: false,
    },
    maxCarryForwardDays: {
      type: Number,
      default: 0,
      min: 0,
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

LeaveTypeSchema.index({ code: 1 }, { unique: true });

export const LeaveTypeModel = model<ILeaveType>('LeaveType', LeaveTypeSchema);
