import { Schema, model, Document, Types } from 'mongoose';

export interface IBannedNid extends Document {
  _id: Types.ObjectId;
  /** SHA-256 cryptographic hash of the blacklisted NID */
  nidHash: string;
  /** Reason for blacklisting/banning this NID */
  reason: string;
  /** Admin user who issued the ban */
  bannedBy: Types.ObjectId;
  /** Date and time when the ban was issued */
  bannedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export const BannedNidSchema = new Schema<IBannedNid>(
  {
    nidHash: {
      type: String,
      required: true,
      trim: true,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    bannedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    bannedAt: {
      type: Date,
      default: Date.now,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Canonical explicit index: { nidHash: 1 } unique
BannedNidSchema.index({ nidHash: 1 }, { unique: true });

export const BannedNidModel = model<IBannedNid>('BannedNid', BannedNidSchema, 'banned_nids');
export default BannedNidModel;
