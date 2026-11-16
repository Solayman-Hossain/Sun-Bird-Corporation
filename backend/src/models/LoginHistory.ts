import { Schema, model, Document, Types } from 'mongoose';

export type LoginStatus = 'SUCCESS' | 'FAILED' | 'BLOCKED';

export interface ILoginHistory extends Document {
  _id: Types.ObjectId;
  userId?: Types.ObjectId;
  email: string;
  ipAddress?: string;
  userAgent?: string;
  status: LoginStatus;
  failureReason?: string;
  organizationId?: Types.ObjectId;
  createdAt: Date;
}

export const LoginHistorySchema = new Schema<ILoginHistory>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    ipAddress: {
      type: String,
      trim: true,
    },
    userAgent: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['SUCCESS', 'FAILED', 'BLOCKED'],
      required: true,
      index: true,
    },
    failureReason: {
      type: String,
      trim: true,
    },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    collection: 'login_history',
  }
);

LoginHistorySchema.index({ createdAt: -1 });

export const LoginHistoryModel = model<ILoginHistory>(
  'LoginHistory',
  LoginHistorySchema,
  'login_history'
);
export default LoginHistoryModel;

