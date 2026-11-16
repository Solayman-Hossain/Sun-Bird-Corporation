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
  username?: string;
  email: string;
  mobile: string;
  employeeId?: string;
  profileImage?: string;
  department?: string;
  designation?: string;
  passwordHash?: string;
  totpSecret?: string;
  userType: UserType;
  roleId?: Types.ObjectId;
  assignedRoles?: Types.ObjectId[];
  branchId?: Types.ObjectId;
  warehouseId?: Types.ObjectId;
  authorizedOrganizations?: Types.ObjectId[];
  defaultOrganizationId?: Types.ObjectId;
  status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'LOCKED';
  failedLoginAttempts?: number;
  lockoutUntil?: Date;
  passwordExpiresAt?: Date;
  forcePasswordChange?: boolean;
  createdBy?: Types.ObjectId;
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
    username: {
      type: String,
      trim: true,
      sparse: true,
    },
    employeeId: {
      type: String,
      trim: true,
    },
    profileImage: {
      type: String,
      trim: true,
    },
    department: {
      type: String,
      trim: true,
    },
    designation: {
      type: String,
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
    assignedRoles: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Role',
      },
    ],
    branchId: {
      type: Schema.Types.ObjectId,
      ref: 'Warehouse',
    },
    warehouseId: {
      type: Schema.Types.ObjectId,
      ref: 'Warehouse',
    },
    authorizedOrganizations: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Organization',
      },
    ],
    defaultOrganizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED', 'LOCKED'],
      default: 'ACTIVE',
    },
    failedLoginAttempts: {
      type: Number,
      default: 0,
    },
    lockoutUntil: {
      type: Date,
    },
    passwordExpiresAt: {
      type: Date,
    },
    forcePasswordChange: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
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
