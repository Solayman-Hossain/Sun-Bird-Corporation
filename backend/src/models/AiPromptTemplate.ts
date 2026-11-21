import { Schema, model, Document, Types } from 'mongoose';

export interface IAiPromptTemplate extends Document {
  _id: Types.ObjectId;
  templateCode: string; // e.g. "PRMPT-INV-EXTRACT-V1"
  name: string;
  category: string;
  module: string;
  systemPrompt: string;
  userPromptTemplate: string;
  requiredVariables: string[];
  version: number;
  isSystemProtected: boolean;
  isActive: boolean;
  versionHistory: Array<{
    version: number;
    systemPrompt: string;
    userPromptTemplate: string;
    modifiedBy?: Types.ObjectId;
    modifiedAt: Date;
    changeNotes?: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const AiPromptTemplateSchema = new Schema<IAiPromptTemplate>(
  {
    templateCode: { type: String, required: true, unique: true, uppercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true, index: true },
    module: { type: String, required: true, trim: true, index: true },
    systemPrompt: { type: String, required: true },
    userPromptTemplate: { type: String, required: true },
    requiredVariables: [{ type: String, trim: true }],
    version: { type: Number, default: 1 },
    isSystemProtected: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    versionHistory: [
      {
        version: { type: Number, required: true },
        systemPrompt: { type: String, required: true },
        userPromptTemplate: { type: String, required: true },
        modifiedBy: { type: Schema.Types.ObjectId, ref: 'User' },
        modifiedAt: { type: Date, default: Date.now },
        changeNotes: { type: String },
      },
    ],
  },
  {
    timestamps: true,
    collection: 'aiprompttemplates',
  }
);

export const AiPromptTemplate = model<IAiPromptTemplate>('AiPromptTemplate', AiPromptTemplateSchema);
