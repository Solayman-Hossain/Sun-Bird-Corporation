import { Schema, model, Document, Types } from 'mongoose';

export type PayrollRunStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'POSTED' | 'CANCELLED';

export interface IPayrollRun extends Document {
  _id: Types.ObjectId;
  payrollRunCode: string;
  monthYear: string; // "YYYY-MM"
  employeeId: Types.ObjectId;
  grossSalary: number;
  commissionAddition: number;
  lwpDeduction: number;
  lateDeduction: number;
  loanDeduction: number;
  netPay: number;
  status: PayrollRunStatus;
  journalRef?: string;
  processedAt?: Date;
  approvedBy?: Types.ObjectId;
  idempotencyKey?: string;
  createdAt: Date;
  updatedAt: Date;
}

export const PayrollRunSchema = new Schema<IPayrollRun>(
  {
    payrollRunCode: {
      type: String,
      required: [true, 'Payroll run code is required'],
      trim: true,
      uppercase: true,
    },
    monthYear: {
      type: String,
      required: [true, 'Month-Year string (YYYY-MM) is required'],
      trim: true,
      match: [/^\d{4}-\d{2}$/, 'Month-Year must follow YYYY-MM format'],
    },
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: 'EmployeeProfile',
      required: [true, 'Employee reference is required for payroll run'],
    },
    grossSalary: {
      type: Number,
      required: [true, 'Gross salary is required'],
      min: [0, 'Gross salary cannot be negative'],
    },
    commissionAddition: {
      type: Number,
      default: 0,
      min: [0, 'Commission addition cannot be negative'],
    },
    lwpDeduction: {
      type: Number,
      default: 0,
      min: [0, 'LWP deduction cannot be negative'],
    },
    lateDeduction: {
      type: Number,
      default: 0,
      min: [0, 'Late deduction cannot be negative'],
    },
    loanDeduction: {
      type: Number,
      default: 0,
      min: [0, 'Loan deduction cannot be negative'],
    },
    netPay: {
      type: Number,
      required: [true, 'Net pay is required'],
      min: [0, 'Net pay cannot be negative (enforcing minimum wage floor)'],
    },
    status: {
      type: String,
      enum: {
        values: ['DRAFT', 'SUBMITTED', 'APPROVED', 'POSTED', 'CANCELLED'],
        message: 'Invalid payroll run status',
      },
      default: 'DRAFT',
    },
    journalRef: {
      type: String,
      trim: true,
    },
    processedAt: {
      type: Date,
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    idempotencyKey: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-validate hook: compute netPay = grossSalary + commissionAddition - lwpDeduction - lateDeduction - loanDeduction
PayrollRunSchema.pre('validate', function (next) {
  if (this.netPay === undefined || this.netPay === null) {
    const gross = this.grossSalary || 0;
    const comm = this.commissionAddition || 0;
    const lwp = this.lwpDeduction || 0;
    const late = this.lateDeduction || 0;
    const loan = this.loanDeduction || 0;
    const calculated = gross + comm - (lwp + late + loan);
    this.netPay = Math.max(0, Math.round(calculated * 100) / 100);
  }
  next();
});

// Explicit Indexes per Database-Schema.md §6.3 & Prompt 38
PayrollRunSchema.index({ payrollRunCode: 1 }, { unique: true });
PayrollRunSchema.index({ monthYear: 1, employeeId: 1 }, { unique: true });
PayrollRunSchema.index({ status: 1 });
PayrollRunSchema.index({ monthYear: 1, status: 1 });
PayrollRunSchema.index({ employeeId: 1, monthYear: -1 });
PayrollRunSchema.index({ idempotencyKey: 1 }, { unique: true, sparse: true });

export const PayrollRunModel = model<IPayrollRun>('PayrollRun', PayrollRunSchema);
