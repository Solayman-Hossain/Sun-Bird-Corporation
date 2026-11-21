import { Schema, model, Document, Types } from 'mongoose';

export type MisRecommendationCategory =
  | 'INCREASE_SALES'
  | 'IMPROVE_PROFITABILITY'
  | 'REDUCE_EXPENSES'
  | 'IMPROVE_CASH_FLOW'
  | 'REDUCE_STOCKOUT'
  | 'REDUCE_OVERSTOCK'
  | 'IMPROVE_PROCUREMENT'
  | 'IMPROVE_SUPPLIER'
  | 'RETAIN_CUSTOMERS'
  | 'REDUCE_RETURNS'
  | 'IMPROVE_PRODUCTIVITY';

export interface IMisRecommendation extends Document {
  _id: Types.ObjectId;
  organizationId: Types.ObjectId;
  recommendationId: string; // REC-2026-0001
  category: MisRecommendationCategory;
  title: string;
  explanation: string;
  supportingMetrics: string[];
  expectedImpact: string;
  estimatedConfidence: number; // 0 - 100
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  suggestedAction: string;
  responsibleDepartment: string;
  status: 'NEW' | 'UNDER_REVIEW' | 'ACCEPTED' | 'REJECTED' | 'IN_PROGRESS' | 'COMPLETED' | 'ARCHIVED';
  reviewNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const MisRecommendationSchema = new Schema<IMisRecommendation>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    recommendationId: { type: String, required: true, unique: true, uppercase: true, trim: true },
    category: {
      type: String,
      enum: [
        'INCREASE_SALES',
        'IMPROVE_PROFITABILITY',
        'REDUCE_EXPENSES',
        'IMPROVE_CASH_FLOW',
        'REDUCE_STOCKOUT',
        'REDUCE_OVERSTOCK',
        'IMPROVE_PROCUREMENT',
        'IMPROVE_SUPPLIER',
        'RETAIN_CUSTOMERS',
        'REDUCE_RETURNS',
        'IMPROVE_PRODUCTIVITY',
      ],
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    explanation: { type: String, required: true },
    supportingMetrics: [{ type: String }],
    expectedImpact: { type: String, required: true },
    estimatedConfidence: { type: Number, default: 85 },
    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
      default: 'MEDIUM',
      index: true,
    },
    suggestedAction: { type: String, required: true },
    responsibleDepartment: { type: String, default: 'Management' },
    status: {
      type: String,
      enum: ['NEW', 'UNDER_REVIEW', 'ACCEPTED', 'REJECTED', 'IN_PROGRESS', 'COMPLETED', 'ARCHIVED'],
      default: 'NEW',
      index: true,
    },
    reviewNotes: { type: String },
  },
  { timestamps: true }
);

MisRecommendationSchema.index({ organizationId: 1, status: 1 });

export const MisRecommendation = model<IMisRecommendation>('MisRecommendation', MisRecommendationSchema);
