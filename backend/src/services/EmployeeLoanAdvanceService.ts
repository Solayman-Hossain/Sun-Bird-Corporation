import { Types } from 'mongoose';
import {
  EmployeeAdvanceModel,
  IEmployeeAdvance,
  ExpenseReimbursementModel,
  IExpenseReimbursement,
  LoanModel,
  ILoan,
  EmployeeProfileModel,
  CounterModel,
} from '../models';
import { AccountingService } from './AccountingService';
import { AuditLogService } from './AuditLogService';
import logger from '../config/logger';
import { NotFoundError, ValidationError } from '../errors/AppError';

export interface RequestAdvanceDTO {
  employeeId: string | Types.ObjectId;
  amount: number;
  purpose: string;
  repaymentMonth: string; // YYYY-MM
  organizationId?: string | Types.ObjectId;
}

export interface SubmitExpenseClaimDTO {
  employeeId: string | Types.ObjectId;
  expenseDate: Date | string;
  category:
    | 'TRAVEL'
    | 'FOOD'
    | 'ACCOMMODATION'
    | 'CLIENT_ENTERTAINMENT'
    | 'OFFICE_SUPPLIES'
    | 'MEDICAL'
    | 'OTHER';
  amount: number;
  description: string;
  receiptUrl?: string;
  organizationId?: string | Types.ObjectId;
}

export class EmployeeLoanAdvanceService {
  // ── Employee Salary Advances ──
  public static async requestAdvance(data: RequestAdvanceDTO): Promise<IEmployeeAdvance> {
    const employee = await EmployeeProfileModel.findById(data.employeeId);
    if (!employee) throw new NotFoundError('Employee not found');

    const counter = await CounterModel.findByIdAndUpdate(
      `EMP_ADV_${data.repaymentMonth}`,
      { $inc: { seq: 1 } },
      { upsert: true, new: true }
    );
    const advanceCode = `ADV-${data.repaymentMonth.replace('-', '')}-${String(counter.seq).padStart(3, '0')}`;

    const advance = new EmployeeAdvanceModel({
      ...data,
      advanceCode,
      status: 'PENDING',
    });

    return await advance.save();
  }

  public static async approveAdvance(
    advanceId: string | Types.ObjectId,
    approvedBy: string | Types.ObjectId
  ): Promise<IEmployeeAdvance> {
    const advance = await EmployeeAdvanceModel.findById(advanceId);
    if (!advance) throw new NotFoundError('Advance request not found');

    advance.status = 'APPROVED';
    advance.approvedBy = new Types.ObjectId(approvedBy);
    return await advance.save();
  }

  public static async disburseAdvance(
    advanceId: string | Types.ObjectId,
    actorId?: string | Types.ObjectId
  ): Promise<IEmployeeAdvance> {
    const advance = await EmployeeAdvanceModel.findById(advanceId);
    if (!advance) throw new NotFoundError('Advance request not found');

    if (advance.status !== 'APPROVED') {
      throw new ValidationError(`Advance must be APPROVED before disbursement`);
    }

    advance.status = 'DISBURSED';
    advance.disbursedAt = new Date();

    // Accounting Journal Entry: Debit 1420 (Employee Advance / Loan Recoveries), Credit 1010 (Bank/Cash)
    const result = await AccountingService.createJournalVoucher(
      {
        voucherType: 'PAYMENT',
        sourceDocumentRef: advance.advanceCode,
        notes: `Disbursement of Salary Advance ${advance.advanceCode}`,
        lines: [
          {
            accountCode: 1420,
            debit: advance.amount,
            credit: 0,
            description: `Salary Advance Disbursed to Employee`,
          },
          {
            accountCode: 1010,
            debit: 0,
            credit: advance.amount,
            description: `Cash/Bank payout for Salary Advance`,
          },
        ],
      },
      actorId ? String(actorId) : '000000000000000000000001'
    );

    advance.journalRef = result.journalEntry.voucherNo;
    return await advance.save();
  }

  public static async getAdvances(filter: {
    employeeId?: string | Types.ObjectId;
    repaymentMonth?: string;
    status?: string;
    organizationId?: string | Types.ObjectId;
  }): Promise<IEmployeeAdvance[]> {
    const query: any = {};
    if (filter.employeeId) query.employeeId = filter.employeeId;
    if (filter.repaymentMonth) query.repaymentMonth = filter.repaymentMonth;
    if (filter.status) query.status = filter.status;
    if (filter.organizationId) query.organizationId = filter.organizationId;

    return await EmployeeAdvanceModel.find(query)
      .populate('employeeId', 'employeeCode department designation personalInfo')
      .sort({ createdAt: -1 })
      .lean() as any;
  }

  // ── Employee Loans (Reusing LoanModel) ──
  public static async getEmployeeLoans(organizationId?: string | Types.ObjectId): Promise<ILoan[]> {
    const query: any = { borrowerType: 'EMPLOYEE' };
    return await LoanModel.find(query)
      .populate('borrowerId', 'employeeCode department designation personalInfo')
      .sort({ createdAt: -1 })
      .lean() as any;
  }

