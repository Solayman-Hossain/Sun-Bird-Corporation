import crypto from 'crypto';
import { Schema, model, Document, Types } from 'mongoose';

export type VerificationType =
  | 'SMS_OTP'
  | 'TOTP_MFA'
  | 'CUSTOMER_LOGIN'
  | 'ORDER_COD_OTP'
  | 'PASSWORD_RESET'
  | 'NID_VERIFICATION'
  | 'KYC_IDENTITY';

export type VerificationStatus =
  | 'PENDING'
  | 'SUCCESS'
  | 'FAILED'
  | 'EXPIRED'
  | 'RATE_LIMITED'
  | 'REJECTED';

export type SubjectType =
  | 'CUSTOMER'
  | 'EMPLOYEE'
  | 'PARTNER'
  | 'DIRECTOR'
  | 'VENDOR'
  | 'RESELLER';

export type NidType =
  | 'NID_10'
  | 'NID_13'
  | 'NID_17'
  | 'SMART_CARD'
  | 'LEGACY'
  | 'UNKNOWN';

const NID_SALT = process.env.NID_HASH_SALT || process.env.JWT_SECRET || 'sunbird_corporation_nid_secure_salt_2026';

/**
 * Generates a deterministic SHA-256 salted HMAC hash of the Bangladeshi National ID (NID).
 * The raw NID is never stored in plain text to ensure statutory privacy and data protection.
 */
export function hashNid(nid: string, salt: string = NID_SALT): string {
  if (!nid || typeof nid !== 'string' || nid.trim().length === 0) {
    return crypto.createHmac('sha256', salt).update('EMPTY_NID_PLACEHOLDER').digest('hex');
  }
  return crypto.createHmac('sha256', salt).update(nid.trim()).digest('hex');
}

/**
 * Returns a masked representation of the NID (e.g. *******1234) for safe audit display.
 */
export function maskNid(nid: string): string {
  if (!nid || typeof nid !== 'string') return '****';
  const clean = nid.trim();
  if (clean.length <= 4) return '****';
  const visible = clean.slice(-4);
  return '*'.repeat(clean.length - 4) + visible;
}

export interface IVerificationLog extends Document {
  _id: Types.ObjectId;
  mobile: string;
  /** SHA-256 salted hash of the NID number. Not Unique - same nid may appear across multiple attempts */
  nidHash: string;
  /** Alias supporting user typographical variants */
  nidShah?: string;
  /** Supporting Subject classification: CUSTOMER, EMPLOYEE, PARTNER, DIRECTOR, VENDOR, RESELLER */
  subject: string;
  subjectType: SubjectType;
  subjectId?: Types.ObjectId;
  nidMasked?: string;
  nidType: NidType;
  verificationType: VerificationType;
  status: VerificationStatus;
  purpose: string;
  verificationProvider?: string;
  userId?: Types.ObjectId;
  customerId?: Types.ObjectId;
  ipAddress?: string;
  userAgent?: string;
  attemptsCount: number;
  failureReason?: string;
  metadata?: Record<string, any>;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export const VerificationLogSchema = new Schema<IVerificationLog>(
  {
    mobile: {
      type: String,
      required: true,
      trim: true,
    },
    // SHA-256 salted hash of the NID number. Not Unique - same nid may appear across multiple attempts
    nidHash: {
      type: String,
      required: true,
      trim: true,
      default: function (this: any) {
        if (this.metadata?.nid) {
          return hashNid(String(this.metadata.nid));
        }
        // Deterministic salted hash for tracking mobile identity when NID not explicitly provided
        return hashNid(this.mobile || 'DEFAULT_NID_SALTED_ID');
      },
    },
    // Supporting Subject identification
    subject: {
      type: String,
      required: true,
      trim: true,
      default: 'CUSTOMER',
    },
    subjectType: {
      type: String,
      enum: ['CUSTOMER', 'EMPLOYEE', 'PARTNER', 'DIRECTOR', 'VENDOR', 'RESELLER'],
      default: 'CUSTOMER',
      required: true,
    },
    subjectId: {
      type: Schema.Types.ObjectId,
      refPath: 'subjectType',
    },
    nidMasked: {
      type: String,
      trim: true,
    },
    nidType: {
      type: String,
      enum: ['NID_10', 'NID_13', 'NID_17', 'SMART_CARD', 'LEGACY', 'UNKNOWN'],
      default: 'UNKNOWN',
    },
    verificationType: {
      type: String,
      enum: [
        'SMS_OTP',
        'TOTP_MFA',
        'CUSTOMER_LOGIN',
        'ORDER_COD_OTP',
        'PASSWORD_RESET',
        'NID_VERIFICATION',
        'KYC_IDENTITY',
      ],
      default: 'SMS_OTP',
      required: true,
    },
    status: {
      type: String,
      enum: ['PENDING', 'SUCCESS', 'FAILED', 'EXPIRED', 'RATE_LIMITED', 'REJECTED'],
      required: true,
    },
    purpose: {
      type: String,
      required: true,
      trim: true,
      default: 'LOGIN',
    },
    verificationProvider: {
      type: String,
      trim: true,
      default: 'INTERNAL_GATEWAY',
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    customerId: {
      type: Schema.Types.ObjectId,
      ref: 'Customer',
    },
    ipAddress: {
      type: String,
      trim: true,
    },
    userAgent: {
      type: String,
      trim: true,
    },
    attemptsCount: {
      type: Number,
      default: 1,
      min: 1,
    },
    failureReason: {
      type: String,
      trim: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
    expiresAt: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days retention TTL
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual alias for `nidShah` targeting `nidHash`
VerificationLogSchema.virtual('nidShah')
  .get(function (this: IVerificationLog) {
    return this.nidHash;
  })
  .set(function (this: IVerificationLog, val: string) {
    this.nidHash = val;
  });

// Explicit Canonical Indexes per Database-Schema.md §7.8
// Note: nidHash is NOT unique — same NID may appear across multiple verification attempts
VerificationLogSchema.index({ nidHash: 1 });
VerificationLogSchema.index({ mobile: 1, createdAt: -1 });
VerificationLogSchema.index({ customerId: 1, createdAt: -1 });
VerificationLogSchema.index({ subjectType: 1, subjectId: 1 });
VerificationLogSchema.index({ verificationType: 1, status: 1 });
VerificationLogSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Immutability Guard: Append-only write once for forensic audit integrity
const blockMutation = function (this: any, next: (err?: Error) => void) {
  const err = new Error(
    'TAMPER_SECURITY_VIOLATION: Verification logs are append-only and strictly immutable. Updates and deletions are forbidden.'
  );
  next(err);
};

VerificationLogSchema.pre('deleteOne', { document: true, query: false }, blockMutation);
VerificationLogSchema.pre('updateOne', blockMutation);
VerificationLogSchema.pre('updateMany', blockMutation);
VerificationLogSchema.pre('deleteOne', { document: false, query: true }, blockMutation);
VerificationLogSchema.pre('deleteMany', blockMutation);
VerificationLogSchema.pre('findOneAndUpdate', blockMutation);
VerificationLogSchema.pre('findOneAndDelete', blockMutation);
VerificationLogSchema.pre('findOneAndReplace', blockMutation);

export const VerificationLogModel = model<IVerificationLog>(
  'VerificationLog',
  VerificationLogSchema,
  'verification_logs'
);
export default VerificationLogModel;
