import { Schema, model, Document, Types } from 'mongoose';

export interface ISupportSettings extends Document {
  _id: Types.ObjectId;
  organizationId: Types.ObjectId;
  businessHours: {
    startTime: string; // "09:00"
    endTime: string;   // "18:00"
    workingDays: string[];
  };
  slaTargets: {
    criticalHours: number;
    highHours: number;
    mediumHours: number;
    lowHours: number;
  };
  returnWindowDays: number;
  allowAutomatedAiDrafts: boolean;
  escalationEmail?: string;
  enableSmsAlerts: boolean;
  warrantyGracePeriodDays: number;
  defaultServiceCenter: string;
  createdAt: Date;
  updatedAt: Date;
}

const SupportSettingsSchema = new Schema<ISupportSettings>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, unique: true },
    businessHours: {
      startTime: { type: String, default: '09:00' },
      endTime: { type: String, default: '18:00' },
      workingDays: {
        type: [String],
        default: ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'],
      },
    },
    slaTargets: {
      criticalHours: { type: Number, default: 4 },
      highHours: { type: Number, default: 12 },
      mediumHours: { type: Number, default: 24 },
      lowHours: { type: Number, default: 48 },
    },
    returnWindowDays: { type: Number, default: 14 },
    allowAutomatedAiDrafts: { type: Boolean, default: true },
    escalationEmail: { type: String, default: 'support@sunbird.com.bd' },
    enableSmsAlerts: { type: Boolean, default: true },
    warrantyGracePeriodDays: { type: Number, default: 7 },
    defaultServiceCenter: { type: String, default: 'Central Service & Repair Lab' },
  },
  {
    timestamps: true,
  }
);

export const SupportSettings = model<ISupportSettings>('SupportSettings', SupportSettingsSchema);
