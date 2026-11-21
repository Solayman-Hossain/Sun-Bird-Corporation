import { Schema, model, Document, Types } from 'mongoose';

export type LogSeverity = 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';

export interface ISystemLog extends Document {
  timestamp: Date;
  severity: LogSeverity;
  service: string;
  module: string;
  errorCode?: string;
  requestId?: string;
  message: string;
  metadata?: any;
  organizationId?: Types.ObjectId;
  userId?: Types.ObjectId;
  ipAddress?: string;
  createdAt: Date;
}

export const SystemLogSchema = new Schema<ISystemLog>(
  {
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    severity: {
      type: String,
      enum: ['INFO', 'WARN', 'ERROR', 'CRITICAL'],
      default: 'INFO',
      index: true,
    },
    service: {
      type: String,
      required: true,
      default: 'ERP_BACKEND',
      index: true,
    },
    module: {
      type: String,
      required: true,
      default: 'SYSTEM',
      index: true,
    },
    errorCode: {
      type: String,
      trim: true,
    },
    requestId: {
      type: String,
      trim: true,
      index: true,
    },
    message: {
      type: String,
      required: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    ipAddress: {
      type: String,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

export const SystemLog = model<ISystemLog>('SystemLog', SystemLogSchema);
