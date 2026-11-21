import { Schema, model, Document, Types } from 'mongoose';

export interface IAiUsageLog extends Document {
  _id: Types.ObjectId;
  organizationId: Types.ObjectId;
  userId?: Types.ObjectId;
  featureCode: string;
  module: string;
  provider: string;
  modelName: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  estimatedCostBdt: number;
  latencyMs: number;
  status: 'SUCCESS' | 'FAILED' | 'RATE_LIMITED' | 'TIMEOUT';
  errorMessage?: string;
  toolCallsCount: number;
  createdAt: Date;
}

const AiUsageLogSchema = new Schema<IAiUsageLog>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    featureCode: { type: String, required: true, index: true },
    module: { type: String, required: true, index: true },
    provider: { type: String, required: true },
    modelName: { type: String, required: true },
    inputTokens: { type: Number, default: 0 },
    outputTokens: { type: Number, default: 0 },
    totalTokens: { type: Number, default: 0 },
    estimatedCostBdt: { type: Number, default: 0 },
    latencyMs: { type: Number, default: 0 },
    status: { type: String, enum: ['SUCCESS', 'FAILED', 'RATE_LIMITED', 'TIMEOUT'], default: 'SUCCESS' },
    errorMessage: { type: String },
    toolCallsCount: { type: Number, default: 0 },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    collection: 'aiusagelogs',
  }
);

AiUsageLogSchema.index({ organizationId: 1, createdAt: -1 });

export const AiUsageLog = model<IAiUsageLog>('AiUsageLog', AiUsageLogSchema);
