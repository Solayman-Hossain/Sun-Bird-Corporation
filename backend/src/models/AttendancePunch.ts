import { Schema, model, Document, Types } from 'mongoose';

export type PunchType = 'IN' | 'OUT';

export interface IAttendancePunch extends Document {
  _id: Types.ObjectId;
  employeeId: Types.ObjectId;
  punchType: PunchType;
  punchTimestamp: Date;
  punchDate: string; // "YYYY-MM-DD"
  latitude: number;
  longitude: number;
  distanceMeters: number;
  isWithinGeofence: boolean;
  isPresent: boolean;
  deviceUUID?: string;
  isLate: boolean;
  isLWP: boolean;
  approvedLeaveId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export const AttendancePunchSchema = new Schema<IAttendancePunch>(
  {
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: 'EmployeeProfile',
      required: [true, 'Employee reference is required for attendance punch'],
    },
    punchType: {
      type: String,
      enum: {
        values: ['IN', 'OUT'],
        message: 'Punch type must be either IN or OUT',
      },
      required: [true, 'Punch type is required'],
    },
    punchTimestamp: {
      type: Date,
      required: [true, 'Punch timestamp is required'],
      default: Date.now,
    },
    punchDate: {
      type: String,
      required: [true, 'Punch date string (YYYY-MM-DD) is required'],
      trim: true,
      match: [/^\d{4}-\d{2}-\d{2}$/, 'Punch date must follow YYYY-MM-DD format'],
    },
    latitude: {
      type: Number,
      required: [true, 'GPS latitude is required'],
    },
    longitude: {
      type: Number,
      required: [true, 'GPS longitude is required'],
    },
    distanceMeters: {
      type: Number,
      required: [true, 'Distance in meters from geofence is required'],
      min: [0, 'Distance cannot be negative'],
    },
    isWithinGeofence: {
      type: Boolean,
      required: [true, 'Geofence status is required'],
    },
    isPresent: {
      type: Boolean,
      default: true,
    },
    deviceUUID: {
      type: String,
      trim: true,
    },
    isLate: {
      type: Boolean,
      default: false,
    },
    isLWP: {
      type: Boolean,
      default: false,
    },
    approvedLeaveId: {
      type: Schema.Types.ObjectId,
      ref: 'LeaveRequest',
    },
  },
  {
    timestamps: true,
  }
);

// Pre-validate hook: auto-fill punchDate from punchTimestamp if not provided
AttendancePunchSchema.pre('validate', function (next) {
  if (this.punchTimestamp && !this.punchDate) {
    this.punchDate = this.punchTimestamp.toISOString().slice(0, 10);
  }
  // Auto-flag isWithinGeofence if <= 50 meters
  if (this.distanceMeters !== undefined && this.isWithinGeofence === undefined) {
    this.isWithinGeofence = this.distanceMeters <= 50;
  }
  next();
});

// Explicit compound indexes per Database-Schema.md §6.2 & Prompt 38
AttendancePunchSchema.index({ employeeId: 1, punchDate: -1 }); // Per-employee daily lookup
AttendancePunchSchema.index({ punchDate: -1 });                 // Date-range payroll aggregation
AttendancePunchSchema.index({ isLate: 1, punchDate: -1 });      // Late arrival monitoring

export const AttendancePunchModel = model<IAttendancePunch>('AttendancePunch', AttendancePunchSchema);
