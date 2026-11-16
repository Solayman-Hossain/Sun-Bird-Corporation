import { Schema, model, Document, Types } from 'mongoose';

export interface IAuditLog extends Document {
  _id: Types.ObjectId;
  actorId: Types.ObjectId;
  actorRole: string;
  actorNameSnapshot?: string;
  organizationId?: Types.ObjectId;
  module?: string;
  action: string;
  targetCollection: string;
  targetId: Types.ObjectId;
  entityType?: string;
  entityId?: Types.ObjectId;
  requestId?: string;
  beforeSnapshot?: any;
  afterSnapshot?: any;
  metadata?: any;
  ipAddress?: string;
  userAgent?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export const AuditLogSchema = new Schema<IAuditLog>(
  {
    actorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    actorRole: {
      type: String,
      required: true,
      trim: true,
    },
    actorNameSnapshot: {
      type: String,
      trim: true,
    },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
    },
    module: {
      type: String,
      trim: true,
      uppercase: true,
    },
    action: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    targetCollection: {
      type: String,
      required: true,
      trim: true,
    },
    targetId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    entityType: {
      type: String,
      trim: true,
    },
    entityId: {
      type: Schema.Types.ObjectId,
    },
    requestId: {
      type: String,
      trim: true,
    },
    beforeSnapshot: {
      type: Schema.Types.Mixed,
    },
    afterSnapshot: {
      type: Schema.Types.Mixed,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
    ipAddress: {
      type: String,
      trim: true,
    },
    userAgent: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Explicit Indexes matching Database-Schema.md §7.6 and Prompt 43
AuditLogSchema.index({ targetCollection: 1, targetId: 1 });
AuditLogSchema.index({ actorId: 1 });
AuditLogSchema.index({ organizationId: 1 });
AuditLogSchema.index({ module: 1 });
AuditLogSchema.index({ createdAt: -1 });

// ── Prompt 46 Immutability Guard: Enforce Append-Only Write-Once Audit Trail ───
const blockMutation = function (this: any, next: (err?: Error) => void) {
  const err = new Error(
    'TAMPER_SECURITY_VIOLATION: Audit logs are append-only and strictly immutable. Updates and deletions are forbidden.'
  );
  next(err);
};

// Block document-level deletion
AuditLogSchema.pre(
  'deleteOne',
  { document: true, query: false },
  blockMutation
);

// Block query-level mutations and deletions
AuditLogSchema.pre('updateOne', blockMutation);
AuditLogSchema.pre('updateMany', blockMutation);
AuditLogSchema.pre('deleteOne', { document: false, query: true }, blockMutation);
AuditLogSchema.pre('deleteMany', blockMutation);
AuditLogSchema.pre('findOneAndUpdate', blockMutation);
AuditLogSchema.pre('findOneAndDelete', blockMutation);
AuditLogSchema.pre('findOneAndReplace', blockMutation);

export const AuditLogModel = model<IAuditLog>('AuditLog', AuditLogSchema);
export default AuditLogModel;
