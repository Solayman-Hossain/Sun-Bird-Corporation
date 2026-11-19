import { Schema, model, Document, Types } from 'mongoose';

export type LeaveRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export interface ILeaveRequest extends Document {
  _id: Types.ObjectId;
  requestNo: string;
  employeeId: Types.ObjectId;
  leaveTypeId: Types.ObjectId;
  startDate: Date;
  endDate: Date;
  totalDays: number;
  reason: string;
  handoverEmployeeId?: Types.ObjectId;
  status: LeaveRequestStatus;
  approvedBy?: Types.ObjectId;
  approvalRemarks?: string;
  organizationId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export const LeaveRequestSchema = new Schema<ILeaveRequest>(
  {
    requestNo: {
      type: String,
      required: [true, 'Request number is required'],
      unique: true,
      trim: true,
      uppercase: true,
    },
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
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required'],
    },
    totalDays: {
      type: Number,
      required: [true, 'Total leave days is required'],
      min: [0.5, 'Minimum leave is 0.5 day'],
    },
    reason: {
      type: String,
      required: [true, 'Reason for leave is required'],
      trim: true,
    },
    handoverEmployeeId: {
      type: Schema.Types.ObjectId,
      ref: 'EmployeeProfile',
    },
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'],
      default: 'PENDING',
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    approvalRemarks: {
      type: String,
      trim: true,
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

LeaveRequestSchema.index({ employeeId: 1, startDate: -1 });
LeaveRequestSchema.index({ status: 1 });
LeaveRequestSchema.index({ organizationId: 1, status: 1 });

export const LeaveRequestModel = model<ILeaveRequest>('LeaveRequest', LeaveRequestSchema);
