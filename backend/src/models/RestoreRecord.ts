import { Schema, model, Document, Types } from 'mongoose';

export type RestoreStatus = 'PENDING_APPROVAL' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';

export interface IRestoreRecord extends Document {
  restoreId: string;
  backupId: string;
  status: RestoreStatus;
  targetEnvironment: string;
  confirmedBy?: Types.ObjectId;
  preRestoreBackupId?: string;
  outcomeNotes?: string;
  durationSeconds?: number;
  executedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export const RestoreRecordSchema = new Schema<IRestoreRecord>(
  {
    restoreId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    backupId: {
      type: String,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['PENDING_APPROVAL', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'FAILED'],
      default: 'PENDING_APPROVAL',
      index: true,
    },
    targetEnvironment: {
      type: String,
      default: 'STAGING',
    },
    confirmedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    preRestoreBackupId: {
      type: String,
    },
    outcomeNotes: {
      type: String,
    },
    durationSeconds: {
      type: Number,
      default: 0,
    },
    executedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

export const RestoreRecord = model<IRestoreRecord>('RestoreRecord', RestoreRecordSchema);
