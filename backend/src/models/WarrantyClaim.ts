import { Schema, model, Document, Types } from 'mongoose';

export type WarrantyClaimStatus =
  | 'SUBMITTED'
  | 'VERIFIED'
  | 'APPROVED'
  | 'IN_REPAIR'
  | 'REPLACED'
  | 'REJECTED'
  | 'CLOSED';

export interface IWarrantyClaim extends Document {
  _id: Types.ObjectId;
  organizationId: Types.ObjectId;
  claimNumber: string; // WCL-2026-0001
  warrantyId: Types.ObjectId;
  ticketId?: Types.ObjectId;
  serialNumber: string;
  customerId?: Types.ObjectId;
  customerName: string;
  problemDescription: string;
  reportedDefects: string[];
  status: WarrantyClaimStatus;
  coveredParts: string[];
  isCovered: boolean;
  rejectionReason?: string;
  repairedJobCardId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const WarrantyClaimSchema = new Schema<IWarrantyClaim>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    claimNumber: { type: String, required: true, unique: true, uppercase: true, trim: true },
    warrantyId: { type: Schema.Types.ObjectId, ref: 'WarrantyRecord', required: true, index: true },
    ticketId: { type: Schema.Types.ObjectId, ref: 'SupportTicket' },
    serialNumber: { type: String, required: true, trim: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer' },
    customerName: { type: String, required: true, trim: true },
    problemDescription: { type: String, required: true },
    reportedDefects: [{ type: String, trim: true }],
    status: {
      type: String,
      enum: ['SUBMITTED', 'VERIFIED', 'APPROVED', 'IN_REPAIR', 'REPLACED', 'REJECTED', 'CLOSED'],
      default: 'SUBMITTED',
      index: true,
    },
    coveredParts: [{ type: String }],
    isCovered: { type: Boolean, default: true },
    rejectionReason: { type: String },
    repairedJobCardId: { type: Schema.Types.ObjectId, ref: 'RepairJobCard' },
  },
  {
    timestamps: true,
  }
);

WarrantyClaimSchema.index({ organizationId: 1, warrantyId: 1 });
WarrantyClaimSchema.index({ organizationId: 1, serialNumber: 1 });

export const WarrantyClaim = model<IWarrantyClaim>('WarrantyClaim', WarrantyClaimSchema);
