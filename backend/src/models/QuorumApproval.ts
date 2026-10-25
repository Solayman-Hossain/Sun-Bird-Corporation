import { Schema, model, Document, Types } from 'mongoose';

export interface IDirectorApproval {
  directorId: Types.ObjectId;
  directorRole?: 'MD' | 'DIRECTOR_ADMIN' | 'DIRECTOR_FINANCE';
  approvedAt: Date;
  signatureHash: string;
  ipAddress?: string;
}

export interface IQuorumApproval extends Document {
  _id: Types.ObjectId;
  targetCollection: string;
  targetId: Types.ObjectId;
  targetRef: string;
  quorumTier: 3 | 4;
  requiredCount: number;
  approvals: IDirectorApproval[];
  isComplete: boolean;
  completedAt?: Date;
  emergencyOverride: boolean;
  overrideReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export const DirectorApprovalSchema = new Schema<IDirectorApproval>(
  {
    directorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    directorRole: {
      type: String,
      enum: ['MD', 'DIRECTOR_ADMIN', 'DIRECTOR_FINANCE'],
    },
    approvedAt: {
      type: Date,
      default: Date.now,
      required: true,
    },
    signatureHash: {
      type: String,
      required: true,
      trim: true,
    },
    ipAddress: {
      type: String,
      trim: true,
    },
  },
  { _id: false }
);

export const QuorumApprovalSchema = new Schema<IQuorumApproval>(
  {
    targetCollection: {
      type: String,
      required: true,
      trim: true,
    },
    targetId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    targetRef: {
      type: String,
      required: true,
      trim: true,
    },
    quorumTier: {
      type: Number,
      enum: [3, 4],
      required: true,
    },
    requiredCount: {
      type: Number,
      required: true,
      min: 1,
    },
    approvals: [DirectorApprovalSchema],
    isComplete: {
      type: Boolean,
      default: false,
    },
    completedAt: {
      type: Date,
    },
    emergencyOverride: {
      type: Boolean,
      default: false,
    },
    overrideReason: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

QuorumApprovalSchema.index({ targetId: 1, targetCollection: 1 });
QuorumApprovalSchema.index({ isComplete: 1 });
QuorumApprovalSchema.index({ targetCollection: 1, isComplete: 1 });
QuorumApprovalSchema.index({ 'approvals.directorId': 1 });
QuorumApprovalSchema.index({ createdAt: -1 });
QuorumApprovalSchema.index({ emergencyOverride: 1 });

export const QuorumApprovalModel = model<IQuorumApproval>(
  'QuorumApproval',
  QuorumApprovalSchema
);

export default QuorumApprovalModel;
