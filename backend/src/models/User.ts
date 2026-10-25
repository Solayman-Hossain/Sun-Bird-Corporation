import { Schema, model, Document, Types } from 'mongoose';

export type UserType =
  | 'CUSTOMER'
  | 'STAFF'
  | 'DIRECTOR'
  | 'SUPER_ADMIN'
  | 'VENDOR'
  | 'RESELLER';

export interface IUser extends Document {
  _id: Types.ObjectId;
  fullName: string;
  email: string;
  mobile: string;
  passwordHash?: string;
  totpSecret?: string;
  userType: UserType;
  roleId?: Types.ObjectId;
  branchId?: Types.ObjectId;
  warehouseId?: Types.ObjectId;
  isActive: boolean;
  lastLoginAt?: Date;
  hardwareFingerprint?: string;
  createdAt: Date;
  updatedAt: Date;
}

export const UserSchema = new Schema<IUser>(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    mobile: {
      type: String,
      required: true,
      trim: true,
    },
    passwordHash: {
      type: String,
    },
    totpSecret: {
      type: String,
    },
    userType: {
      type: String,
      enum: ['CUSTOMER', 'STAFF', 'DIRECTOR', 'SUPER_ADMIN', 'VENDOR', 'RESELLER'],
      required: true,
    },
    roleId: {
      type: Schema.Types.ObjectId,
      ref: 'Role',
    },
    branchId: {
      type: Schema.Types.ObjectId,
      ref: 'Warehouse',
    },
    warehouseId: {
      type: Schema.Types.ObjectId,
      ref: 'Warehouse',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLoginAt: {
      type: Date,
    },
    hardwareFingerprint: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Explicit canonical index declarations per Database-Schema.md §1.1 & S-05
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ mobile: 1 }, { unique: true });
UserSchema.index({ userType: 1, isActive: 1 });

export const UserModel = model<IUser>('User', UserSchema, 'users');
export default UserModel;
