import { Schema, model, Document, Types } from 'mongoose';

export type ImportDocType =
  | 'PROFORMA_INVOICE'
  | 'PURCHASE_ORDER'
  | 'LC_APPLICATION'
  | 'LC_COPY'
  | 'LC_AMENDMENT'
  | 'COMMERCIAL_INVOICE'
  | 'PACKING_LIST'
  | 'BILL_OF_LADING'
  | 'AIRWAY_BILL'
  | 'CERTIFICATE_OF_ORIGIN'
  | 'INSURANCE_CERTIFICATE'
  | 'INSPECTION_CERTIFICATE'
  | 'BILL_OF_ENTRY'
  | 'CUSTOMS_ASSESSMENT'
  | 'BANK_DOCUMENT'
  | 'PAYMENT_RECEIPT'
  | 'FREIGHT_INVOICE'
  | 'PORT_DOCUMENT'
  | 'DELIVERY_CHALLAN'
  | 'OTHER';

export interface IImportDocument extends Document {
  _id: Types.ObjectId;
  documentNumber?: string;
  documentType: ImportDocType;
  title: string;
  organizationId: Types.ObjectId;
  lcId?: Types.ObjectId;
  lcNumber?: string;
  shipmentId?: Types.ObjectId;
  shipmentReference?: string;
  supplierId?: Types.ObjectId;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  issueDate?: Date;
  expiryDate?: Date;
  verificationStatus: 'PENDING' | 'VERIFIED' | 'DISCREPANCY_FOUND' | 'REJECTED';
  verifiedBy?: Types.ObjectId;
  verificationNotes?: string;
  aiExtraction?: {
    extractedAt?: Date;
    rawTextSnippet?: string;
    structuredData?: Record<string, any>;
    confidenceScore?: number;
    discrepancies?: string[];
    missingFields?: string[];
    complianceChecklist?: Array<{ item: string; satisfied: boolean; notes?: string }>;
  };
  tags?: string[];
  remarks?: string;
  uploadedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export const ImportDocumentSchema = new Schema<IImportDocument>(
  {
    documentNumber: { type: String, trim: true },
    documentType: {
      type: String,
      required: true,
      enum: [
        'PROFORMA_INVOICE',
        'PURCHASE_ORDER',
        'LC_APPLICATION',
        'LC_COPY',
        'LC_AMENDMENT',
        'COMMERCIAL_INVOICE',
        'PACKING_LIST',
        'BILL_OF_LADING',
        'AIRWAY_BILL',
        'CERTIFICATE_OF_ORIGIN',
        'INSURANCE_CERTIFICATE',
        'INSPECTION_CERTIFICATE',
        'BILL_OF_ENTRY',
        'CUSTOMS_ASSESSMENT',
        'BANK_DOCUMENT',
        'PAYMENT_RECEIPT',
        'FREIGHT_INVOICE',
        'PORT_DOCUMENT',
        'DELIVERY_CHALLAN',
        'OTHER',
      ],
      index: true,
    },
    title: { type: String, required: true, trim: true },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    lcId: { type: Schema.Types.ObjectId, ref: 'ImportLC', index: true },
    lcNumber: { type: String, trim: true, uppercase: true },
    shipmentId: { type: Schema.Types.ObjectId, ref: 'ImportShipment', index: true },
    shipmentReference: { type: String, trim: true, uppercase: true },
    supplierId: { type: Schema.Types.ObjectId, ref: 'Supplier' },
    fileUrl: { type: String, required: true },
    fileName: { type: String, required: true },
    fileSize: { type: Number, required: true },
    mimeType: { type: String, default: 'application/pdf' },
    issueDate: { type: Date },
    expiryDate: { type: Date },
    verificationStatus: {
      type: String,
      enum: ['PENDING', 'VERIFIED', 'DISCREPANCY_FOUND', 'REJECTED'],
      default: 'PENDING',
      index: true,
    },
    verifiedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    verificationNotes: { type: String, trim: true },
    aiExtraction: {
      extractedAt: { type: Date },
      rawTextSnippet: { type: String },
      structuredData: { type: Schema.Types.Mixed },
      confidenceScore: { type: Number },
      discrepancies: [{ type: String }],
      missingFields: [{ type: String }],
      complianceChecklist: [
        {
          item: { type: String },
          satisfied: { type: Boolean },
          notes: { type: String },
        },
      ],
    },
    tags: [{ type: String, trim: true }],
    remarks: { type: String, trim: true },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

ImportDocumentSchema.index({ organizationId: 1, documentType: 1 });
ImportDocumentSchema.index({ lcId: 1, documentType: 1 });

export const ImportDocumentModel = model<IImportDocument>('ImportDocument', ImportDocumentSchema);
