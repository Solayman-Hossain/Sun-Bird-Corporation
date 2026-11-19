import { Schema, model, Document, Types } from 'mongoose';

export interface ISalaryStructureComponent {
  componentId: Types.ObjectId;
  componentName: string;
  type: 'EARNING' | 'DEDUCTION';
  calculationType: 'FIXED' | 'PERCENTAGE';
  amountOrPercent: number;
}

export interface ISalaryStructure extends Document {
  _id: Types.ObjectId;
  structureCode: string;
  name: string;
  description?: string;
  components: ISalaryStructureComponent[];
  organizationId?: Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SalaryStructureComponentSchema = new Schema<ISalaryStructureComponent>(
  {
    componentId: {
      type: Schema.Types.ObjectId,
      ref: 'SalaryComponent',
      required: true,
    },
    componentName: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['EARNING', 'DEDUCTION'],
      required: true,
    },
    calculationType: {
      type: String,
      enum: ['FIXED', 'PERCENTAGE'],
      required: true,
    },
    amountOrPercent: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false }
);

export const SalaryStructureSchema = new Schema<ISalaryStructure>(
  {
    structureCode: {
      type: String,
      required: [true, 'Structure code is required'],
      trim: true,
      uppercase: true,
    },
    name: {
      type: String,
      required: [true, 'Structure name is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    components: {
      type: [SalaryStructureComponentSchema],
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

SalaryStructureSchema.index({ structureCode: 1 }, { unique: true });

export const SalaryStructureModel = model<ISalaryStructure>('SalaryStructure', SalaryStructureSchema);
