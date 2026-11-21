import { Schema, model, Document, Types } from 'mongoose';

export type MessageSenderType = 'CUSTOMER' | 'AGENT' | 'SYSTEM' | 'AI_ASSISTANT';
export type SupportMessageType = 'MESSAGE' | 'INTERNAL_NOTE' | 'CALL_LOG' | 'EMAIL' | 'STATUS_CHANGE';

export interface ISupportMessage extends Document {
  _id: Types.ObjectId;
  organizationId: Types.ObjectId;
  ticketId: Types.ObjectId;
  senderType: MessageSenderType;
  senderId?: Types.ObjectId;
  senderName: string;
  messageType: SupportMessageType;
  body: string;
  callDurationSeconds?: number;
  callOutcome?: 'ANSWERED' | 'BUSY' | 'MISSED' | 'VOICEMAIL' | 'FOLLOWUP_SCHEDULED';
  attachments: Array<{ name: string; url: string; size?: number }>;
  isInternalOnly: boolean;
  aiDrafted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SupportMessageSchema = new Schema<ISupportMessage>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    ticketId: { type: Schema.Types.ObjectId, ref: 'SupportTicket', required: true, index: true },
    senderType: {
      type: String,
      enum: ['CUSTOMER', 'AGENT', 'SYSTEM', 'AI_ASSISTANT'],
      required: true,
    },
    senderId: { type: Schema.Types.ObjectId, ref: 'User' },
    senderName: { type: String, required: true, trim: true },
    messageType: {
      type: String,
      enum: ['MESSAGE', 'INTERNAL_NOTE', 'CALL_LOG', 'EMAIL', 'STATUS_CHANGE'],
      default: 'MESSAGE',
    },
    body: { type: String, required: true },
    callDurationSeconds: { type: Number },
    callOutcome: {
      type: String,
      enum: ['ANSWERED', 'BUSY', 'MISSED', 'VOICEMAIL', 'FOLLOWUP_SCHEDULED'],
    },
    attachments: [
      {
        name: { type: String, required: true },
        url: { type: String, required: true },
        size: { type: Number },
      },
    ],
    isInternalOnly: { type: Boolean, default: false },
    aiDrafted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

SupportMessageSchema.index({ organizationId: 1, ticketId: 1, createdAt: 1 });

export const SupportMessage = model<ISupportMessage>('SupportMessage', SupportMessageSchema);
