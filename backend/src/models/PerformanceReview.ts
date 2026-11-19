import { Schema, model, Document, Types } from 'mongoose';

export interface IKpiItem {
  metric: string;
  target: string;
  achieved: string;
  score: number; // 1 to 5
}

export type PerformanceRecommendation =
  | 'INCREMENT'
  | 'PROMOTION'
  | 'CONFIRMATION'
  | 'PIP'
  | 'NO_CHANGE';

export interface IPerformanceReview extends Document {
  _id: Types.ObjectId;
  reviewCode: string;
  employeeId: Types.ObjectId;
  reviewerId: Types.ObjectId;
  period: string; // e.g. "2026-Q4" or "2026-ANNUAL"
  kpis: IKpiItem[];
  overallRating: number; // 1.0 to 5.0
  strengths: string;
  improvements: string;
  recommendation: PerformanceRecommendation;
  status: 'DRAFT' | 'COMPLETED';
  organizationId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export const PerformanceReviewSchema = new Schema<IPerformanceReview>(
  {
    reviewCode: {
      type: String,
      required: [true, 'Review code is required'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: 'EmployeeProfile',
      required: [true, 'Employee reference is required'],
    },
    reviewerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Reviewer reference is required'],
    },
    period: {
      type: String,
      required: [true, 'Evaluation period is required'],
      trim: true,
    },
    kpis: [
      {
        metric: { type: String, required: true },
        target: { type: String, required: true },
        achieved: { type: String, required: true },
        score: { type: Number, required: true, min: 1, max: 5 },
      },
    ],
    overallRating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    strengths: {
      type: String,
      trim: true,
      default: '',
    },
    improvements: {
      type: String,
      trim: true,
      default: '',
    },
    recommendation: {
      type: String,
      enum: ['INCREMENT', 'PROMOTION', 'CONFIRMATION', 'PIP', 'NO_CHANGE'],
      default: 'NO_CHANGE',
    },
    status: {
      type: String,
      enum: ['DRAFT', 'COMPLETED'],
      default: 'DRAFT',
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

PerformanceReviewSchema.index({ employeeId: 1, period: 1 });

export const PerformanceReviewModel = model<IPerformanceReview>(
  'PerformanceReview',
  PerformanceReviewSchema
);
