import { Schema, model, Document, Types } from 'mongoose';

export type LandedCostAllocationMethod =
  | 'BY_VALUE'
  | 'BY_QUANTITY'
  | 'BY_WEIGHT';

export interface ILandedCostAllocation {
  productId?: Types.ObjectId;
  sku?: string;
  quantity?: number;
  fobValueBDT?: number;
  weightKg?: number;
  allocatedCost?: number;
  landedUnitCost?: number; // Final WAC unit cost (BDT)
  batchId?: Types.ObjectId;
}

export interface ILandedCost extends Document {
  _id: Types.ObjectId;
  lcId: Types.ObjectId;
  lcNumber: string;
  fobValueBDT?: number;
  customsDuty: number;
  regulatoryDuty?: number;
  advanceIncomeTax?: number;
  vatAmount?: number;
  portDemurragePenalty: number;
  cfAgentCharges: number;
  marineInsurance: number;
  portHandlingCharges: number;
  inlandFreight?: number;
  bankCharges: number;
  otherCharges: number;
  totalLandedCostBDT: number;
  allocationMethod: LandedCostAllocationMethod;
  allocations: ILandedCostAllocation[];
  journalEntryId?: Types.ObjectId;
  reviewedBy?: Types.ObjectId;
  isFinalized: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const LandedCostAllocationSchema = new Schema<ILandedCostAllocation>(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
    },
    sku: {
      type: String,
      uppercase: true,
      trim: true,
    },
    quantity: {
      type: Number,
      min: 0,
    },
    fobValueBDT: {
      type: Number,
      min: 0,
    },
    weightKg: {
      type: Number,
      min: 0,
    },
    allocatedCost: {
      type: Number,
      min: 0,
    },
    landedUnitCost: {
      type: Number,
      min: 0,
    },
    batchId: {
      type: Schema.Types.ObjectId,
      ref: 'ProductBatch',
    },
  },
  { _id: false }
);

export const LandedCostSchema = new Schema<ILandedCost>(
  {
    lcId: {
      type: Schema.Types.ObjectId,
      ref: 'ImportLC',
      required: true,
    },
    lcNumber: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    fobValueBDT: {
      type: Number,
      default: 0.0,
      min: 0,
    },
    customsDuty: {
      type: Number,
      default: 0.0,
      min: 0,
    },
    regulatoryDuty: {
      type: Number,
      default: 0.0,
      min: 0,
    },
    advanceIncomeTax: {
      type: Number,
      default: 0.0,
      min: 0,
    },
    vatAmount: {
      type: Number,
      default: 0.0,
      min: 0,
    },
    portDemurragePenalty: {
      type: Number,
      default: 0.0,
      min: 0,
    },
    cfAgentCharges: {
      type: Number,
      default: 0.0,
      min: 0,
    },
    marineInsurance: {
      type: Number,
      default: 0.0,
      min: 0,
    },
    portHandlingCharges: {
      type: Number,
      default: 0.0,
      min: 0,
    },
    inlandFreight: {
      type: Number,
      default: 0.0,
      min: 0,
    },
    bankCharges: {
      type: Number,
      default: 0.0,
      min: 0,
    },
    otherCharges: {
      type: Number,
      default: 0.0,
      min: 0,
    },
    totalLandedCostBDT: {
      type: Number,
      default: 0.0,
      min: 0,
    },
    allocationMethod: {
      type: String,
      enum: ['BY_VALUE', 'BY_QUANTITY', 'BY_WEIGHT'],
      default: 'BY_VALUE',
      required: true,
    },
    allocations: [LandedCostAllocationSchema],
    journalEntryId: {
      type: Schema.Types.ObjectId,
      ref: 'JournalEntry',
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    isFinalized: {
      type: Boolean,
      default: false,
      required: true,
    },
  },
  { timestamps: true }
);

// Explicit Indexes per Database-Schema.md §3.6 & prompt.md §17.6
LandedCostSchema.index({ lcId: 1 }, { unique: true });
LandedCostSchema.index({ lcNumber: 1 });
LandedCostSchema.index({ isFinalized: 1 });

export const LandedCostModel = model<ILandedCost>('LandedCost', LandedCostSchema);
