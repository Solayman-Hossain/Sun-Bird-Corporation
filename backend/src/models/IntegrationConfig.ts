import { Schema, model, Document, Types } from 'mongoose';

export type IntegrationCategory =
  | 'DATABASE'
  | 'CACHE'
  | 'STORAGE'
  | 'COMMUNICATION'
  | 'PAYMENT'
  | 'AI'
  | 'LOGISTICS';

export type IntegrationHealthStatus = 'HEALTHY' | 'DEGRADED' | 'DOWN' | 'UNCONFIGURED';

export interface IIntegrationConfig extends Document {
  integrationKey: string;
  displayName: string;
  category: IntegrationCategory;
  isEnabled: boolean;
  status: IntegrationHealthStatus;
  maskedCredentials: Record<string, string>;
  configMetadata?: Record<string, any>;
  lastCheckedAt?: Date;
  lastSuccessAt?: Date;
  lastError?: string;
  latencyMs?: number;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export const IntegrationConfigSchema = new Schema<IIntegrationConfig>(
  {
    integrationKey: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    displayName: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: ['DATABASE', 'CACHE', 'STORAGE', 'COMMUNICATION', 'PAYMENT', 'AI', 'LOGISTICS'],
      required: true,
      index: true,
    },
    isEnabled: {
      type: Boolean,
      default: true,
    },
    status: {
      type: String,
      enum: ['HEALTHY', 'DEGRADED', 'DOWN', 'UNCONFIGURED'],
      default: 'UNCONFIGURED',
      index: true,
    },
    maskedCredentials: {
      type: Map,
      of: String,
      default: {},
    },
    configMetadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
    lastCheckedAt: {
      type: Date,
    },
    lastSuccessAt: {
      type: Date,
    },
    lastError: {
      type: String,
    },
    latencyMs: {
      type: Number,
      default: 0,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

export const IntegrationConfig = model<IIntegrationConfig>('IntegrationConfig', IntegrationConfigSchema);
