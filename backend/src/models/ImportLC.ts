import { Schema, model, Document, Types } from 'mongoose';

export type LCCurrency = 'USD' | 'EUR' | 'CNY' | 'JPY';
export type LCStatus =
  | 'DRAFT'
  | 'LC_OPENED'
  | 'IN_TRANSIT'
  | 'SHIPMENT_IN_TRANSIT'
  | 'PORT_ARRIVED'
  | 'CUSTOMS_ASSESSED'
  | 'CUSTOMS_CLEARED'
  | 'PORT_CLEARED'
  | 'FINAL_SETTLEMENT'
  | 'SETTLED'
  | 'AMENDED';

export interface IImportLC extends Document {
  _id: Types.ObjectId;
  lcNumber: string;
  version: string;
  organizationId?: Types.ObjectId;
  applicantOrganization?: string;
  supplierId: Types.ObjectId;
  purchaseOrderId?: Types.ObjectId;
  proformaInvoiceId?: Types.ObjectId;
  proformaInvoiceNumber?: string;
  issuingBank: string;
  advisingBank?: string;
  negotiatingBank?: string;
  confirmingBank?: string;
  foreignCurrency: LCCurrency;
  lcValueFC: number;
  openingExchangeRate: number;
  customsAssessmentRate?: number;
  finalSettlementRate?: number;
  realizedFxGainLoss: number;
  lcMarginPercentage?: number;
  lcMarginAmountBDT?: number;
  lcOpeningDate?: Date;
  lcExpiryDate?: Date;
  latestShipmentDate?: Date;
  presentationPeriodDays?: number;
  portOfLoading?: string;
  portOfDischarge?: string;
  incoterms?: string;
  paymentTerms?: string;
  tolerancePercentage?: number;
  responsibleEmployeeId?: Types.ObjectId;
  approvalStatus?: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
  amendmentsCount?: number;
  remarks?: string;
  attachments?: Array<{ fileUrl: string; fileName: string; documentType: string; uploadedAt: Date }>;
  status: LCStatus;
  portArrivalDate?: Date;
  customsClearanceDate?: Date;
  portFreeDays: number;
  demurrageDailyRateBDT?: number;
  demurrageBillableDays?: number;
  calculatedDemurragePenaltyBDT?: number;
  createdAt: Date;
  updatedAt: Date;
}

export const ImportLCSchema = new Schema<IImportLC>(
  {
    lcNumber: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    version: {
      type: String,
      default: 'V1',
      trim: true,
      uppercase: true,
    },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      index: true,
    },
    applicantOrganization: {
      type: String,
      trim: true,
    },
    supplierId: {
      type: Schema.Types.ObjectId,
      ref: 'Supplier',
      required: true,
    },
    purchaseOrderId: {
      type: Schema.Types.ObjectId,
      ref: 'PurchaseOrder',
    },
    proformaInvoiceId: {
      type: Schema.Types.ObjectId,
      ref: 'ProformaInvoice',
    },
    proformaInvoiceNumber: {
      type: String,
      trim: true,
    },
    issuingBank: {
      type: String,
      required: true,
      trim: true,
    },
    advisingBank: {
      type: String,
      trim: true,
    },
    negotiatingBank: {
      type: String,
      trim: true,
    },
    confirmingBank: {
      type: String,
      trim: true,
    },
    foreignCurrency: {
      type: String,
      enum: ['USD', 'EUR', 'CNY', 'JPY'],
      default: 'USD',
      required: true,
    },
    lcValueFC: {
      type: Number,
      required: true,
      min: 0,
    },
    // 3-Tier Foreign Exchange Rate Tracking (DFD DF-08)
    openingExchangeRate: {
      type: Number,
      required: true,
      min: 0,
    },
    customsAssessmentRate: {
      type: Number,
      min: 0,
    },
    finalSettlementRate: {
      type: Number,
      min: 0,
    },
    realizedFxGainLoss: {
      type: Number,
      default: 0.0,
    },
    status: {
      type: String,
      enum: [
        'DRAFT',
        'LC_OPENED',
        'IN_TRANSIT',
        'SHIPMENT_IN_TRANSIT',
        'PORT_ARRIVED',
        'CUSTOMS_ASSESSED',
        'CUSTOMS_CLEARED',
        'PORT_CLEARED',
        'FINAL_SETTLEMENT',
        'SETTLED',
        'AMENDED',
      ],
      default: 'LC_OPENED',
      required: true,
    },
    portArrivalDate: {
      type: Date,
    },
    customsClearanceDate: {
      type: Date,
    },
    portFreeDays: {
      type: Number,
      default: 4,
      min: 0,
    },
    demurrageDailyRateBDT: {
      type: Number,
      default: 0,
      min: 0,
    },
    demurrageBillableDays: {
      type: Number,
      default: 0,
      min: 0,
    },
    calculatedDemurragePenaltyBDT: {
      type: Number,
      default: 0,
      min: 0,
    },
    lcMarginPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    lcMarginAmountBDT: {
      type: Number,
      default: 0,
      min: 0,
    },
    lcOpeningDate: {
      type: Date,
    },
    lcExpiryDate: {
      type: Date,
      index: true,
    },
    latestShipmentDate: {
      type: Date,
    },
    presentationPeriodDays: {
      type: Number,
      default: 21,
    },
    portOfLoading: {
      type: String,
      trim: true,
    },
    portOfDischarge: {
      type: String,
      trim: true,
      default: 'Chittagong Port',
    },
    incoterms: {
      type: String,
      trim: true,
      default: 'CFR',
    },
    paymentTerms: {
      type: String,
      trim: true,
      default: 'Sight LC (100% at sight)',
    },
    tolerancePercentage: {
      type: Number,
      default: 5,
    },
    responsibleEmployeeId: {
      type: Schema.Types.ObjectId,
      ref: 'EmployeeProfile',
    },
    approvalStatus: {
      type: String,
      enum: ['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED'],
      default: 'APPROVED',
      index: true,
    },
    amendmentsCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    remarks: {
      type: String,
      trim: true,
    },
    attachments: [
      {
        fileUrl: { type: String, required: true },
        fileName: { type: String, required: true },
        documentType: { type: String, default: 'LC_COPY' },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

// Explicit Indexes per Database-Schema.md §3.5 & prompt.md §17.5
ImportLCSchema.index({ lcNumber: 1 }, { unique: true });
ImportLCSchema.index({ status: 1 });
ImportLCSchema.index({ supplierId: 1 });
ImportLCSchema.index({ purchaseOrderId: 1 });

export const ImportLCModel = model<IImportLC>('ImportLC', ImportLCSchema);
