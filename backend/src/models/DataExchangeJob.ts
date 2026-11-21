import { Schema, model, Document, Types } from 'mongoose';

export type DataExchangeType = 'IMPORT' | 'EXPORT';
export type DataExchangeStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
export type DataExchangeFormat = 'CSV' | 'JSON' | 'XLSX';
export type DataExchangeEntity =
  | 'PRODUCT'
  | 'CUSTOMER'
  | 'INVENTORY'
  | 'SALES'
  | 'CHART_OF_ACCOUNTS'
  | 'EMPLOYEE';

export interface IDataExchangeError {
  rowNumber: number;
  field: string;
  reason: string;
}

export interface IDataExchangeJob extends Document {
  jobId: string;
  jobType: DataExchangeType;
  entityType: DataExchangeEntity;
  format: DataExchangeFormat;
  status: DataExchangeStatus;
  fileUrl?: string;
  fileName?: string;
  recordCount: number;
  failedCount: number;
  errorReport?: IDataExchangeError[];
  organizationId: Types.ObjectId;
  requestedBy: Types.ObjectId;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export const DataExchangeJobSchema = new Schema<IDataExchangeJob>(
  {
    jobId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    jobType: {
      type: String,
      enum: ['IMPORT', 'EXPORT'],
      required: true,
      index: true,
    },
    entityType: {
      type: String,
      enum: ['PRODUCT', 'CUSTOMER', 'INVENTORY', 'SALES', 'CHART_OF_ACCOUNTS', 'EMPLOYEE'],
      required: true,
      index: true,
    },
    format: {
      type: String,
      enum: ['CSV', 'JSON', 'XLSX'],
      default: 'CSV',
    },
    status: {
      type: String,
      enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'],
      default: 'PENDING',
      index: true,
    },
    fileUrl: {
      type: String,
    },
    fileName: {
      type: String,
    },
    recordCount: {
      type: Number,
      default: 0,
    },
    failedCount: {
      type: Number,
      default: 0,
    },
    errorReport: [
      {
        rowNumber: { type: Number },
        field: { type: String },
        reason: { type: String },
      },
    ],
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    requestedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    completedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

export const DataExchangeJob = model<IDataExchangeJob>('DataExchangeJob', DataExchangeJobSchema);
