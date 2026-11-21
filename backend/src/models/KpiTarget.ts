import { Schema, model, Document, Types } from 'mongoose';

export type KpiCategory =
  | 'FINANCIAL'
  | 'SALES'
  | 'PROCUREMENT'
  | 'INVENTORY'
  | 'ECOMMERCE'
  | 'MARKETING'
  | 'HR'
  | 'SUPPORT'
  | 'IMPORT'
  | 'OPERATIONAL';

export interface IKpiTarget extends Document {
  _id: Types.ObjectId;
  organizationId: Types.ObjectId;
  kpiCode: string; // e.g. KPI-REV-01
  name: string;
  category: KpiCategory;
  department?: string;
  responsiblePersonId?: Types.ObjectId;
  responsiblePersonName?: string;
  measurementUnit: string; // BDT, %, UNITS, HOURS, DAYS
  calculationMethod: string;
  targetValue: number;
  minThreshold?: number;
  maxThreshold?: number;
  period: 'MONTHLY' | 'QUARTERLY' | 'ANNUAL';
  fiscalYear: string; // e.g. FY2026
  status: 'ACTIVE' | 'ARCHIVED';
  actualValue: number;
  achievementPercent: number;
  variance: number;
  createdAt: Date;
  updatedAt: Date;
}

const KpiTargetSchema = new Schema<IKpiTarget>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    kpiCode: { type: String, required: true, uppercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ['FINANCIAL', 'SALES', 'PROCUREMENT', 'INVENTORY', 'ECOMMERCE', 'MARKETING', 'HR', 'SUPPORT', 'IMPORT', 'OPERATIONAL'],
      required: true,
      index: true,
    },
    department: { type: String, trim: true },
    responsiblePersonId: { type: Schema.Types.ObjectId, ref: 'User' },
    responsiblePersonName: { type: String, trim: true },
    measurementUnit: { type: String, default: 'BDT' },
    calculationMethod: { type: String, default: 'SUM_POSTED' },
    targetValue: { type: Number, required: true },
    minThreshold: { type: Number },
    maxThreshold: { type: Number },
    period: { type: String, enum: ['MONTHLY', 'QUARTERLY', 'ANNUAL'], default: 'MONTHLY' },
    fiscalYear: { type: String, default: 'FY2026' },
    status: { type: String, enum: ['ACTIVE', 'ARCHIVED'], default: 'ACTIVE', index: true },
    actualValue: { type: Number, default: 0 },
    achievementPercent: { type: Number, default: 0 },
    variance: { type: Number, default: 0 },
  },
  { timestamps: true }
);

KpiTargetSchema.index({ organizationId: 1, kpiCode: 1 }, { unique: true });

export const KpiTarget = model<IKpiTarget>('KpiTarget', KpiTargetSchema);
