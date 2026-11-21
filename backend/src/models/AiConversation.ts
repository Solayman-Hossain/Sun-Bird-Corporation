import { Schema, model, Document, Types } from 'mongoose';

export interface IAiConversation extends Document {
  _id: Types.ObjectId;
  organizationId: Types.ObjectId;
  userId: Types.ObjectId;
  title: string;
  moduleContext?: string; // e.g. "MIS", "SUPPORT", "INVENTORY", "GLOBAL"
  sessionMetadata?: Record<string, any>;
  isActive: boolean;
  isArchived: boolean;
  isPinned: boolean;
  messageCount: number;
  totalTokensUsed: number;
  lastMessageAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AiConversationSchema = new Schema<IAiConversation>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true, default: 'New Conversation' },
    moduleContext: { type: String, default: 'GLOBAL', trim: true },
    sessionMetadata: { type: Schema.Types.Mixed },
    isActive: { type: Boolean, default: true },
    isArchived: { type: Boolean, default: false },
    isPinned: { type: Boolean, default: false },
    messageCount: { type: Number, default: 0 },
    totalTokensUsed: { type: Number, default: 0 },
    lastMessageAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    collection: 'aiconversations',
  }
);

AiConversationSchema.index({ organizationId: 1, userId: 1, lastMessageAt: -1 });

export const AiConversation = model<IAiConversation>('AiConversation', AiConversationSchema);
