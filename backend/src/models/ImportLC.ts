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
  supplierId: Types.ObjectId;
  purchaseOrderId?: Types.ObjectId;
  issuingBank: string;
  foreignCurrency: LCCurrency;
  lcValueFC: number;
  openingExchangeRate: number;
  customsAssessmentRate?: number;
  finalSettlementRate?: number;
  realizedFxGainLoss: number;
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
    supplierId: {
      type: Schema.Types.ObjectId,
      ref: 'Supplier',
      required: true,
    },
    purchaseOrderId: {
      type: Schema.Types.ObjectId,
      ref: 'PurchaseOrder',
    },
    issuingBank: {
      type: String,
      required: true,
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
  },
  { timestamps: true }
);

// Explicit Indexes per Database-Schema.md §3.5 & prompt.md §17.5
ImportLCSchema.index({ lcNumber: 1 }, { unique: true });
ImportLCSchema.index({ status: 1 });
ImportLCSchema.index({ supplierId: 1 });
ImportLCSchema.index({ purchaseOrderId: 1 });

export const ImportLCModel = model<IImportLC>('ImportLC', ImportLCSchema);
