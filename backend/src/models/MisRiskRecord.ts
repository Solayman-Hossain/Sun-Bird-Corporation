import { Schema, model, Document, Types } from 'mongoose';

export type MisRiskCategory =
  | 'FINANCIAL_ANOMALY'
  | 'UNUSUAL_EXPENSE'
  | 'SALES_DECLINE'
  | 'CASH_SHORTAGE'
  | 'OVERDUE_RECEIVABLES'
  | 'SUPPLIER_PAYMENT_RISK'
  | 'INVENTORY_STOCKOUT'
  | 'OVERSTOCK'
  | 'DEAD_STOCK'
  | 'PRODUCT_EXPIRY'
  | 'PURCHASE_PRICE_ANOMALY'
  | 'LC_EXPIRY'
  | 'SHIPMENT_DELAY'
  | 'IMPORT_COST_INCREASE'
  | 'DEFECT_SURGE'
  | 'SLA_BREACH'
  | 'REFUND_ANOMALY';

export type MisRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface IMisRiskRecord extends Document {
  _id: Types.ObjectId;
  organizationId: Types.ObjectId;
  riskId: string; // RSK-2026-0001
  riskCategory: MisRiskCategory;
  relatedModule: 'SALES' | 'ACCOUNTING' | 'INVENTORY' | 'PROCUREMENT' | 'IMPORT' | 'HR' | 'SUPPORT' | 'MARKETING';
  relatedRecordId?: string;
  riskLevel: MisRiskLevel;
  title: string;
  explanation: string;
  supportingData: Record<string, any>;
  recommendedAction: string;
  assignedTo?: Types.ObjectId;
  assignedToName?: string;
  status: 'DETECTED' | 'UNDER_REVIEW' | 'MITIGATED' | 'DISMISSED';
  mitigationNotes?: string;
  mitigatedAt?: Date;
  detectedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const MisRiskRecordSchema = new Schema<IMisRiskRecord>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    riskId: { type: String, required: true, unique: true, uppercase: true, trim: true },
    riskCategory: {
      type: String,
      enum: [
        'FINANCIAL_ANOMALY',
        'UNUSUAL_EXPENSE',
        'SALES_DECLINE',
        'CASH_SHORTAGE',
        'OVERDUE_RECEIVABLES',
        'SUPPLIER_PAYMENT_RISK',
        'INVENTORY_STOCKOUT',
        'OVERSTOCK',
        'DEAD_STOCK',
        'PRODUCT_EXPIRY',
        'PURCHASE_PRICE_ANOMALY',
        'LC_EXPIRY',
        'SHIPMENT_DELAY',
        'IMPORT_COST_INCREASE',
        'DEFECT_SURGE',
        'SLA_BREACH',
        'REFUND_ANOMALY',
      ],
      required: true,
      index: true,
    },
    relatedModule: {
      type: String,
      enum: ['SALES', 'ACCOUNTING', 'INVENTORY', 'PROCUREMENT', 'IMPORT', 'HR', 'SUPPORT', 'MARKETING'],
      required: true,
      index: true,
    },
    relatedRecordId: { type: String },
    riskLevel: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      default: 'MEDIUM',
      index: true,
    },
    title: { type: String, required: true, trim: true },
    explanation: { type: String, required: true },
    supportingData: { type: Schema.Types.Mixed, default: {} },
    recommendedAction: { type: String, required: true },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
    assignedToName: { type: String, trim: true },
    status: {
      type: String,
      enum: ['DETECTED', 'UNDER_REVIEW', 'MITIGATED', 'DISMISSED'],
      default: 'DETECTED',
      index: true,
    },
    mitigationNotes: { type: String },
    mitigatedAt: { type: Date },
    detectedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

MisRiskRecordSchema.index({ organizationId: 1, status: 1, riskLevel: 1 });

export const MisRiskRecord = model<IMisRiskRecord>('MisRiskRecord', MisRiskRecordSchema);
