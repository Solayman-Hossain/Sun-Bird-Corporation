import { Schema, model, Document, Types } from 'mongoose';

export interface IJobGrade extends Document {
  _id: Types.ObjectId;
  gradeCode: string;
  gradeName: string;
  minSalary: number;
  maxSalary: number;
  benefits: string[];
  organizationId?: Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const JobGradeSchema = new Schema<IJobGrade>(
  {
    gradeCode: {
      type: String,
      required: [true, 'Grade code is required'],
      trim: true,
      uppercase: true,
    },
    gradeName: {
      type: String,
      required: [true, 'Grade name is required'],
      trim: true,
    },
    minSalary: {
      type: Number,
      required: [true, 'Minimum salary is required'],
      min: 0,
    },
    maxSalary: {
      type: Number,
      required: [true, 'Maximum salary is required'],
      min: 0,
    },
    benefits: {
      type: [String],
      default: [],
    },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
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

JobGradeSchema.index({ gradeCode: 1 }, { unique: true });
JobGradeSchema.index({ organizationId: 1, gradeName: 1 });

export const JobGradeModel = model<IJobGrade>('JobGrade', JobGradeSchema);
