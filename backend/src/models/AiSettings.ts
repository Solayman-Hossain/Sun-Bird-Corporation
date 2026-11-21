import { Schema, model, Document, Types } from 'mongoose';

export interface IAiSettings extends Document {
  _id: Types.ObjectId;
  organizationId: Types.ObjectId;
  isAiGloballyEnabled: boolean;
  defaultProvider: string;
  defaultModel: string;
  defaultLanguage: 'bn' | 'en' | 'auto';
  responseStyle: 'PROFESSIONAL' | 'CONCISE' | 'DETAILED';
  timeoutMs: number;
  maxRetries: number;
  rateLimitPerUserPerMinute: number;
  sensitiveRedactionEnabled: boolean;
  allowedDataCategories: string[];
  conversationRetentionDays: number;
  documentRetentionDays: number;
  dailyTokenLimitPerOrg: number;
  monthlyBudgetBdt: number;
  warningBudgetThresholdPercent: number;
  allowedModules: string[];
  createdAt: Date;
  updatedAt: Date;
}

const AiSettingsSchema = new Schema<IAiSettings>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, unique: true },
    isAiGloballyEnabled: { type: Boolean, default: true },
    defaultProvider: { type: String, default: 'GEMINI' },
    defaultModel: { type: String, default: 'gemini-1.5-pro' },
    defaultLanguage: { type: String, enum: ['bn', 'en', 'auto'], default: 'auto' },
    responseStyle: { type: String, enum: ['PROFESSIONAL', 'CONCISE', 'DETAILED'], default: 'PROFESSIONAL' },
    timeoutMs: { type: Number, default: 30000 },
    maxRetries: { type: Number, default: 2 },
    rateLimitPerUserPerMinute: { type: Number, default: 20 },
    sensitiveRedactionEnabled: { type: Boolean, default: true },
    allowedDataCategories: [{ type: String }],
    conversationRetentionDays: { type: Number, default: 90 },
    documentRetentionDays: { type: Number, default: 365 },
    dailyTokenLimitPerOrg: { type: Number, default: 1000000 },
    monthlyBudgetBdt: { type: Number, default: 50000 },
    warningBudgetThresholdPercent: { type: Number, default: 80 },
    allowedModules: [
      {
        type: String,
        default: [
          'PRODUCTS',
          'PURCHASE',
          'INVENTORY',
          'MIS',
          'SUPPORT',
          'IMPORT',
          'ACCOUNTS',
          'HRM',
          'MARKETING',
          'ORDERS',
          'DOCUMENTS',
        ],
      },
    ],
  },
  {
    timestamps: true,
    collection: 'aisettings',
  }
);

export const AiSettings = model<IAiSettings>('AiSettings', AiSettingsSchema);
