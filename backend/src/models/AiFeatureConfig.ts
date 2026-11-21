import { Schema, model, Document, Types } from 'mongoose';

export interface IAiFeatureConfig extends Document {
  _id: Types.ObjectId;
  featureCode: string; // e.g. "PRODUCT_DESC_GEN", "SUPPLIER_INV_EXTRACT", "MIS_ANALYST"
  displayName: string;
  module: string; // e.g. "PRODUCTS", "PURCHASE", "INVENTORY", "MIS", "SUPPORT", "IMPORT", "ACCOUNTS", "HRM"
  description: string;
  isGloballyEnabled: boolean;
  assignedProvider: string;
  assignedModel: string;
  rateLimitPerMinute: number;
  tokenLimitPerRequest: number;
  temperature: number;
  requiresAdminRole: boolean;
  disallowedOrgIds: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const AiFeatureConfigSchema = new Schema<IAiFeatureConfig>(
  {
    featureCode: { type: String, required: true, unique: true, uppercase: true, trim: true },
    displayName: { type: String, required: true, trim: true },
    module: { type: String, required: true, uppercase: true, trim: true, index: true },
    description: { type: String, trim: true },
    isGloballyEnabled: { type: Boolean, default: true },
    assignedProvider: { type: String, default: 'GEMINI' },
    assignedModel: { type: String, default: 'gemini-1.5-pro' },
    rateLimitPerMinute: { type: Number, default: 30 },
    tokenLimitPerRequest: { type: Number, default: 4096 },
    temperature: { type: Number, default: 0.2 },
    requiresAdminRole: { type: Boolean, default: false },
    disallowedOrgIds: [{ type: Schema.Types.ObjectId, ref: 'Organization' }],
  },
  {
    timestamps: true,
    collection: 'aifeatureconfigs',
  }
);

export const AiFeatureConfig = model<IAiFeatureConfig>('AiFeatureConfig', AiFeatureConfigSchema);
