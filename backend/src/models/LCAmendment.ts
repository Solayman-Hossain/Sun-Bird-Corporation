import { Schema, model, Document, Types } from 'mongoose';

export interface ILCAmendment extends Document {
  _id: Types.ObjectId;
  lcId: Types.ObjectId;
  lcNumber: string;
  amendmentNumber: number;
  amendmentCode: string;
  organizationId: Types.ObjectId;
  amendmentDate: Date;
  previousAmountFC: number;
  revisedAmountFC: number;
  previousExpiryDate?: Date;
  revisedExpiryDate?: Date;
  previousShipmentDate?: Date;
  revisedShipmentDate?: Date;
  changedClauses: string;
  reason: string;
  amendmentChargesBDT: number;
  bankConfirmationRef?: string;
  bankConfirmationDate?: Date;
  requestedBy: Types.ObjectId;
  approvedBy?: Types.ObjectId;
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'CONFIRMED_BY_BANK' | 'REJECTED';
  attachments?: Array<{
    fileUrl: string;
    fileName: string;
    uploadedAt: Date;
  }>;
  aiImpactSummary?: string;
  createdAt: Date;
  updatedAt: Date;
}

export const LCAmendmentSchema = new Schema<ILCAmendment>(
  {
    lcId: {
      type: Schema.Types.ObjectId,
      ref: 'ImportLC',
      required: true,
      index: true,
    },
    lcNumber: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    amendmentNumber: {
      type: Number,
      required: true,
      min: 1,
    },
    amendmentCode: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    amendmentDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    previousAmountFC: {
      type: Number,
      required: true,
      min: 0,
    },
    revisedAmountFC: {
      type: Number,
      required: true,
      min: 0,
    },
    previousExpiryDate: { type: Date },
    revisedExpiryDate: { type: Date },
    previousShipmentDate: { type: Date },
    revisedShipmentDate: { type: Date },
    changedClauses: { type: String, required: true, trim: true },
    reason: { type: String, required: true, trim: true },
    amendmentChargesBDT: { type: Number, default: 0, min: 0 },
    bankConfirmationRef: { type: String, trim: true },
    bankConfirmationDate: { type: Date },
    requestedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    status: {
      type: String,
      enum: ['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'CONFIRMED_BY_BANK', 'REJECTED'],
      default: 'DRAFT',
      index: true,
    },
    attachments: [
      {
        fileUrl: { type: String, required: true },
        fileName: { type: String, required: true },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    aiImpactSummary: { type: String },
  },
  { timestamps: true }
);

LCAmendmentSchema.index({ lcId: 1, amendmentNumber: 1 }, { unique: true });

export const LCAmendmentModel = model<ILCAmendment>('LCAmendment', LCAmendmentSchema);
