import { Schema, model, Document, Types } from 'mongoose';

export interface IWorkflowLevel {
  levelNumber: number;
  levelName: string;
  approverType: 'USER' | 'ROLE';
  approverId?: Types.ObjectId;
  roleId?: Types.ObjectId;
  roleSlug?: string;
  requiredCount: number;
  isParallel?: boolean;
  slaHours?: number;
}

export interface IApprovalWorkflow extends Document {
  _id: Types.ObjectId;
  workflowName: string;
  workflowCode: string;
  organizationId?: Types.ObjectId;
  module: string;
  transactionType: string;
  minAmount: number;
  maxAmount: number;
  approvalLevels: IWorkflowLevel[];
  autoEscalation: boolean;
  escalateAfterHours?: number;
  escalateToRoleId?: Types.ObjectId;
  effectiveDate?: Date;
  expiryDate?: Date;
  isActive: boolean;
  createdBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export const WorkflowLevelSchema = new Schema<IWorkflowLevel>(
  {
    levelNumber: {
      type: Number,
      required: true,
      min: 1,
    },
    levelName: {
      type: String,
      required: true,
      trim: true,
    },
    approverType: {
      type: String,
      enum: ['USER', 'ROLE'],
      default: 'ROLE',
    },
    approverId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    roleId: {
      type: Schema.Types.ObjectId,
      ref: 'Role',
    },
    roleSlug: {
      type: String,
      trim: true,
      lowercase: true,
    },
    requiredCount: {
      type: Number,
      default: 1,
      min: 1,
    },
    isParallel: {
      type: Boolean,
      default: false,
    },
    slaHours: {
      type: Number,
      default: 24,
      min: 1,
    },
  },
  { _id: false }
);

export const ApprovalWorkflowSchema = new Schema<IApprovalWorkflow>(
  {
    workflowName: {
      type: String,
      required: true,
      trim: true,
    },
    workflowCode: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
    },
    module: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    transactionType: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    minAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    maxAmount: {
      type: Number,
      default: 1000000000, // 1 Billion BDT fallback ceiling
      min: 0,
    },
    approvalLevels: {
      type: [WorkflowLevelSchema],
      default: [],
    },
    autoEscalation: {
      type: Boolean,
      default: false,
    },
    escalateAfterHours: {
      type: Number,
      default: 48,
    },
    escalateToRoleId: {
      type: Schema.Types.ObjectId,
      ref: 'Role',
    },
    effectiveDate: {
      type: Date,
      default: Date.now,
    },
    expiryDate: {
      type: Date,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

ApprovalWorkflowSchema.index({ workflowCode: 1 }, { unique: true });
ApprovalWorkflowSchema.index({ organizationId: 1, module: 1, transactionType: 1, isActive: 1 });
ApprovalWorkflowSchema.index({ minAmount: 1, maxAmount: 1 });

export const ApprovalWorkflowModel = model<IApprovalWorkflow>(
  'ApprovalWorkflow',
  ApprovalWorkflowSchema
);
export default ApprovalWorkflowModel;

