import { Schema, model, Document, Types } from 'mongoose';

export type IdempotencyResource =
  | 'ORDER'
  | 'PAYMENT'
  | 'PAYROLL'
  | 'LOAN_REPAYMENT'
  | 'GENERAL';

export type IdempotencyStatus = 'PROCESSING' | 'RESOLVED' | 'FAILED';

export interface IResponseSnapshot {
  statusCode: number;
  body: any;
  headers?: Record<string, string>;
}

export interface IIdempotencyKey extends Document {
  key: string;
  resource: IdempotencyResource;
  resourceId?: Types.ObjectId;
  status: IdempotencyStatus;
  responseSnapshot?: IResponseSnapshot;
  requestHash?: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Mongoose Schema for Idempotency Keys matching Database-Schema.md §7.7.
 * Guards mutating operations (Order checkout, Payment webhooks, POS sync, Payroll runs, Loan disbursements)
 * from duplicate execution during retries or concurrent network flights.
 */
export const IdempotencyKeySchema = new Schema<IIdempotencyKey>(
  {
    key: {
      type: String,
      required: true,
      trim: true,
    },
    resource: {
      type: String,
      required: true,
      enum: ['ORDER', 'PAYMENT', 'PAYROLL', 'LOAN_REPAYMENT', 'GENERAL'],
      default: 'GENERAL',
    },
    resourceId: {
      type: Schema.Types.ObjectId,
    },
    status: {
      type: String,
      required: true,
      enum: ['PROCESSING', 'RESOLVED', 'FAILED'],
      default: 'PROCESSING',
    },
    responseSnapshot: {
      statusCode: { type: Number },
      body: { type: Schema.Types.Mixed },
      headers: { type: Schema.Types.Mixed },
    },
    requestHash: {
      type: String,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Explicit Indexes per Database-Schema.md §7.7 (Fix S-05 & S-30)
IdempotencyKeySchema.index({ key: 1 }, { unique: true });
IdempotencyKeySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // MongoDB TTL auto-cleanup

export const IdempotencyKeyModel = model<IIdempotencyKey>(
  'IdempotencyKey',
  IdempotencyKeySchema,
  'idempotency_keys'
);

export default IdempotencyKeyModel;
