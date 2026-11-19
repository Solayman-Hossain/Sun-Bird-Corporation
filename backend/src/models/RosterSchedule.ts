import { Schema, model, Document, Types } from 'mongoose';

export interface IRosterSchedule extends Document {
  _id: Types.ObjectId;
  employeeId: Types.ObjectId;
  shiftId: Types.ObjectId;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  notes?: string;
  organizationId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export const RosterScheduleSchema = new Schema<IRosterSchedule>(
  {
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: 'EmployeeProfile',
      required: [true, 'Employee reference is required'],
    },
    shiftId: {
      type: Schema.Types.ObjectId,
      ref: 'Shift',
      required: [true, 'Shift reference is required'],
    },
    startDate: {
      type: String,
      required: [true, 'Start date (YYYY-MM-DD) is required'],
      match: [/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'],
    },
    endDate: {
      type: String,
      required: [true, 'End date (YYYY-MM-DD) is required'],
      match: [/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'],
    },
    notes: {
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

RosterScheduleSchema.index({ employeeId: 1, startDate: 1, endDate: 1 });

export const RosterScheduleModel = model<IRosterSchedule>('RosterSchedule', RosterScheduleSchema);
