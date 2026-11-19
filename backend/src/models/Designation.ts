import { Schema, model, Document, Types } from 'mongoose';

export interface IDesignation extends Document {
  _id: Types.ObjectId;
  designationCode: string;
  title: string;
  titleBn?: string;
  departmentId?: Types.ObjectId;
  jobGradeId?: Types.ObjectId;
  reportsToDesignationId?: Types.ObjectId;
  organizationId?: Types.ObjectId;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const DesignationSchema = new Schema<IDesignation>(
  {
    designationCode: {
      type: String,
      required: [true, 'Designation code is required'],
      trim: true,
      uppercase: true,
    },
    title: {
      type: String,
      required: [true, 'Designation title is required'],
      trim: true,
    },
    titleBn: {
      type: String,
      trim: true,
    },
    departmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Department',
    },
    jobGradeId: {
      type: Schema.Types.ObjectId,
      ref: 'JobGrade',
    },
    reportsToDesignationId: {
      type: Schema.Types.ObjectId,
      ref: 'Designation',
    },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
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

DesignationSchema.index({ designationCode: 1 }, { unique: true });
DesignationSchema.index({ organizationId: 1, title: 1 });
DesignationSchema.index({ departmentId: 1 });
DesignationSchema.index({ isActive: 1 });

export const DesignationModel = model<IDesignation>('Designation', DesignationSchema);
