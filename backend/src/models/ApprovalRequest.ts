import { Schema, model, Document, Types } from 'mongoose';

export type ApprovalDocumentType =
  | 'PO'
  | 'CS'
  | 'QUORUM_JV'
  | 'CREDIT_LIMIT'
  | 'EXPENSE';

export type ApprovalRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type DirectorQuorumRole = 'MD' | 'DIRECTOR_ADMIN' | 'DIRECTOR_FINANCE';

export interface IApprovalAction {
  directorId: Types.ObjectId;
  directorRole: DirectorQuorumRole;
  status: 'APPROVED' | 'REJECTED';
  signedAt: Date;
  signatureHash: string;
  comment?: string;
}

export interface IApprovalRequest extends Document {
  _id: Types.ObjectId;
  requestCode: string;
  documentType: ApprovalDocumentType;
  documentId: Types.ObjectId;
  documentRef: string;
  requestedBy: Types.ObjectId;
  requestedAt: Date;
  currentQuorumTier: 1 | 2 | 3 | 4;
  approvals: IApprovalAction[];
  quorumRequired: number;
  quorumReached: boolean;
  currentStatus: ApprovalRequestStatus;
  createdAt: Date;
  updatedAt: Date;
}

export const ApprovalActionSchema = new Schema<IApprovalAction>(
  {
    directorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    directorRole: {
      type: String,
      enum: ['MD', 'DIRECTOR_ADMIN', 'DIRECTOR_FINANCE'],
      required: true,
    },
    status: {
      type: String,
      enum: ['APPROVED', 'REJECTED'],
      required: true,
    },
    signedAt: {
      type: Date,
      default: Date.now,
    },
    signatureHash: {
      type: String,
      required: true,
      trim: true,
    },
    comment: {
      type: String,
      trim: true,
    },
  },
  { _id: false }
);

export const ApprovalRequestSchema = new Schema<IApprovalRequest>(
  {
    requestCode: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    documentType: {
      type: String,
      enum: ['PO', 'CS', 'QUORUM_JV', 'CREDIT_LIMIT', 'EXPENSE'],
      required: true,
    },
    documentId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    documentRef: {
      type: String,
      required: true,
      trim: true,
    },
    requestedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    requestedAt: {
      type: Date,
      default: Date.now,
    },
    currentQuorumTier: {
      type: Number,
      enum: [1, 2, 3, 4],
      required: true,
    },
    approvals: [ApprovalActionSchema],
    quorumRequired: {
      type: Number,
      required: true,
      min: 1,
    },
    quorumReached: {
      type: Boolean,
      default: false,
    },
    currentStatus: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED'],
      default: 'PENDING',
    },
  },
  { timestamps: true }
);

// Explicit Indexes matching Database-Schema.md §7.4 and Prompt 43
ApprovalRequestSchema.index({ requestCode: 1 }, { unique: true });
ApprovalRequestSchema.index({ documentType: 1, currentStatus: 1 });
ApprovalRequestSchema.index({ requestedBy: 1 });
ApprovalRequestSchema.index({ createdAt: -1 });

export const ApprovalRequestModel = model<IApprovalRequest>(
  'ApprovalRequest',
  ApprovalRequestSchema
);
export default ApprovalRequestModel;
