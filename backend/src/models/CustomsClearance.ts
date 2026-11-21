import { Schema, model, Document, Types } from 'mongoose';

export interface ICustomsClearance extends Document {
  _id: Types.ObjectId;
  billOfEntryNumber: string;
  billOfEntryDate: Date;
  organizationId: Types.ObjectId;
  lcId: Types.ObjectId;
  lcNumber: string;
  shipmentId?: Types.ObjectId;
  shipmentReference?: string;
  customsHouse: string;
  cfAgentName?: string;
  cfAgentPhone?: string;
  hsCodes: string[];
  assessableValueBDT: number;
  customsDutyBDT: number;
  regulatoryDutyBDT: number;
  supplementaryDutyBDT: number;
  vatBDT: number;
  advanceTaxBDT: number;
  advanceIncomeTaxBDT: number;
  otherGovtChargesBDT: number;
  totalDutyAndTaxesBDT: number;
  portChargesBDT: number;
  cfAgentChargesBDT: number;
  demurrageChargesBDT: number;
  detentionChargesBDT: number;
  totalClearanceCostBDT: number;
  clearanceStatus:
    | 'DRAFT'
    | 'DOCUMENT_SUBMITTED'
    | 'ASSESSMENT_COMPLETED'
    | 'DUTY_PAID'
    | 'PHYSICAL_EXAMINATION'
    | 'OUT_OF_CHARGE'
    | 'DELIVERED_TO_DEPOT';
  outOfChargeDate?: Date;
  deliveryChallanNumber?: string;
  assignedWarehouseId?: Types.ObjectId;
  notes?: string;
  attachments?: Array<{
    fileUrl: string;
    fileName: string;
    documentType: string;
    uploadedAt: Date;
  }>;
  aiHsCodeValidation?: {
    suggestedHsCode?: string;
    dutyRateExplanation?: string;
    anomalyDetected?: boolean;
    explanation?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export const CustomsClearanceSchema = new Schema<ICustomsClearance>(
  {
    billOfEntryNumber: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    billOfEntryDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
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
    shipmentId: {
      type: Schema.Types.ObjectId,
      ref: 'ImportShipment',
    },
    shipmentReference: { type: String, trim: true, uppercase: true },
    customsHouse: {
      type: String,
      default: 'Chittagong Custom House',
      trim: true,
    },
    cfAgentName: { type: String, trim: true },
    cfAgentPhone: { type: String, trim: true },
    hsCodes: [{ type: String, trim: true }],
    assessableValueBDT: { type: Number, required: true, min: 0 },
    customsDutyBDT: { type: Number, default: 0, min: 0 },
    regulatoryDutyBDT: { type: Number, default: 0, min: 0 },
    supplementaryDutyBDT: { type: Number, default: 0, min: 0 },
    vatBDT: { type: Number, default: 0, min: 0 },
    advanceTaxBDT: { type: Number, default: 0, min: 0 },
    advanceIncomeTaxBDT: { type: Number, default: 0, min: 0 },
    otherGovtChargesBDT: { type: Number, default: 0, min: 0 },
    totalDutyAndTaxesBDT: { type: Number, required: true, min: 0 },
    portChargesBDT: { type: Number, default: 0, min: 0 },
    cfAgentChargesBDT: { type: Number, default: 0, min: 0 },
    demurrageChargesBDT: { type: Number, default: 0, min: 0 },
    detentionChargesBDT: { type: Number, default: 0, min: 0 },
    totalClearanceCostBDT: { type: Number, required: true, min: 0 },
    clearanceStatus: {
      type: String,
      enum: [
        'DRAFT',
        'DOCUMENT_SUBMITTED',
        'ASSESSMENT_COMPLETED',
        'DUTY_PAID',
        'PHYSICAL_EXAMINATION',
        'OUT_OF_CHARGE',
        'DELIVERED_TO_DEPOT',
      ],
      default: 'DRAFT',
      index: true,
    },
    outOfChargeDate: { type: Date },
    deliveryChallanNumber: { type: String, trim: true },
    assignedWarehouseId: { type: Schema.Types.ObjectId, ref: 'Warehouse' },
    notes: { type: String, trim: true },
    attachments: [
      {
        fileUrl: { type: String, required: true },
        fileName: { type: String, required: true },
        documentType: { type: String, default: 'BILL_OF_ENTRY' },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    aiHsCodeValidation: {
      suggestedHsCode: { type: String },
      dutyRateExplanation: { type: String },
      anomalyDetected: { type: Boolean, default: false },
      explanation: { type: String },
    },
  },
  { timestamps: true }
);

CustomsClearanceSchema.index({ organizationId: 1, billOfEntryNumber: 1 }, { unique: true });

export const CustomsClearanceModel = model<ICustomsClearance>('CustomsClearance', CustomsClearanceSchema);