  public static async createEmployeeLoan(data: {
    employeeId: string | Types.ObjectId;
    principalBDT: number;
    tenureMonths: number;
    interestRate?: number;
    isInterestFree?: boolean;
    startDate?: Date;
    actorId?: string | Types.ObjectId;
  }): Promise<ILoan> {
    const employee = await EmployeeProfileModel.findById(data.employeeId);
    if (!employee) throw new NotFoundError('Employee not found');

    const counter = await CounterModel.findByIdAndUpdate(
      'EMP_LOAN_COUNTER',
      { $inc: { seq: 1 } },
      { upsert: true, new: true }
    );
    const loanCode = `LN-EMP-${String(counter.seq).padStart(4, '0')}`;

    const monthlyPrincipal = Math.round(data.principalBDT / data.tenureMonths);
    const schedule = [];
    const start = data.startDate || new Date();

    for (let i = 1; i <= data.tenureMonths; i++) {
      const due = new Date(start);
      due.setMonth(due.getMonth() + i);
      schedule.push({
        dueDate: due,
        principalDue: monthlyPrincipal,
        interestDue: 0,
        totalDue: monthlyPrincipal,
        isPaid: false,
      });
    }

    const loan = new LoanModel({
      loanCode,
      loanType: 'EMPLOYEE_LOAN',
      borrowerId: data.employeeId,
      borrowerType: 'EMPLOYEE',
      principalBDT: data.principalBDT,
      isInterestFree: data.isInterestFree ?? true,
      interestRate: data.interestRate || 0,
      interestMethod: 'FLAT',
      startDate: start,
      tenureMonths: data.tenureMonths,
      outstandingBalance: data.principalBDT,
      repaymentSchedule: schedule,
      status: 'ACTIVE',
      approvedBy: data.actorId,
    });

    const saved = await loan.save();

    // Update employee profile loanOutstanding
    await EmployeeProfileModel.findByIdAndUpdate(data.employeeId, {
      $inc: { loanOutstanding: data.principalBDT },
    });

    return saved;
  }

  // ── Expense Claims & Reimbursements ──
  public static async submitExpenseClaim(data: SubmitExpenseClaimDTO): Promise<IExpenseReimbursement> {
    const employee = await EmployeeProfileModel.findById(data.employeeId);
    if (!employee) throw new NotFoundError('Employee not found');

    const counter = await CounterModel.findByIdAndUpdate(
      'EXP_CLAIM_COUNTER',
      { $inc: { seq: 1 } },
      { upsert: true, new: true }
    );
    const claimCode = `EXP-${new Date().getFullYear()}-${String(counter.seq).padStart(4, '0')}`;

    const claim = new ExpenseReimbursementModel({
      ...data,
      claimCode,
      status: 'SUBMITTED',
    });

    return await claim.save();
  }

  public static async approveExpenseClaim(
    claimId: string | Types.ObjectId,
    approvedBy: string | Types.ObjectId
  ): Promise<IExpenseReimbursement> {
    const claim = await ExpenseReimbursementModel.findById(claimId);
    if (!claim) throw new NotFoundError('Claim not found');

    claim.status = 'APPROVED';
    claim.approvedBy = new Types.ObjectId(approvedBy);
    return await claim.save();
  }

  public static async settleExpenseClaim(
    claimId: string | Types.ObjectId,
    actorId?: string | Types.ObjectId
  ): Promise<IExpenseReimbursement> {
    const claim = await ExpenseReimbursementModel.findById(claimId);
    if (!claim) throw new NotFoundError('Claim not found');

    if (claim.status !== 'APPROVED') {
      throw new ValidationError('Claim must be approved before settlement');
    }

    claim.status = 'SETTLED';
    claim.settledAt = new Date();

    // Accounting Journal Entry: Debit 6110 (Office / General Expense), Credit 1010 (Bank/Cash)
    const result = await AccountingService.createJournalVoucher(
      {
        voucherType: 'PAYMENT',
        sourceDocumentRef: claim.claimCode,
        notes: `Settlement of Expense Claim ${claim.claimCode} (${claim.category})`,
        lines: [
          {
            accountCode: 6110,
            debit: claim.amount,
            credit: 0,
            description: `Employee Expense Reimbursement - ${claim.description}`,
          },
          {
            accountCode: 1010,
            debit: 0,
            credit: claim.amount,
            description: `Disbursed for Reimbursement ${claim.claimCode}`,
          },
        ],
      },
      actorId ? String(actorId) : '000000000000000000000001'
    );

    claim.journalRef = result.journalEntry.voucherNo;
    return await claim.save();
  }

  public static async getExpenseClaims(filter: {
    employeeId?: string | Types.ObjectId;
    status?: string;
    organizationId?: string | Types.ObjectId;
  }): Promise<IExpenseReimbursement[]> {
    const query: any = {};
    if (filter.employeeId) query.employeeId = filter.employeeId;
    if (filter.status) query.status = filter.status;
    if (filter.organizationId) query.organizationId = filter.organizationId;

    return await ExpenseReimbursementModel.find(query)
      .populate('employeeId', 'employeeCode department designation personalInfo')
      .sort({ createdAt: -1 })
      .lean() as any;
  }
}
