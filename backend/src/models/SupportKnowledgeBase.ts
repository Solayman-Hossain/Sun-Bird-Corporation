import { Schema, model, Document, Types } from 'mongoose';

export interface ISupportKnowledgeBase extends Document {
  _id: Types.ObjectId;
  organizationId: Types.ObjectId;
  category: string;
  title: string;
  slug: string;
  content: string;
  applicableProducts: Array<{ productId: Types.ObjectId; productName: string }>;
  symptoms: string[];
  troubleshootingSteps: string[];
  isPublished: boolean;
  viewCount: number;
  helpfulCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const SupportKnowledgeBaseSchema = new Schema<ISupportKnowledgeBase>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    category: { type: String, required: true, trim: true, index: true },
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    applicableProducts: [
      {
        productId: { type: Schema.Types.ObjectId, ref: 'Product' },
        productName: { type: String },
      },
    ],
    symptoms: [{ type: String, trim: true }],
    troubleshootingSteps: [{ type: String }],
    isPublished: { type: Boolean, default: true, index: true },
    viewCount: { type: Number, default: 0 },
    helpfulCount: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

SupportKnowledgeBaseSchema.index({ organizationId: 1, slug: 1 }, { unique: true });

export const SupportKnowledgeBase = model<ISupportKnowledgeBase>('SupportKnowledgeBase', SupportKnowledgeBaseSchema);
