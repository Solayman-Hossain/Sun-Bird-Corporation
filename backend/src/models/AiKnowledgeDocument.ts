import { Schema, model, Document, Types } from 'mongoose';

export type KnowledgeCategory =
  | 'COMPANY_POLICY'
  | 'PRODUCT_MANUAL'
  | 'HR_POLICY'
  | 'PURCHASE_SOP'
  | 'IMPORT_SOP'
  | 'SUPPORT_GUIDELINE'
  | 'WARRANTY_POLICY'
  | 'OPERATIONAL_SOP';

export interface IAiKnowledgeDocument extends Document {
  _id: Types.ObjectId;
  organizationId: Types.ObjectId;
  title: string;
  category: KnowledgeCategory;
  summary?: string;
  content: string; // Plaintext or markdown
  tags: string[];
  accessRoles: string[]; // e.g. ["admin", "manager", "staff"]
  fileUrl?: string;
  isIndexed: boolean;
  status: 'ACTIVE' | 'ARCHIVED' | 'DRAFT';
  queryHitCount: number;
  lastUsedAt?: Date;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const AiKnowledgeDocumentSchema = new Schema<IAiKnowledgeDocument>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    title: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: [
        'COMPANY_POLICY',
        'PRODUCT_MANUAL',
        'HR_POLICY',
        'PURCHASE_SOP',
        'IMPORT_SOP',
        'SUPPORT_GUIDELINE',
        'WARRANTY_POLICY',
        'OPERATIONAL_SOP',
      ],
      required: true,
      index: true,
    },
    summary: { type: String, trim: true },
    content: { type: String, required: true },
    tags: [{ type: String, trim: true }],
    accessRoles: [{ type: String, default: 'staff' }],
    fileUrl: { type: String },
    isIndexed: { type: Boolean, default: true },
    status: { type: String, enum: ['ACTIVE', 'ARCHIVED', 'DRAFT'], default: 'ACTIVE' },
    queryHitCount: { type: Number, default: 0 },
    lastUsedAt: { type: Date },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  {
    timestamps: true,
    collection: 'aiknowledgedocuments',
  }
);

AiKnowledgeDocumentSchema.index({ organizationId: 1, category: 1, status: 1 });
AiKnowledgeDocumentSchema.index({ title: 'text', content: 'text', tags: 'text' });

export const AiKnowledgeDocument = model<IAiKnowledgeDocument>('AiKnowledgeDocument', AiKnowledgeDocumentSchema);
