import { Schema, model, Document, Types } from 'mongoose';

export interface IChatRoom extends Document {
  _id: Types.ObjectId;
  customerId?: Types.ObjectId;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  subject?: string;
  orderId?: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
  lastMessagePreview?: string;
  lastMessageSender?: string;
  lastMessageAt?: Date;
  unreadCountAdmin: number;
  unreadCountCustomer: number;
  assignedAgentId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export const ChatRoomSchema = new Schema<IChatRoom>(
  {
    customerId: {
      type: Schema.Types.ObjectId,
      ref: 'Customer',
    },
    customerName: {
      type: String,
      required: true,
      trim: true,
    },
    customerPhone: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    customerEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },
    subject: {
      type: String,
      default: 'General Support & Order Inquiry',
    },
    orderId: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['OPEN', 'IN_PROGRESS', 'RESOLVED'],
      default: 'OPEN',
      index: true,
    },
    lastMessagePreview: {
      type: String,
      default: '',
    },
    lastMessageSender: {
      type: String,
      default: '',
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
    },
    unreadCountAdmin: {
      type: Number,
      default: 0,
    },
    unreadCountCustomer: {
      type: Number,
      default: 0,
    },
    assignedAgentId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

ChatRoomSchema.index({ lastMessageAt: -1 });

export const ChatRoom = model<IChatRoom>('ChatRoom', ChatRoomSchema);

