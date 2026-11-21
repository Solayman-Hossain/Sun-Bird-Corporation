import { Schema, model, Document, Types } from 'mongoose';

export interface IImportSettings extends Document {
  _id: Types.ObjectId;
  organizationId: Types.ObjectId;
  defaultCurrency: string;
  defaultPortOfLoading: string;
  defaultPortOfDischarge: string;
  defaultFreeDays: number;
  defaultDemurrageDailyRateBDT: number;
  defaultTolerancePercentage: number;
  customsDutyDefaults: {
    cdPercent: number;
    rdPercent: number;
    sdPercent: number;
    vatPercent: number;
    aitPercent: number;
    atPercent: number;
  };
  exchangeRateBufferPercent: number;
  aiAutoRiskDetection: boolean;
  aiAutoDocumentReading: boolean;
  notifyOnLcExpiryDays: number;
  notifyOnShipmentDelayDays: number;
  createdAt: Date;
  updatedAt: Date;
}

export const ImportSettingsSchema = new Schema<IImportSettings>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      unique: true,
      index: true,
    },
    defaultCurrency: { type: String, default: 'USD', trim: true },
    defaultPortOfLoading: { type: String, default: 'Keelung, Taiwan', trim: true },
    defaultPortOfDischarge: { type: String, default: 'Chittagong Port', trim: true },
    defaultFreeDays: { type: Number, default: 4, min: 0 },
    defaultDemurrageDailyRateBDT: { type: Number, default: 5000, min: 0 },
    defaultTolerancePercentage: { type: Number, default: 5, min: 0 },
    customsDutyDefaults: {
      cdPercent: { type: Number, default: 10 },
      rdPercent: { type: Number, default: 3 },
      sdPercent: { type: Number, default: 0 },
      vatPercent: { type: Number, default: 15 },
      aitPercent: { type: Number, default: 5 },
      atPercent: { type: Number, default: 5 },
    },
    exchangeRateBufferPercent: { type: Number, default: 2.5, min: 0 },
    aiAutoRiskDetection: { type: Boolean, default: true },
    aiAutoDocumentReading: { type: Boolean, default: true },
    notifyOnLcExpiryDays: { type: Number, default: 30, min: 1 },
    notifyOnShipmentDelayDays: { type: Number, default: 3, min: 1 },
  },
  { timestamps: true }
);

export const ImportSettingsModel = model<IImportSettings>('ImportSettings', ImportSettingsSchema);
