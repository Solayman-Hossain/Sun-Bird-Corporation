import { Schema, model, Document, Types } from 'mongoose';

export type AiMessageRole = 'user' | 'assistant' | 'system' | 'tool';

export interface IAiMessage extends Document {
  _id: Types.ObjectId;
  conversationId: Types.ObjectId;
  organizationId: Types.ObjectId;
  userId?: Types.ObjectId;
  role: AiMessageRole;
  content: string;
  sourceCitations?: Array<{
    module: string;
    metric?: string;
    referenceId?: string;
    title?: string;
    value?: any;
  }>;
  toolCalls?: Array<{
    toolName: string;
    arguments: Record<string, any>;
    executionResult?: any;
    executionStatus: 'SUCCESS' | 'FAILED' | 'BLOCKED';
  }>;
  suggestedActions?: string[];
  confidenceScore?: number;
  inputTokens?: number;
  outputTokens?: number;
  latencyMs?: number;
  isRedacted: boolean;
  feedbackRating?: 1 | 2 | 3 | 4 | 5; // User rating 1-5 stars
  feedbackNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AiMessageSchema = new Schema<IAiMessage>(
  {
    conversationId: { type: Schema.Types.ObjectId, ref: 'AiConversation', required: true, index: true },
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    role: { type: String, enum: ['user', 'assistant', 'system', 'tool'], required: true },
    content: { type: String, required: true },
    sourceCitations: [
      {
        module: { type: String },
        metric: { type: String },
        referenceId: { type: String },
        title: { type: String },
        value: { type: Schema.Types.Mixed },
      },
    ],
    toolCalls: [
      {
        toolName: { type: String },
        arguments: { type: Schema.Types.Mixed },
        executionResult: { type: Schema.Types.Mixed },
        executionStatus: { type: String, enum: ['SUCCESS', 'FAILED', 'BLOCKED'] },
      },
    ],
    suggestedActions: [{ type: String }],
    confidenceScore: { type: Number },
    inputTokens: { type: Number, default: 0 },
    outputTokens: { type: Number, default: 0 },
    latencyMs: { type: Number, default: 0 },
    isRedacted: { type: Boolean, default: false },
    feedbackRating: { type: Number, min: 1, max: 5 },
    feedbackNotes: { type: String },
  },
  {
    timestamps: true,
    collection: 'aimessages',
  }
);

AiMessageSchema.index({ conversationId: 1, createdAt: 1 });

export const AiMessage = model<IAiMessage>('AiMessage', AiMessageSchema);
