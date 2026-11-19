import { Schema, model, Document, Types } from 'mongoose';

export type AttendanceCorrectionStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface IAttendanceCorrection extends Document {
  _id: Types.ObjectId;
  employeeId: Types.ObjectId;
  date: string; // YYYY-MM-DD
  requestedInTime?: Date;
  requestedOutTime?: Date;
  reason: string;
  status: AttendanceCorrectionStatus;
  approvedBy?: Types.ObjectId;
  approvalRemarks?: string;
  organizationId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export const AttendanceCorrectionSchema = new Schema<IAttendanceCorrection>(
  {
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: 'EmployeeProfile',
      required: [true, 'Employee reference is required'],
    },
    date: {
      type: String,
      required: [true, 'Attendance date (YYYY-MM-DD) is required'],
      match: [/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'],
    },
    requestedInTime: {
      type: Date,
    },
    requestedOutTime: {
      type: Date,
    },
    reason: {
      type: String,
      required: [true, 'Reason for correction is required'],
      trim: true,
    },
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED'],
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

AttendanceCorrectionSchema.index({ employeeId: 1, date: 1 });
AttendanceCorrectionSchema.index({ status: 1 });

export const AttendanceCorrectionModel = model<IAttendanceCorrection>(
  'AttendanceCorrection',
  AttendanceCorrectionSchema
);
