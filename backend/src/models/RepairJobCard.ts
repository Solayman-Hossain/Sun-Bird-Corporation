import { Schema, model, Document, Types } from 'mongoose';

export type JobCardStatus =
  | 'PENDING_ASSIGNMENT'
  | 'IN_DIAGNOSIS'
  | 'AWAITING_PARTS'
  | 'IN_REPAIR'
  | 'TESTING_QC'
  | 'COMPLETED'
  | 'DELIVERED_TO_CUSTOMER'
  | 'CANCELLED';

export interface ISparePartUsage {
  sparePartId?: Types.ObjectId;
  partName: string;
  partCode: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
}

export interface IRepairJobCard extends Document {
  _id: Types.ObjectId;
  organizationId: Types.ObjectId;
  jobNumber: string; // JOB-2026-0001
  ticketId?: Types.ObjectId;
  warrantyClaimId?: Types.ObjectId;
  serviceCenterName: string;
  productId: Types.ObjectId;
  productName: string;
  serialNumber?: string;
  customerName: string;
  customerPhone: string;
  technicianId?: Types.ObjectId;
  technicianName?: string;
  faultDescription: string;
  diagnosisNotes?: string;
  sparePartsUsed: ISparePartUsage[];
  laborHours: number;
  laborRatePerHour: number;
  totalLaborCost: number;
  totalPartsCost: number;
  grandTotalCost: number;
  warrantyCoveredCost: number;
  customerPayableAmount: number;
  status: JobCardStatus;
  qcPassed: boolean;
  qcNotes?: string;
  completedAt?: Date;
  deliveredAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const RepairJobCardSchema = new Schema<IRepairJobCard>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    jobNumber: { type: String, required: true, unique: true, uppercase: true, trim: true },
    ticketId: { type: Schema.Types.ObjectId, ref: 'SupportTicket' },
    warrantyClaimId: { type: Schema.Types.ObjectId, ref: 'WarrantyClaim' },
    serviceCenterName: { type: String, default: 'Central Service & Repair Lab', trim: true },
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    productName: { type: String, required: true },
    serialNumber: { type: String, trim: true },
    customerName: { type: String, required: true, trim: true },
    customerPhone: { type: String, required: true, trim: true },
    technicianId: { type: Schema.Types.ObjectId, ref: 'User' },
    technicianName: { type: String, trim: true },
    faultDescription: { type: String, required: true },
    diagnosisNotes: { type: String },
    sparePartsUsed: [
      {
        sparePartId: { type: Schema.Types.ObjectId, ref: 'Product' },
        partName: { type: String, required: true },
        partCode: { type: String, required: true },
        quantity: { type: Number, required: true, min: 1 },
        unitCost: { type: Number, required: true, default: 0 },
        totalCost: { type: Number, required: true, default: 0 },
      },
    ],
    laborHours: { type: Number, default: 0 },
    laborRatePerHour: { type: Number, default: 500 }, // BDT 500/hr default
    totalLaborCost: { type: Number, default: 0 },
    totalPartsCost: { type: Number, default: 0 },
    grandTotalCost: { type: Number, default: 0 },
    warrantyCoveredCost: { type: Number, default: 0 },
    customerPayableAmount: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['PENDING_ASSIGNMENT', 'IN_DIAGNOSIS', 'AWAITING_PARTS', 'IN_REPAIR', 'TESTING_QC', 'COMPLETED', 'DELIVERED_TO_CUSTOMER', 'CANCELLED'],
      default: 'PENDING_ASSIGNMENT',
      index: true,
    },
    qcPassed: { type: Boolean, default: false },
    qcNotes: { type: String },
    completedAt: { type: Date },
    deliveredAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

RepairJobCardSchema.index({ organizationId: 1, status: 1 });
RepairJobCardSchema.index({ organizationId: 1, serialNumber: 1 });

export const RepairJobCard = model<IRepairJobCard>('RepairJobCard', RepairJobCardSchema);
