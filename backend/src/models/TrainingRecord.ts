import { Schema, model, Document, Types } from 'mongoose';

export interface ITrainingAttendee {
  employeeId: Types.ObjectId;
  status: 'ENROLLED' | 'COMPLETED' | 'ABSENT';
  score?: number;
  feedback?: string;
}

export interface ITrainingRecord extends Document {
  _id: Types.ObjectId;
  trainingCode: string;
  title: string;
  trainer: string;
  startDate: Date;
  endDate: Date;
  venue?: string;
  cost: number;
  attendees: ITrainingAttendee[];
  status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  organizationId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export const TrainingRecordSchema = new Schema<ITrainingRecord>(
  {
    trainingCode: {
      type: String,
      required: [true, 'Training code is required'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    title: {
      type: String,
      required: [true, 'Training title is required'],
      trim: true,
    },
    trainer: {
      type: String,
      required: [true, 'Trainer name is required'],
      trim: true,
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required'],
    },
    venue: {
      type: String,
      trim: true,
    },
    cost: {
      type: Number,
      default: 0,
      min: 0,
    },
    attendees: [
      {
        employeeId: {
          type: Schema.Types.ObjectId,
          ref: 'EmployeeProfile',
          required: true,
        },
        status: {
          type: String,
          enum: ['ENROLLED', 'COMPLETED', 'ABSENT'],
          default: 'ENROLLED',
        },
        score: {
          type: Number,
          min: 0,
          max: 100,
        },
        feedback: {
          type: String,
          trim: true,
        },
      },
    ],
    status: {
      type: String,
      enum: ['PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
      default: 'PLANNED',
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

export const TrainingRecordModel = model<ITrainingRecord>(
  'TrainingRecord',
  TrainingRecordSchema
);
