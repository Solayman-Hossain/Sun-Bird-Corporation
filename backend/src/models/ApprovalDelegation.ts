import { Schema, model, Document, Types } from 'mongoose';

export interface IApprovalDelegation extends Document {
  _id: Types.ObjectId;
  originalApproverId: Types.ObjectId;
  delegatedApproverId: Types.ObjectId;
  organizationId?: Types.ObjectId;
  moduleScope: string[];
  startDate: Date;
  endDate: Date;
  reason: string;
  isActive: boolean;
  createdBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export const ApprovalDelegationSchema = new Schema<IApprovalDelegation>(
  {
    originalApproverId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    delegatedApproverId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
    },
    moduleScope: [
      {
        type: String,
        trim: true,
        uppercase: true,
      },
    ],
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
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

ApprovalDelegationSchema.index({ originalApproverId: 1, isActive: 1 });
ApprovalDelegationSchema.index({ delegatedApproverId: 1, isActive: 1 });
ApprovalDelegationSchema.index({ startDate: 1, endDate: 1 });

export const ApprovalDelegationModel = model<IApprovalDelegation>(
  'ApprovalDelegation',
  ApprovalDelegationSchema
);
export default ApprovalDelegationModel;

