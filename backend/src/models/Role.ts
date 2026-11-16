import { Schema, model, Document, Types } from 'mongoose';

export type RoleAction =
  | 'VIEW'
  | 'CREATE'
  | 'READ'
  | 'UPDATE'
  | 'DELETE'
  | 'APPROVE'
  | 'REJECT'
  | 'EXPORT'
  | 'PRINT'
  | 'FINALIZE'
  | 'CANCEL'
  | 'MANAGE_SETTINGS'
  | string;

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
  assignedOrganizations?: Types.ObjectId[];
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
    assignedOrganizations: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Organization',
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Explicit canonical index declaration per Database-Schema.md §1.2
RoleSchema.index({ slug: 1 }, { unique: true });

export const RoleModel = model<IRole>('Role', RoleSchema, 'roles');
export default RoleModel;
