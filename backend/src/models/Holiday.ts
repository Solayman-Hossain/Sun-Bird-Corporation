import { Schema, model, Document, Types } from 'mongoose';

export interface IHoliday extends Document {
  _id: Types.ObjectId;
  holidayName: string;
  date: string; // YYYY-MM-DD
  isOptional: boolean;
  description?: string;
  organizationId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export const HolidaySchema = new Schema<IHoliday>(
  {
    holidayName: {
      type: String,
      required: [true, 'Holiday name is required'],
      trim: true,
    },
    date: {
      type: String,
      required: [true, 'Holiday date (YYYY-MM-DD) is required'],
      match: [/^\d{4}-\d{2}-\d{2}$/, 'Date format must be YYYY-MM-DD'],
    },
    isOptional: {
      type: Boolean,
      default: false,
    },
    description: {
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

HolidaySchema.index({ date: 1, organizationId: 1 }, { unique: true });

export const HolidayModel = model<IHoliday>('Holiday', HolidaySchema);
