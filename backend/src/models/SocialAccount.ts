import mongoose, { Document, Schema, Types } from 'mongoose';

export type SocialPlatform = 'FACEBOOK' | 'INSTAGRAM' | 'YOUTUBE' | 'LINKEDIN' | 'TIKTOK' | 'X_TWITTER' | 'PINTEREST';

export interface ISocialAccount extends Document {
  organizationId: Types.ObjectId;
  platform: SocialPlatform;
  accountName: string;
  accountHandle?: string;
  externalAccountId?: string;
  pageId?: string;
  profileUrl?: string;
  avatarUrl?: string;
  isConnected: boolean;
  connectedAt?: Date;
  connectedBy: Types.ObjectId;
  lastSyncedAt?: Date;
  tokenExpiresAt?: Date;
  status: 'ACTIVE' | 'DISCONNECTED' | 'ERROR' | 'EXPIRED';
  metrics: {
    followersCount: number;
    postsCount: number;
    engagementRate: number;
  };
  permissionsGranted: string[];
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SocialAccountSchema = new Schema<ISocialAccount>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    platform: {
      type: String,
      required: true,
      enum: ['FACEBOOK', 'INSTAGRAM', 'YOUTUBE', 'LINKEDIN', 'TIKTOK', 'X_TWITTER', 'PINTEREST'],
      index: true,
    },
    accountName: { type: String, required: true, trim: true },
    accountHandle: { type: String, trim: true },
    externalAccountId: { type: String },
    pageId: { type: String },
    profileUrl: { type: String },
    avatarUrl: { type: String },
    isConnected: { type: Boolean, default: false, index: true },
    connectedAt: { type: Date },
    connectedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    lastSyncedAt: { type: Date },
    tokenExpiresAt: { type: Date },
    status: {
      type: String,
      enum: ['ACTIVE', 'DISCONNECTED', 'ERROR', 'EXPIRED'],
      default: 'DISCONNECTED',
      index: true,
    },
    metrics: {
      followersCount: { type: Number, default: 0 },
      postsCount: { type: Number, default: 0 },
      engagementRate: { type: Number, default: 0 },
    },
    permissionsGranted: [{ type: String }],
    errorMessage: { type: String },
  },
  { timestamps: true }
);

export const SocialAccountModel = mongoose.model<ISocialAccount>('SocialAccount', SocialAccountSchema);
export default SocialAccountModel;
