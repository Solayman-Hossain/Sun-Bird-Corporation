import { Schema, model, Document, Types } from 'mongoose';
import { AiProviderName } from './AiProviderConfig';

export interface IAiModelConfig extends Document {
  _id: Types.ObjectId;
  provider: AiProviderName;
  modelIdentifier: string; // e.g. "gemini-1.5-pro", "gemini-1.5-flash", "gpt-4o"
  displayName: string;
  contextWindowTokens: number;
  maxOutputTokens: number;
  defaultTemperature: number;
  inputTokenCostPer1k?: number; // BDT or USD
  outputTokenCostPer1k?: number;
  supportsVision: boolean;
  supportsFunctionCalling: boolean;
  supportsStructuredJson: boolean;
  isEnabled: boolean;
  isDefault: boolean;
  assignedFeatures: string[]; // List of AI feature codes using this model
  createdAt: Date;
  updatedAt: Date;
}

const AiModelConfigSchema = new Schema<IAiModelConfig>(
  {
    provider: {
      type: String,
      enum: ['GEMINI', 'OPENAI', 'ANTHROPIC', 'LOCAL_MOCK'],
      required: true,
      index: true,
    },
    modelIdentifier: { type: String, required: true, trim: true },
    displayName: { type: String, required: true, trim: true },
    contextWindowTokens: { type: Number, default: 128000 },
    maxOutputTokens: { type: Number, default: 8192 },
    defaultTemperature: { type: Number, default: 0.2 },
    inputTokenCostPer1k: { type: Number, default: 0.04 },
    outputTokenCostPer1k: { type: Number, default: 0.16 },
    supportsVision: { type: Boolean, default: true },
    supportsFunctionCalling: { type: Boolean, default: true },
    supportsStructuredJson: { type: Boolean, default: true },
    isEnabled: { type: Boolean, default: true },
    isDefault: { type: Boolean, default: false },
    assignedFeatures: [{ type: String, trim: true }],
  },
  {
    timestamps: true,
    collection: 'aimodelconfigs',
  }
);

AiModelConfigSchema.index({ provider: 1, modelIdentifier: 1 }, { unique: true });

export const AiModelConfig = model<IAiModelConfig>('AiModelConfig', AiModelConfigSchema);
