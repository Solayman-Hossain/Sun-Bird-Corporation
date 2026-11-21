import { Schema, model, Document, Types } from 'mongoose';

export type ImportRiskCategory =
  | 'LC_EXPIRY'
  | 'SHIPMENT_DELAY'
  | 'SUPPLIER_RISK'
  | 'BANK_DOC_RISK'
  | 'PAYMENT_MATURITY'
  | 'FX_RISK'
  | 'LANDED_COST_INCREASE'
  | 'CUSTOMS_CLEARANCE'
  | 'DOC_MISMATCH'
  | 'MISSING_DOC'
  | 'DEMURRAGE_RISK'
  | 'COMPLIANCE_RISK';

export type ImportRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface IImportRiskAlert extends Document {
  _id: Types.ObjectId;
  organizationId: Types.ObjectId;
  riskCategory: ImportRiskCategory;
  riskLevel: ImportRiskLevel;
  title: string;
  explanation: string;
  lcId?: Types.ObjectId;
  lcNumber?: string;
  shipmentId?: Types.ObjectId;
  shipmentReference?: string;
  supportingData: Record<string, any>;
  recommendedAction: string;
  responsibleRole?: string;
  status: 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED' | 'DISMISSED';
  dismissedBy?: Types.ObjectId;
  dismissedReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export const ImportRiskAlertSchema = new Schema<IImportRiskAlert>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    riskCategory: {
      type: String,
      required: true,
      enum: [
        'LC_EXPIRY',
        'SHIPMENT_DELAY',
        'SUPPLIER_RISK',
        'BANK_DOC_RISK',
        'PAYMENT_MATURITY',
        'FX_RISK',
        'LANDED_COST_INCREASE',
        'CUSTOMS_CLEARANCE',
        'DOC_MISMATCH',
        'MISSING_DOC',
        'DEMURRAGE_RISK',
        'COMPLIANCE_RISK',
      ],
      index: true,
    },
    riskLevel: {
      type: String,
      required: true,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      default: 'MEDIUM',
      index: true,
    },
    title: { type: String, required: true, trim: true },
    explanation: { type: String, required: true, trim: true },
    lcId: { type: Schema.Types.ObjectId, ref: 'ImportLC', index: true },
    lcNumber: { type: String, trim: true, uppercase: true },
    shipmentId: { type: Schema.Types.ObjectId, ref: 'ImportShipment', index: true },
    shipmentReference: { type: String, trim: true, uppercase: true },
    supportingData: { type: Schema.Types.Mixed, default: {} },
    recommendedAction: { type: String, required: true, trim: true },
    responsibleRole: { type: String, trim: true, default: 'Procurement Officer' },
    status: {
      type: String,
      enum: ['ACTIVE', 'ACKNOWLEDGED', 'RESOLVED', 'DISMISSED'],
      default: 'ACTIVE',
      index: true,
    },
    dismissedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    dismissedReason: { type: String, trim: true },
  },
  { timestamps: true }
);

ImportRiskAlertSchema.index({ organizationId: 1, status: 1 });

export const ImportRiskAlertModel = model<IImportRiskAlert>('ImportRiskAlert', ImportRiskAlertSchema);
