import { Schema, model, Document, Types } from 'mongoose';

export interface ICustomReportTemplate extends Document {
  _id: Types.ObjectId;
  organizationId: Types.ObjectId;
  name: string;
  code: string; // e.g. RPT-SALES-MONTHLY
  module: 'EXECUTIVE' | 'SALES' | 'FINANCE' | 'INVENTORY' | 'PROCUREMENT' | 'IMPORT' | 'HR' | 'SUPPORT';
  dataSource: string;
  selectedFields: string[];
  filters: Record<string, any>;
  groupBy?: string;
  sortBy?: string;
  sortOrder: 'ASC' | 'DESC';
  chartType: 'TABLE' | 'BAR' | 'LINE' | 'PIE' | 'METRIC';
  isScheduled: boolean;
  scheduleFrequency?: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY';
  recipientEmails: string[];
  createdBy?: Types.ObjectId;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CustomReportTemplateSchema = new Schema<ICustomReportTemplate>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, uppercase: true, trim: true },
    module: {
      type: String,
      enum: ['EXECUTIVE', 'SALES', 'FINANCE', 'INVENTORY', 'PROCUREMENT', 'IMPORT', 'HR', 'SUPPORT'],
      default: 'EXECUTIVE',
    },
    dataSource: { type: String, required: true },
    selectedFields: [{ type: String }],
    filters: { type: Schema.Types.Mixed, default: {} },
    groupBy: { type: String },
    sortBy: { type: String },
    sortOrder: { type: String, enum: ['ASC', 'DESC'], default: 'DESC' },
    chartType: { type: String, enum: ['TABLE', 'BAR', 'LINE', 'PIE', 'METRIC'], default: 'TABLE' },
    isScheduled: { type: Boolean, default: false },
    scheduleFrequency: { type: String, enum: ['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY'] },
    recipientEmails: [{ type: String, lowercase: true, trim: true }],
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    isPublic: { type: Boolean, default: true },
  },
  { timestamps: true }
);

CustomReportTemplateSchema.index({ organizationId: 1, code: 1 }, { unique: true });

export const CustomReportTemplate = model<ICustomReportTemplate>('CustomReportTemplate', CustomReportTemplateSchema);
