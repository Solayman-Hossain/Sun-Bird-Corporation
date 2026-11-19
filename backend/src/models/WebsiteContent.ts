import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IContentVersion {
  versionNumber: number;
  title: string;
  body: string;
  sections?: Record<string, any>;
  changedBy: Types.ObjectId;
  changeSummary?: string;
  savedAt: Date;
}

export interface IWebsiteContent extends Document {
  organizationId: Types.ObjectId;
  contentKey: string; // e.g. "ABOUT_US", "RETURN_POLICY", "TERMS", "FAQ", "HOMEPAGE_SECTIONS", "FOOTER_LINKS"
  title: string;
  contentType: 'PAGE' | 'SECTION' | 'POLICY' | 'FAQ' | 'FOOTER' | 'HEADER' | 'ANNOUNCEMENT';
  body: string;
  language: 'bn' | 'en';
  currentVersion: number;
  versions: IContentVersion[];
  status: 'DRAFT' | 'APPROVED' | 'PUBLISHED' | 'ARCHIVED';
  publishedAt?: Date;
  effectiveDate?: Date;
  seoTitle?: string;
  seoDescription?: string;
  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const ContentVersionSchema = new Schema<IContentVersion>(
  {
    versionNumber: { type: Number, required: true },
    title: { type: String, required: true },
    body: { type: String, required: true },
    sections: { type: Schema.Types.Mixed },
    changedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    changeSummary: { type: String },
    savedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const WebsiteContentSchema = new Schema<IWebsiteContent>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    contentKey: { type: String, required: true, uppercase: true, trim: true },
    title: { type: String, required: true, trim: true },
    contentType: {
      type: String,
      required: true,
      enum: ['PAGE', 'SECTION', 'POLICY', 'FAQ', 'FOOTER', 'HEADER', 'ANNOUNCEMENT'],
      index: true,
    },
    body: { type: String, default: '' },
    language: { type: String, enum: ['bn', 'en'], default: 'bn' },
    currentVersion: { type: Number, default: 1 },
    versions: [ContentVersionSchema],
    status: {
      type: String,
      enum: ['DRAFT', 'APPROVED', 'PUBLISHED', 'ARCHIVED'],
      default: 'DRAFT',
      index: true,
    },
    publishedAt: { type: Date },
    effectiveDate: { type: Date, default: Date.now },
    seoTitle: { type: String },
    seoDescription: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

WebsiteContentSchema.index({ organizationId: 1, contentKey: 1, language: 1 }, { unique: true });

export const WebsiteContentModel = mongoose.model<IWebsiteContent>('WebsiteContent', WebsiteContentSchema);
export default WebsiteContentModel;
