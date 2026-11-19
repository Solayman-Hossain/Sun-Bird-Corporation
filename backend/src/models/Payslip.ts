import { Schema, model, Document, Types } from 'mongoose';

export interface IPayslipAllowance {
  name: string;
  amount: number;
}

export interface IPayslipDeduction {
  name: string;
  amount: number;
}

export interface IPayslip extends Document {
  _id: Types.ObjectId;
  payslipNo: string;
  payrollBatchId: Types.ObjectId;
  employeeId: Types.ObjectId;
  monthYear: string;
  basicSalary: number;
  allowances: IPayslipAllowance[];
  deductions: IPayslipDeduction[];
  overtimeHours: number;
  overtimeAmount: number;
  bonus: number;
  loanDeduction: number;
  advanceDeduction: number;
  latePenalty: number;
  lwpDeduction: number;
  grossEarnings: number;
  totalDeductions: number;
  netSalary: number;
  paymentStatus: 'UNPAID' | 'PAID';
  paymentDate?: Date;
  paymentReference?: string;
  organizationId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export const PayslipSchema = new Schema<IPayslip>(
  {
    payslipNo: {
      type: String,
      required: [true, 'Payslip number is required'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    payrollBatchId: {
      type: Schema.Types.ObjectId,
      ref: 'PayrollBatch',
      required: [true, 'Payroll batch reference is required'],
    },
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: 'EmployeeProfile',
      required: [true, 'Employee reference is required'],
    },
    monthYear: {
      type: String,
      required: [true, 'Month-Year is required'],
    },
    basicSalary: {
      type: Number,
      required: true,
      min: 0,
    },
    allowances: [
      {
        name: { type: String, required: true },
        amount: { type: Number, required: true, min: 0 },
      },
    ],
    deductions: [
      {
        name: { type: String, required: true },
        amount: { type: Number, required: true, min: 0 },
      },
    ],
    overtimeHours: {
      type: Number,
      default: 0,
      min: 0,
    },
    overtimeAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    bonus: {
      type: Number,
      default: 0,
      min: 0,
    },
    loanDeduction: {
      type: Number,
      default: 0,
      min: 0,
    },
    advanceDeduction: {
      type: Number,
      default: 0,
      min: 0,
    },
    latePenalty: {
      type: Number,
      default: 0,
      min: 0,
    },
    lwpDeduction: {
      type: Number,
      default: 0,
      min: 0,
    },
    grossEarnings: {
      type: Number,
      required: true,
      min: 0,
    },
    totalDeductions: {
      type: Number,
      required: true,
      min: 0,
    },
    netSalary: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentStatus: {
      type: String,
      enum: ['UNPAID', 'PAID'],
      default: 'UNPAID',
    },
    paymentDate: {
      type: Date,
    },
    paymentReference: {
      type: String,
      trim: true,
    },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
    },
  },
  {
    timestamps: true,
  }
);

PayslipSchema.index({ monthYear: 1, employeeId: 1 }, { unique: true });
PayslipSchema.index({ payrollBatchId: 1 });
PayslipSchema.index({ paymentStatus: 1 });

export const PayslipModel = model<IPayslip>('Payslip', PayslipSchema);
