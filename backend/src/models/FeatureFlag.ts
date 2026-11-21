import { Schema, model, Document, Types } from 'mongoose';

export interface IFeatureFlagChange {
  modifiedBy?: Types.ObjectId;
  modifiedAt: Date;
  isEnabled: boolean;
  notes?: string;
}

export interface IFeatureFlag extends Document {
  flagKey: string;
  displayName: string;
  description?: string;
  isGloballyEnabled: boolean;
  enabledOrganizations: Types.ObjectId[];
  enabledRoles: string[];
  isExperimental: boolean;
  changeHistory: IFeatureFlagChange[];
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export const FeatureFlagSchema = new Schema<IFeatureFlag>(
  {
    flagKey: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    displayName: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    isGloballyEnabled: {
      type: Boolean,
      default: false,
      index: true,
    },
    enabledOrganizations: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Organization',
      },
    ],
    enabledRoles: {
      type: [String],
      default: [],
    },
    isExperimental: {
      type: Boolean,
      default: false,
    },
    changeHistory: [
      {
        modifiedBy: { type: Schema.Types.ObjectId, ref: 'User' },
        modifiedAt: { type: Date, default: Date.now },
        isEnabled: { type: Boolean, required: true },
        notes: { type: String },
      },
    ],
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

export const FeatureFlag = model<IFeatureFlag>('FeatureFlag', FeatureFlagSchema);
