import { Schema, model, Document } from 'mongoose';

export type RoleAction = 'CREATE' | 'READ' | 'UPDATE' | 'DELETE' | 'APPROVE' | 'EXPORT';

export interface IRolePermission {
  module: string;
  actions: RoleAction[];
}

export interface IRole extends Document {
  roleName: string;
  slug: string;
  description?: string;
  permissions: IRolePermission[];
  isSystemRole: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const RoleSchema = new Schema<IRole>(
  {
    roleName: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
    },
    permissions: [
      {
        module: { type: String, required: true },
        actions: [
          {
            type: String,
            enum: ['CREATE', 'READ', 'UPDATE', 'DELETE', 'APPROVE', 'EXPORT'],
            required: true,
          },
        ],
      },
    ],
    isSystemRole: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Explicit canonical index declaration per Database-Schema.md §1.2
RoleSchema.index({ slug: 1 }, { unique: true });

export const RoleModel = model<IRole>('Role', RoleSchema, 'roles');
export default RoleModel;
