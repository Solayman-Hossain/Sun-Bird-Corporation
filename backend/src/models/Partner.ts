import { Schema, model, Document, Types } from 'mongoose';

export interface IPartnerAllocation {
  period: string; // e.g. "2026-Q3"
  allocatedAmount: number;
  journalRef?: string;
  approvedAt?: Date;
}

export interface IPartner extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  partnerName: string;
  capitalContribution: number;
  currentAccountBalance: number;
  joinedDate: Date;
  exitDate?: Date;
  isEligibleForAllocation: boolean;
  profitShareRatio?: number; // e.g. 50 for 50%
  drawingsBalance?: number;
  allocationTransactions: IPartnerAllocation[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const PartnerAllocationSchema = new Schema<IPartnerAllocation>(
  {
    period: {
      type: String,
      required: true,
      trim: true,
    },
    allocatedAmount: {
      type: Number,
      required: true,
    },
    journalRef: {
      type: String,
      trim: true,
    },
    approvedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

export const PartnerSchema = new Schema<IPartner>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    partnerName: {
      type: String,
      required: true,
      trim: true,
    },
    capitalContribution: {
      type: Number,
      required: true,
      default: 0,
    },
    currentAccountBalance: {
      type: Number,
      default: 0,
    },
    joinedDate: {
      type: Date,
      required: true,
    },
    exitDate: {
      type: Date,
    },
    isEligibleForAllocation: {
      type: Boolean,
      default: true,
    },
    profitShareRatio: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    drawingsBalance: {
      type: Number,
      default: 0,
    },
    allocationTransactions: {
      type: [PartnerAllocationSchema],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Explicit Indexes per Database-Schema.md §5.5 & prompt.md §31.5
PartnerSchema.index({ userId: 1 }, { unique: true });
PartnerSchema.index({ isActive: 1 });

export const PartnerModel = model<IPartner>('Partner', PartnerSchema);
export default PartnerModel;
