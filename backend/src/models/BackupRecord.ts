import { Schema, model, Document, Types } from 'mongoose';

export type BackupStatus = 'COMPLETED' | 'IN_PROGRESS' | 'FAILED';
export type BackupDestination = 'LOCAL' | 'S3' | 'ATLAS';
export type BackupType = 'AUTOMATED' | 'MANUAL';

export interface IBackupRecord extends Document {
  backupId: string;
  backupType: BackupType;
  status: BackupStatus;
  sizeBytes: number;
  destination: BackupDestination;
  fileName: string;
  checksum?: string;
  collectionsCount: number;
  documentCount: number;
  retentionDays: number;
  errorDetails?: string;
  triggeredBy?: Types.ObjectId;
  verifiedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export const BackupRecordSchema = new Schema<IBackupRecord>(
  {
    backupId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    backupType: {
      type: String,
      enum: ['AUTOMATED', 'MANUAL'],
      default: 'MANUAL',
    },
    status: {
      type: String,
      enum: ['COMPLETED', 'IN_PROGRESS', 'FAILED'],
      default: 'IN_PROGRESS',
      index: true,
    },
    sizeBytes: {
      type: Number,
      default: 0,
    },
    destination: {
      type: String,
      enum: ['LOCAL', 'S3', 'ATLAS'],
      default: 'LOCAL',
    },
    fileName: {
      type: String,
      required: true,
    },
    checksum: {
      type: String,
    },
    collectionsCount: {
      type: Number,
      default: 0,
    },
    documentCount: {
      type: Number,
      default: 0,
    },
    retentionDays: {
      type: Number,
      default: 30,
    },
    errorDetails: {
      type: String,
    },
    triggeredBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    verifiedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

export const BackupRecord = model<IBackupRecord>('BackupRecord', BackupRecordSchema);
