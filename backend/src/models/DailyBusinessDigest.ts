import { Schema, model, Document, Types } from 'mongoose';

export interface IDailyBusinessDigest extends Document {
  _id: Types.ObjectId;
  organizationId: Types.ObjectId;
  digestDate: string; // YYYY-MM-DD
  salesSummary: {
    totalOrders: number;
    totalRevenue: number;
    completedOrders: number;
  };
  financialSummary: {
    cashInflow: number;
    cashOutflow: number;
    netCashPosition: number;
    overdueReceivables: number;
  };
  inventorySummary: {
    lowStockAlerts: number;
    expiringBatches: number;
    totalValuation: number;
  };
  operationalSummary: {
    openTickets: number;
    slaBreaches: number;
    pendingApprovals: number;
    activeLcs: number;
  };
  keyRisksDetected: string[];
  aiExecutiveNarrative: string;
  generatedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const DailyBusinessDigestSchema = new Schema<IDailyBusinessDigest>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    digestDate: { type: String, required: true },
    salesSummary: {
      totalOrders: { type: Number, default: 0 },
      totalRevenue: { type: Number, default: 0 },
      completedOrders: { type: Number, default: 0 },
    },
    financialSummary: {
      cashInflow: { type: Number, default: 0 },
      cashOutflow: { type: Number, default: 0 },
      netCashPosition: { type: Number, default: 0 },
      overdueReceivables: { type: Number, default: 0 },
    },
    inventorySummary: {
      lowStockAlerts: { type: Number, default: 0 },
      expiringBatches: { type: Number, default: 0 },
      totalValuation: { type: Number, default: 0 },
    },
    operationalSummary: {
      openTickets: { type: Number, default: 0 },
      slaBreaches: { type: Number, default: 0 },
      pendingApprovals: { type: Number, default: 0 },
      activeLcs: { type: Number, default: 0 },
    },
    keyRisksDetected: [{ type: String }],
    aiExecutiveNarrative: { type: String, required: true },
    generatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

DailyBusinessDigestSchema.index({ organizationId: 1, digestDate: 1 }, { unique: true });

export const DailyBusinessDigest = model<IDailyBusinessDigest>('DailyBusinessDigest', DailyBusinessDigestSchema);
