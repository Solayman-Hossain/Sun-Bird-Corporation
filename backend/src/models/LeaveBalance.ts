import { Schema, model, Document, Types } from 'mongoose';

export interface ILeaveBalance extends Document {
  _id: Types.ObjectId;
  employeeId: Types.ObjectId;
  leaveTypeId: Types.ObjectId;
  year: number;
  allocatedDays: number;
  usedDays: number;
  remainingDays: number;
  carriedForwardDays: number;
  organizationId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export const LeaveBalanceSchema = new Schema<ILeaveBalance>(
  {
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: 'EmployeeProfile',
      required: [true, 'Employee reference is required'],
    },
    leaveTypeId: {
      type: Schema.Types.ObjectId,
      ref: 'LeaveType',
      required: [true, 'Leave type is required'],
    },
    year: {
      type: Number,
      required: [true, 'Year is required'],
    },
    allocatedDays: {
      type: Number,
      required: [true, 'Allocated days is required'],
      min: 0,
    },
    usedDays: {
      type: Number,
      default: 0,
      min: 0,
    },
    remainingDays: {
      type: Number,
      default: 0,
      min: 0,
    },
    carriedForwardDays: {
      type: Number,
      default: 0,
      min: 0,
    },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
    },
  },
  {
    timestamps: true,
  }
);

LeaveBalanceSchema.pre('validate', function (next) {
  this.remainingDays = Math.max(0, (this.allocatedDays || 0) + (this.carriedForwardDays || 0) - (this.usedDays || 0));
  next();
});

LeaveBalanceSchema.index({ employeeId: 1, leaveTypeId: 1, year: 1 }, { unique: true });

export const LeaveBalanceModel = model<ILeaveBalance>('LeaveBalance', LeaveBalanceSchema);
