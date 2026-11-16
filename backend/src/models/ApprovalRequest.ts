import { Schema, model, Document, Types } from 'mongoose';

export type ApprovalDocumentType =
  | 'PO'
  | 'CS'
  | 'QUORUM_JV'
  | 'CREDIT_LIMIT'
  | 'EXPENSE'
  | string;

export type ApprovalRequestStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'PENDING'
  | 'UNDER_REVIEW'
  | 'PARTIALLY_APPROVED'
  | 'APPROVED'
  | 'REJECTED'
  | 'RETURNED_FOR_CORRECTION'
  | 'CANCELLED'
  | 'EXPIRED'
  | 'ESCALATED'
  | 'COMPLETED'
  | string;

export type DirectorQuorumRole = 'MD' | 'DIRECTOR_ADMIN' | 'DIRECTOR_FINANCE' | string;

export interface IApprovalAction {
  directorId: Types.ObjectId;
  directorRole: DirectorQuorumRole;
  status: 'APPROVED' | 'REJECTED' | string;
  signedAt: Date;
  signatureHash: string;
  comment?: string;
}

export interface IApprovalDecisionHistory {
  level: number;
  actorId: Types.ObjectId;
  actorName: string;
  actorRole: string;
  action: 'APPROVE' | 'REJECT' | 'RETURN' | 'REQUEST_INFO' | 'DELEGATE';
  comment?: string;
  delegatedTo?: Types.ObjectId;
  signatureHash?: string;
  timestamp: Date;
}

export interface IApprovalRequest extends Document {
  _id: Types.ObjectId;
  requestCode: string;
  documentType: ApprovalDocumentType;
  documentId: Types.ObjectId;
  documentRef: string;
  organizationId?: Types.ObjectId;
  module: string;
  transactionType: string;
  transactionAmount?: number;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  requestedBy: Types.ObjectId;
  makerId?: Types.ObjectId;
  makerName?: string;
  requestedAt: Date;
  currentQuorumTier?: number;
  workflowId?: Types.ObjectId;
  currentLevel: number;
  totalLevels: number;
  assignedApproverId?: Types.ObjectId;
  assignedRoleId?: Types.ObjectId;
  approvals: IApprovalAction[];
  decisionHistory: IApprovalDecisionHistory[];
  quorumRequired: number;
  quorumReached: boolean;
  currentStatus: ApprovalRequestStatus;
  dueDate?: Date;
  isOverdue?: boolean;
  attachments?: string[];
  transactionSnapshot?: any;
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
      required: true,
    },
    status: {
      type: String,
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

export const ApprovalDecisionHistorySchema = new Schema<IApprovalDecisionHistory>(
  {
    level: {
      type: Number,
      required: true,
      default: 1,
    },
    actorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    actorName: {
      type: String,
      required: true,
    },
    actorRole: {
      type: String,
      required: true,
    },
    action: {
      type: String,
      enum: ['APPROVE', 'REJECT', 'RETURN', 'REQUEST_INFO', 'DELEGATE'],
      required: true,
    },
    comment: {
      type: String,
      trim: true,
    },
    delegatedTo: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    signatureHash: {
      type: String,
      trim: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
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
      required: true,
      trim: true,
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
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
    },
    module: {
      type: String,
      required: true,
      default: 'PURCHASE',
      trim: true,
      uppercase: true,
    },
    transactionType: {
      type: String,
      required: true,
      default: 'PURCHASE_ORDER',
      trim: true,
      uppercase: true,
    },
    transactionAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
      default: 'MEDIUM',
    },
    requestedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    makerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    makerName: {
      type: String,
      trim: true,
    },
    requestedAt: {
      type: Date,
      default: Date.now,
    },
    currentQuorumTier: {
      type: Number,
      default: 1,
    },
    workflowId: {
      type: Schema.Types.ObjectId,
      ref: 'ApprovalWorkflow',
    },
    currentLevel: {
      type: Number,
      default: 1,
      min: 1,
    },
    totalLevels: {
      type: Number,
      default: 1,
      min: 1,
    },
    assignedApproverId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    assignedRoleId: {
      type: Schema.Types.ObjectId,
      ref: 'Role',
    },
    approvals: [ApprovalActionSchema],
    decisionHistory: [ApprovalDecisionHistorySchema],
    quorumRequired: {
      type: Number,
      required: true,
      default: 1,
      min: 1,
    },
    quorumReached: {
      type: Boolean,
      default: false,
    },
    currentStatus: {
      type: String,
      default: 'PENDING',
      trim: true,
      uppercase: true,
    },
    dueDate: {
      type: Date,
    },
    isOverdue: {
      type: Boolean,
      default: false,
    },
    attachments: [
      {
        type: String,
        trim: true,
      },
    ],
    transactionSnapshot: {
      type: Schema.Types.Mixed,
    },
  },
  { timestamps: true }
);

// Explicit Indexes matching Database-Schema.md §7.4, Prompt 43 and Module 03
ApprovalRequestSchema.index({ requestCode: 1 }, { unique: true });
ApprovalRequestSchema.index({ organizationId: 1, module: 1, currentStatus: 1 });
ApprovalRequestSchema.index({ documentType: 1, currentStatus: 1 });
ApprovalRequestSchema.index({ requestedBy: 1 });
ApprovalRequestSchema.index({ makerId: 1 });
ApprovalRequestSchema.index({ assignedApproverId: 1, currentStatus: 1 });
ApprovalRequestSchema.index({ assignedRoleId: 1, currentStatus: 1 });
ApprovalRequestSchema.index({ dueDate: 1, currentStatus: 1 });
ApprovalRequestSchema.index({ createdAt: -1 });

export const ApprovalRequestModel = model<IApprovalRequest>(
  'ApprovalRequest',
  ApprovalRequestSchema
);
export default ApprovalRequestModel;
