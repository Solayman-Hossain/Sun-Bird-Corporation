import { Schema, model, Document, Types, CallbackError } from 'mongoose';

export type LoanType =
  | 'BANK_LOAN'
  | 'PARTNER_DIRECTOR_LOAN'
  | 'SUPPLIER_CREDIT'
  | 'EMPLOYEE_LOAN'
  | 'CUSTOMER_ADVANCE';

export type BorrowerType = 'EMPLOYEE' | 'PARTNER' | 'CUSTOMER' | 'COMPANY';

export type LoanStatus = 'ACTIVE' | 'CLOSED' | 'OVERDUE' | 'WRITTEN_OFF';

export type InterestMethod = 'FLAT' | 'REDUCING_BALANCE';

export interface IRepaymentScheduleItem {
  dueDate: Date;
  principalDue: number;
  interestDue: number;
  totalDue: number;
  paidAt?: Date;
  isPaid: boolean;
}

export interface ILoan extends Document {
  _id: Types.ObjectId;
  loanCode: string;
  loanType: LoanType;
  borrowerId: Types.ObjectId;
  borrowerType: BorrowerType;
  lenderId?: string;
  principalBDT: number;
  isInterestFree: boolean;
  interestRate: number;
  interestMethod: InterestMethod;
  startDate: Date;
  tenureMonths: number;
  outstandingBalance: number;
  repaymentSchedule: IRepaymentScheduleItem[];
  status: LoanStatus;
  contractDocUrl?: string;
  approvedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export const RepaymentScheduleSchema = new Schema<IRepaymentScheduleItem>(
  {
    dueDate: { type: Date, required: true },
    principalDue: { type: Number, required: true, min: 0 },
    interestDue: { type: Number, default: 0, min: 0 },
    totalDue: { type: Number, required: true, min: 0 },
    paidAt: { type: Date },
    isPaid: { type: Boolean, default: false },
  },
  { _id: false }
);

export const LoanSchema = new Schema<ILoan>(
  {
    loanCode: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    loanType: {
      type: String,
      enum: [
        'BANK_LOAN',
        'PARTNER_DIRECTOR_LOAN',
        'SUPPLIER_CREDIT',
        'EMPLOYEE_LOAN',
        'CUSTOMER_ADVANCE',
      ],
      required: true,
    },
    borrowerId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    borrowerType: {
      type: String,
      enum: ['EMPLOYEE', 'PARTNER', 'CUSTOMER', 'COMPANY'],
      required: true,
    },
    lenderId: {
      type: String,
      trim: true,
    },
    principalBDT: {
      type: Number,
      required: true,
      min: 0,
    },
    isInterestFree: {
      type: Boolean,
      required: true,
      default: false,
    },
    interestRate: {
      type: Number,
      default: 0,
      min: 0,
    },
    interestMethod: {
      type: String,
      enum: ['FLAT', 'REDUCING_BALANCE'],
      default: 'REDUCING_BALANCE',
    },
    startDate: {
      type: Date,
      required: true,
    },
    tenureMonths: {
      type: Number,
      required: true,
      min: 1,
    },
    outstandingBalance: {
      type: Number,
      required: true,
      min: 0,
    },
    repaymentSchedule: {
      type: [RepaymentScheduleSchema],
      default: [],
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'CLOSED', 'OVERDUE', 'WRITTEN_OFF'],
      default: 'ACTIVE',
      required: true,
    },
    contractDocUrl: {
      type: String,
      trim: true,
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

// Rule 5: Interest-Free Loan Must Not Accrue Interest (PRD §7.15 & Database.md §5.2)
LoanSchema.pre('save', function (this: ILoan, next: (err?: CallbackError) => void) {
  if (this.isInterestFree && this.interestRate > 0) {
    return next(new Error('Interest-free loan must have interestRate = 0. No accrual permitted.'));
  }
  next();
});

// Explicit Indexes per Database-Schema.md §5.4 & prompt.md §31.4
LoanSchema.index({ loanCode: 1 }, { unique: true });
LoanSchema.index({ loanType: 1, status: 1 });
LoanSchema.index({ borrowerId: 1, loanType: 1 });
LoanSchema.index({ status: 1 });

export const LoanModel = model<ILoan>('Loan', LoanSchema);
export default LoanModel;
