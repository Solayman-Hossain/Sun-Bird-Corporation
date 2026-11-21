import { Schema, model, Document, Types } from 'mongoose';

export type MisForecastType =
  | 'SALES'
  | 'REVENUE'
  | 'CASH_FLOW'
  | 'PRODUCT_DEMAND'
  | 'INVENTORY'
  | 'PURCHASE_REQUIREMENT'
  | 'EXPENSE'
  | 'RECEIVABLE_COLLECTION'
  | 'PAYABLE'
  | 'IMPORT_COST'
  | 'SHIPMENT_DELAY'
  | 'CUSTOMER_RETURN';

export type ForecastScenario = 'CONSERVATIVE' | 'EXPECTED' | 'OPTIMISTIC' | 'CUSTOM';

export interface IMisForecastRecord extends Document {
  _id: Types.ObjectId;
  organizationId: Types.ObjectId;
  forecastCode: string; // e.g. FC-2026-0001
  forecastType: MisForecastType;
  timeHorizon: '30_DAYS' | '90_DAYS' | '6_MONTHS' | '1_YEAR';
  scenario: ForecastScenario;
  historicalPeriodMonths: number;
  forecastMethod: string;
  baselineActual: number;
  predictedValue: number;
  lowerBound: number;
  upperBound: number;
  confidenceScore: number; // 0 - 100
  assumptions: string[];
  aiExplanation: string;
  trendDirection: 'UP' | 'DOWN' | 'STABLE';
  monthlyProjections: Array<{
    month: string;
    predictedAmount: number;
    confidenceMin: number;
    confidenceMax: number;
  }>;
  generatedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const MisForecastRecordSchema = new Schema<IMisForecastRecord>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    forecastCode: { type: String, required: true, unique: true, uppercase: true, trim: true },
    forecastType: {
      type: String,
      enum: ['SALES', 'REVENUE', 'CASH_FLOW', 'PRODUCT_DEMAND', 'INVENTORY', 'PURCHASE_REQUIREMENT', 'EXPENSE', 'RECEIVABLE_COLLECTION', 'PAYABLE', 'IMPORT_COST', 'SHIPMENT_DELAY', 'CUSTOMER_RETURN'],
      required: true,
      index: true,
    },
    timeHorizon: { type: String, enum: ['30_DAYS', '90_DAYS', '6_MONTHS', '1_YEAR'], default: '90_DAYS' },
    scenario: { type: String, enum: ['CONSERVATIVE', 'EXPECTED', 'OPTIMISTIC', 'CUSTOM'], default: 'EXPECTED' },
    historicalPeriodMonths: { type: Number, default: 6 },
    forecastMethod: { type: String, default: 'GEMINI_AI_HYBRID' },
    baselineActual: { type: Number, required: true },
    predictedValue: { type: Number, required: true },
    lowerBound: { type: Number, required: true },
    upperBound: { type: Number, required: true },
    confidenceScore: { type: Number, default: 85 },
    assumptions: [{ type: String }],
    aiExplanation: { type: String, required: true },
    trendDirection: { type: String, enum: ['UP', 'DOWN', 'STABLE'], default: 'UP' },
    monthlyProjections: [
      {
        month: { type: String, required: true },
        predictedAmount: { type: Number, required: true },
        confidenceMin: { type: Number, required: true },
        confidenceMax: { type: Number, required: true },
      },
    ],
    generatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

MisForecastRecordSchema.index({ organizationId: 1, forecastType: 1, generatedAt: -1 });

export const MisForecastRecord = model<IMisForecastRecord>('MisForecastRecord', MisForecastRecordSchema);
