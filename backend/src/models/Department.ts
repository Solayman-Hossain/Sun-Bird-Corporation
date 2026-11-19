import { Schema, model, Document, Types } from 'mongoose';

export interface IDepartment extends Document {
  _id: Types.ObjectId;
  departmentCode: string;
  name: string;
  nameBn?: string;
  organizationId?: Types.ObjectId;
  parentDepartmentId?: Types.ObjectId;
  headEmployeeId?: Types.ObjectId;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const DepartmentSchema = new Schema<IDepartment>(
  {
    departmentCode: {
      type: String,
      required: [true, 'Department code is required'],
      trim: true,
      uppercase: true,
    },
    name: {
      type: String,
      required: [true, 'Department name is required'],
      trim: true,
    },
    nameBn: {
      type: String,
      trim: true,
    },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
    },
    parentDepartmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Department',
    },
    headEmployeeId: {
      type: Schema.Types.ObjectId,
      ref: 'EmployeeProfile',
    },
    description: {
      type: String,
      trim: true,
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

DepartmentSchema.index({ departmentCode: 1 }, { unique: true });
DepartmentSchema.index({ organizationId: 1, name: 1 });
DepartmentSchema.index({ isActive: 1 });

export const DepartmentModel = model<IDepartment>('Department', DepartmentSchema);
