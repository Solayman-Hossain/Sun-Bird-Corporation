import { Schema, model, Document, Types } from 'mongoose';

export type AiProviderName = 'GEMINI' | 'OPENAI' | 'ANTHROPIC' | 'LOCAL_MOCK';

export interface IAiProviderConfig extends Document {
  _id: Types.ObjectId;
  organizationId?: Types.ObjectId; // Optional: system-wide or org-override
  providerName: AiProviderName;
  displayName: string;
  baseUrl?: string;
  apiKeyMasked: string; // e.g. "AIzaSy...4xK9" - secret never returned in full
  apiKeyEncrypted?: string;
  isEnabled: boolean;
  isDefault: boolean;
  isFallback: boolean;
  timeoutMs: number;
  maxRetries: number;
  healthStatus: 'HEALTHY' | 'DEGRADED' | 'OFFLINE' | 'UNCONFIGURED';
  lastHealthCheck?: Date;
  errorRatePercent: number;
  createdAt: Date;
  updatedAt: Date;
}

const AiProviderConfigSchema = new Schema<IAiProviderConfig>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', index: true },
    providerName: {
      type: String,
      enum: ['GEMINI', 'OPENAI', 'ANTHROPIC', 'LOCAL_MOCK'],
      required: true,
      uppercase: true,
      trim: true,
    },
    displayName: { type: String, required: true, trim: true },
    baseUrl: { type: String, trim: true },
    apiKeyMasked: { type: String, default: '***' },
    apiKeyEncrypted: { type: String, select: false }, // Excluded by default
    isEnabled: { type: Boolean, default: true },
    isDefault: { type: Boolean, default: false },
    isFallback: { type: Boolean, default: false },
    timeoutMs: { type: Number, default: 25000 },
    maxRetries: { type: Number, default: 2 },
    healthStatus: {
      type: String,
      enum: ['HEALTHY', 'DEGRADED', 'OFFLINE', 'UNCONFIGURED'],
      default: 'HEALTHY',
    },
    lastHealthCheck: { type: Date },
    errorRatePercent: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    collection: 'aiproviderconfigs',
  }
);

AiProviderConfigSchema.index({ providerName: 1, organizationId: 1 }, { unique: true });

export const AiProviderConfig = model<IAiProviderConfig>('AiProviderConfig', AiProviderConfigSchema);
