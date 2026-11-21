import { Schema, model, Document, Types } from 'mongoose';

export interface ISecurityPolicy extends Document {
  minPasswordLength: number;
  requireSpecialChar: boolean;
  requireNumber: boolean;
  requireUppercase: boolean;
  passwordExpiresDays: number;
  failedLoginLockoutThreshold: number;
  lockoutDurationMinutes: number;
  maxConcurrentSessions: number;
  refreshTokenRotationEnabled: boolean;
  ipWhitelist: string[];
  loginAlertEmailEnabled: boolean;
  suspiciousActivityAlerts: boolean;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export const SecurityPolicySchema = new Schema<ISecurityPolicy>(
  {
    minPasswordLength: {
      type: Number,
      default: 8,
      min: 6,
    },
    requireSpecialChar: {
      type: Boolean,
      default: true,
    },
    requireNumber: {
      type: Boolean,
      default: true,
    },
    requireUppercase: {
      type: Boolean,
      default: true,
    },
    passwordExpiresDays: {
      type: Number,
      default: 90,
    },
    failedLoginLockoutThreshold: {
      type: Number,
      default: 5,
    },
    lockoutDurationMinutes: {
      type: Number,
      default: 30,
    },
    maxConcurrentSessions: {
      type: Number,
      default: 3,
    },
    refreshTokenRotationEnabled: {
      type: Boolean,
      default: true,
    },
    ipWhitelist: {
      type: [String],
      default: [],
    },
    loginAlertEmailEnabled: {
      type: Boolean,
      default: true,
    },
    suspiciousActivityAlerts: {
      type: Boolean,
      default: true,
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

export const SecurityPolicy = model<ISecurityPolicy>('SecurityPolicy', SecurityPolicySchema);
