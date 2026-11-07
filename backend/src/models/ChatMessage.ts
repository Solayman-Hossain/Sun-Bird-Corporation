import { Schema, model, Document, Types } from 'mongoose';

export interface IChatMessage extends Document {
  _id: Types.ObjectId;
  roomId: Types.ObjectId;
  senderType: 'CUSTOMER' | 'AGENT' | 'BOT';
  senderId?: string;
  senderName: string;
  rawText: string;
  sanitizedText: string;
  warnings: string[];
  isBlocked: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const ChatMessageSchema = new Schema<IChatMessage>(
  {
    roomId: {
      type: Schema.Types.ObjectId,
      ref: 'ChatRoom',
      required: true,
      index: true,
    },
    senderType: {
      type: String,
      enum: ['CUSTOMER', 'AGENT', 'BOT'],
      required: true,
    },
    senderId: {
      type: String,
    },
    senderName: {
      type: String,
      required: true,
      trim: true,
    },
    rawText: {
      type: String,
      required: true,
    },
    sanitizedText: {
      type: String,
      required: true,
    },
    warnings: {
      type: [String],
      default: [],
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Sorted by createdAt for fast chronological rendering (Slide 20)
ChatMessageSchema.index({ roomId: 1, createdAt: 1 });

export const ChatMessage = model<IChatMessage>('ChatMessage', ChatMessageSchema);

