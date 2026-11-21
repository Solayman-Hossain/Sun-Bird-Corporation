import { Schema, model, Document, Types } from 'mongoose';

export type AiDocumentType =
  | 'SUPPLIER_INVOICE'
  | 'COMMERCIAL_INVOICE'
  | 'PACKING_LIST'
  | 'BILL_OF_LADING'
  | 'AIRWAY_BILL'
  | 'PURCHASE_ORDER'
  | 'DELIVERY_CHALLAN'
  | 'CUSTOMS_DECLARATION'
  | 'CERTIFICATE_OF_ANALYSIS'
  | 'WARRANTY_CARD'
  | 'OTHER';

export type AiJobStatus = 'QUEUED' | 'PROCESSING' | 'REVIEW_READY' | 'ACCEPTED' | 'REJECTED' | 'FAILED';

export interface IAiDocumentJob extends Document {
  _id: Types.ObjectId;
  organizationId: Types.ObjectId;
  userId: Types.ObjectId;
  jobCode: string; // e.g. "DOC-JOB-2026-0001"
  documentType: AiDocumentType;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  ocrRawText?: string;
  extractedPayload: Record<string, any>;
  confidenceScore: number;
  validationWarnings: string[];
  status: AiJobStatus;
  userEditedPayload?: Record<string, any>;
  reviewedBy?: Types.ObjectId;
  reviewedAt?: Date;
  reviewNotes?: string;
  targetModuleReference?: {
    module: string;
    targetId?: Types.ObjectId;
  };
  processingDurationMs?: number;
  tokensConsumed?: number;
  createdAt: Date;
  updatedAt: Date;
}

const AiDocumentJobSchema = new Schema<IAiDocumentJob>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    jobCode: { type: String, required: true, unique: true, uppercase: true, trim: true },
    documentType: {
      type: String,
      enum: [
        'SUPPLIER_INVOICE',
        'COMMERCIAL_INVOICE',
        'PACKING_LIST',
        'BILL_OF_LADING',
        'AIRWAY_BILL',
        'PURCHASE_ORDER',
        'DELIVERY_CHALLAN',
        'CUSTOMS_DECLARATION',
        'CERTIFICATE_OF_ANALYSIS',
        'WARRANTY_CARD',
        'OTHER',
      ],
      required: true,
      index: true,
    },
    fileUrl: { type: String, required: true },
    fileName: { type: String, required: true },
    fileSize: { type: Number, default: 0 },
    mimeType: { type: String, default: 'application/pdf' },
    ocrRawText: { type: String },
    extractedPayload: { type: Schema.Types.Mixed, default: {} },
    confidenceScore: { type: Number, default: 0 },
    validationWarnings: [{ type: String }],
    status: {
      type: String,
      enum: ['QUEUED', 'PROCESSING', 'REVIEW_READY', 'ACCEPTED', 'REJECTED', 'FAILED'],
      default: 'QUEUED',
      index: true,
    },
    userEditedPayload: { type: Schema.Types.Mixed },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date },
    reviewNotes: { type: String },
    targetModuleReference: {
      module: { type: String },
      targetId: { type: Schema.Types.ObjectId },
    },
    processingDurationMs: { type: Number, default: 0 },
    tokensConsumed: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    collection: 'aidocumentjobs',
  }
);

export const AiDocumentJob = model<IAiDocumentJob>('AiDocumentJob', AiDocumentJobSchema);
