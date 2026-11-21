import { Schema, model, Document, Types } from 'mongoose';

export interface ISystemSettings extends Document {
  appName: string;
  appLogo?: string;
  appDescription?: string;
  defaultLanguage: 'bn' | 'en';
  supportedLanguages: string[];
  defaultTimezone: string;
  dateFormat: string;
  timeFormat: '12h' | '24h';
  numberFormat: 'en-IN' | 'bn-BD';
  currency: {
    code: string;
    symbol: string;
    position: 'PREFIX' | 'SUFFIX';
    decimalPlaces: number;
  };
  fiscalYearStartMonth: number;
  defaultPaginationSize: number;
  sessionTimeoutMinutes: number;
  fileUploadLimits: {
    maxImageSizeBytes: number;
    maxDocSizeBytes: number;
    allowedExtensions: string[];
  };
  maintenanceMode: {
    isEnabled: boolean;
    message: string;
    scheduledStart?: Date;
    scheduledEnd?: Date;
    allowedRoles: string[];
    allowedIps: string[];
  };
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export const SystemSettingsSchema = new Schema<ISystemSettings>(
  {
    appName: {
      type: String,
      required: true,
      default: 'SUN BIRD Corporation Cloud ERP',
      trim: true,
    },
    appLogo: {
      type: String,
      default: '/logo.png',
    },
    appDescription: {
      type: String,
      default: 'Integrated Healthcare & Medical Equipment ERP Platform',
    },
    defaultLanguage: {
      type: String,
      enum: ['bn', 'en'],
      default: 'bn',
    },
    supportedLanguages: {
      type: [String],
      default: ['bn', 'en'],
    },
    defaultTimezone: {
      type: String,
      default: 'Asia/Dhaka',
    },
    dateFormat: {
      type: String,
      default: 'YYYY-MM-DD',
    },
    timeFormat: {
      type: String,
      enum: ['12h', '24h'],
      default: '12h',
    },
    numberFormat: {
      type: String,
      enum: ['en-IN', 'bn-BD'],
      default: 'en-IN',
    },
    currency: {
      code: { type: String, default: 'BDT' },
      symbol: { type: String, default: '৳' },
      position: { type: String, enum: ['PREFIX', 'SUFFIX'], default: 'PREFIX' },
      decimalPlaces: { type: Number, default: 2 },
    },
    fiscalYearStartMonth: {
      type: Number,
      default: 7, // July in Bangladesh
      min: 1,
      max: 12,
    },
    defaultPaginationSize: {
      type: Number,
      default: 25,
    },
    sessionTimeoutMinutes: {
      type: Number,
      default: 60,
    },
    fileUploadLimits: {
      maxImageSizeBytes: { type: Number, default: 5242880 }, // 5 MB
      maxDocSizeBytes: { type: Number, default: 20971520 }, // 20 MB
      allowedExtensions: { type: [String], default: ['.pdf', '.jpg', '.jpeg', '.png', '.xlsx', '.csv'] },
    },
    maintenanceMode: {
      isEnabled: { type: Boolean, default: false },
      message: { type: String, default: 'System is undergoing scheduled maintenance. Please check back shortly.' },
      scheduledStart: { type: Date },
      scheduledEnd: { type: Date },
      allowedRoles: { type: [String], default: ['SUPER_ADMIN'] },
      allowedIps: { type: [String], default: [] },
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

export const SystemSettings = model<ISystemSettings>('SystemSettings', SystemSettingsSchema);
