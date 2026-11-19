import { Schema, model, Document, Types } from 'mongoose';

export interface IShift extends Document {
  _id: Types.ObjectId;
  shiftCode: string;
  name: string;
  startTime: string; // "09:00"
  endTime: string;   // "18:00"
  graceMinutes: number;
  breakMinutes: number;
  isNightShift: boolean;
  workDays: number[]; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  organizationId?: Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const ShiftSchema = new Schema<IShift>(
  {
    shiftCode: {
      type: String,
      required: [true, 'Shift code is required'],
      trim: true,
      uppercase: true,
    },
    name: {
      type: String,
      required: [true, 'Shift name is required'],
      trim: true,
    },
    startTime: {
      type: String,
      required: [true, 'Start time is required (HH:mm)'],
      trim: true,
    },
    endTime: {
      type: String,
      required: [true, 'End time is required (HH:mm)'],
      trim: true,
    },
    graceMinutes: {
      type: Number,
      default: 15,
      min: 0,
    },
    breakMinutes: {
      type: Number,
      default: 60,
      min: 0,
    },
    isNightShift: {
      type: Boolean,
      default: false,
    },
    workDays: {
      type: [Number],
      default: [0, 1, 2, 3, 4], // Sun-Thu by default in BD or Sun-Thu/Sat
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

ShiftSchema.index({ shiftCode: 1 }, { unique: true });
ShiftSchema.index({ organizationId: 1, isActive: 1 });

export const ShiftModel = model<IShift>('Shift', ShiftSchema);
