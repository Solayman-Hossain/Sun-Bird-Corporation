import { Schema, model, Document, Types } from 'mongoose';

export interface IMisSettings extends Document {
  _id: Types.ObjectId;
  organizationId: Types.ObjectId;
  fiscalYearStartMonth: number; // e.g. 7 (July for BD)
  defaultCurrency: string;
  enableDailyDigest: boolean;
  digestDeliveryTime: string;
  digestRecipientEmails: string[];
  riskNotificationThreshold: 'MEDIUM' | 'HIGH' | 'CRITICAL';
  dashboardWidgetLayout: Array<{
    widgetId: string;
    visible: boolean;
    order: number;
    width: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const MisSettingsSchema = new Schema<IMisSettings>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, unique: true },
    fiscalYearStartMonth: { type: Number, default: 7 },
    defaultCurrency: { type: String, default: 'BDT' },
    enableDailyDigest: { type: Boolean, default: true },
    digestDeliveryTime: { type: String, default: '08:00' },
    digestRecipientEmails: [{ type: String, lowercase: true, trim: true }],
    riskNotificationThreshold: { type: String, enum: ['MEDIUM', 'HIGH', 'CRITICAL'], default: 'HIGH' },
    dashboardWidgetLayout: [
      {
        widgetId: { type: String, required: true },
        visible: { type: Boolean, default: true },
        order: { type: Number, default: 0 },
        width: { type: String, default: '1/2' },
      },
    ],
  },
  { timestamps: true }
);

export const MisSettings = model<IMisSettings>('MisSettings', MisSettingsSchema);
