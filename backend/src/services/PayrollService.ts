import { ClientSession, Types } from 'mongoose';
import {
  PayrollRunModel,
  IPayrollRun,
  PayrollRunStatus,
} from '../models/PayrollRun';
import { EmployeeProfileModel, IEmployeeProfile } from '../models/EmployeeProfile';
import { OrderModel } from '../models/Order';
import { LoanModel } from '../models/Loan';
import { ChartOfAccountsModel } from '../models/ChartOfAccounts';
import { AttendanceService } from './AttendanceService';
import { AccountingService, CreateVoucherLineDTO } from './AccountingService';
import { LoanService } from './LoanService';
import { CounterService } from './CounterService';
import { ValidationError, NotFoundError } from '../errors/AppError';
import logger from '../config/logger';

export interface ComputePayrollOptions {
  workingDays?: number; // Default 26 days
  idempotencyKeyPrefix?: string;
}

export interface PayrollBatchSummary {
  monthYear: string;
  totalEmployees: number;
  totalGrossSalary: number;
  totalCommissions: number;
  totalLwpDeductions: number;
  totalLateDeductions: number;
  totalLoanDeductions: number;
  totalNetPay: number;
  payrollRuns: IPayrollRun[];
}

export interface PostPayrollGlResult {
  monthYear: string;
  journalVoucherNo: string;
  journalEntryId: Types.ObjectId;
  postedCount: number;
  totalNetPay: number;
  status: PayrollRunStatus;
}

export class PayrollService {
  public static readonly DEFAULT_WORKING_DAYS = 26;
  public static readonly MINIMUM_WAGE_FLOOR = 12500; // Statutory minimum wage floor (BDT 12,500)

  // Standard COA Account Codes per Prompt 41 & Sun Bird Chart of Accounts
  public static readonly ACCT_SALARIES_EXPENSE = 6110;
  public static readonly ACCT_COMMISSIONS_EXPENSE = 6120;
  public static readonly ACCT_SALARIES_PAYABLE = 2100;
  public static readonly ACCT_LOAN_RECOVERIES = 1420;

  /**
   * Helper to ensure required accounting accounts exist in the Chart of Accounts.
   */
  public static async ensurePayrollChartOfAccounts(session?: ClientSession): Promise<void> {
    const requiredAccounts = [
      {
        accountCode: PayrollService.ACCT_SALARIES_EXPENSE,
        accountName: 'Salaries & Allowances Expense',
        accountType: 'EXPENSE' as const,
        normalBalance: 'DEBIT' as const,
        isControl: false,
      },
      {
        accountCode: PayrollService.ACCT_COMMISSIONS_EXPENSE,
        accountName: 'Sales Commissions Expense',
        accountType: 'EXPENSE' as const,
        normalBalance: 'DEBIT' as const,
        isControl: false,
      },
      {
        accountCode: PayrollService.ACCT_SALARIES_PAYABLE,
        accountName: 'Accrued Salaries Payable',
        accountType: 'LIABILITY' as const,
        normalBalance: 'CREDIT' as const,
        isControl: false,
      },
      {
        accountCode: PayrollService.ACCT_LOAN_RECOVERIES,
        accountName: 'Employee Advance / Loan Recoveries',
        accountType: 'ASSET' as const,
        normalBalance: 'CREDIT' as const,
        isControl: false,
      },
    ];

    for (const acc of requiredAccounts) {
      await ChartOfAccountsModel.findOneAndUpdate(
        { accountCode: acc.accountCode },
        { $setOnInsert: { ...acc, isActive: true } },
        { upsert: true, new: true, session: session || null }
      );
    }
  }

  /**
   * Computes monthly payroll for all active employees (or specific employee).
   *
   * Formulations:
   * 1. Daily Rate = grossSalary / 26
   * 2. Realized Sales Commission: % of paid orders in month where salesRepId === employeeId
   * 3. Attendance Deductions:
   *    - 3 late punches = 0.5 day salary deduction
   *    - Absent days without approved leave = LWP deduction (full daily rate)
   * 4. Loan EMI Deductions: active employee loan installment
   * 5. Net Pay = max(MINIMUM_WAGE_FLOOR, grossSalary + commissions - late - lwp - loan)
   */
  public static async computeMonthlyPayroll(
    monthYear: string,
    options: ComputePayrollOptions = {},
    session?: ClientSession
  ): Promise<PayrollBatchSummary> {
    if (!/^\d{4}-\d{2}$/.test(monthYear)) {
      throw new ValidationError('Invalid monthYear format. Must be YYYY-MM (e.g. 2026-10)');
    }

    const workingDays = options.workingDays ?? PayrollService.DEFAULT_WORKING_DAYS;

    // Fetch active employees
    const activeEmployees = await EmployeeProfileModel.find({ isActive: true }).session(session || null);
    if (activeEmployees.length === 0) {
      logger.warn(`No active employees found for payroll run ${monthYear}`);
    }

    const payrollRuns: IPayrollRun[] = [];
    let totalGrossSalary = 0;
    let totalCommissions = 0;
    let totalLwpDeductions = 0;
    let totalLateDeductions = 0;
    let totalLoanDeductions = 0;
    let totalNetPay = 0;

    for (const emp of activeEmployees) {
      const grossSalary = emp.grossSalary;
      const dailyRate = Math.round((grossSalary / workingDays) * 100) / 100;

      // 1. Calculate Attendance Deductions
      const attendanceStats = await AttendanceService.getMonthlyAttendanceStats(
        emp._id,
        monthYear,
        workingDays
      );

      // Rule: 3 late punches = 0.5 day deduction
      const lateGroups = Math.floor(attendanceStats.latePunchesCount / 3);
      const lateDeduction = Math.round(lateGroups * 0.5 * dailyRate * 100) / 100;

      // Rule: Absent days without leave = LWP deduction
      const lwpDeduction = Math.round(attendanceStats.absentDaysCount * dailyRate * 100) / 100;

      // 2. Calculate Realized Sales Commissions from paid orders
      let commissionAddition = 0;
      if (emp.salesCommissionRate > 0) {
        // Query paid orders attributed to sales rep in month
        const orderQuery: any = {
          salesRepId: { $in: [emp._id, emp.userId] },
          paymentStatus: { $in: ['PAID', 'COLLECTED', 'SETTLED', 'RECONCILED'] },
          createdAt: {
            $gte: new Date(`${monthYear}-01T00:00:00.000Z`),
            $lte: new Date(`${monthYear}-31T23:59:59.999Z`),
          },
        };

        const paidOrders = await OrderModel.find(orderQuery).session(session || null);
        const totalSalesAmount = paidOrders.reduce(
          (acc, ord) => acc + (ord.grandTotal || 0),
          0
        );
        commissionAddition = Math.round(totalSalesAmount * (emp.salesCommissionRate / 100) * 100) / 100;
      }

      // 3. Calculate Loan EMI Deductions
      let loanDeduction = 0;
      const activeLoan = await LoanModel.findOne({
        borrowerId: { $in: [emp._id, emp.userId] },
        loanType: 'EMPLOYEE_LOAN',
        status: 'ACTIVE',
        outstandingBalance: { $gt: 0 },
      }).session(session || null);

      if (activeLoan) {
        // Calculate monthly installment (principalBDT / tenureMonths or schedule)
        const scheduledItem = activeLoan.repaymentSchedule.find(
          (s) => !s.isPaid && s.dueDate.toISOString().slice(0, 7) <= monthYear
        );

        if (scheduledItem) {
          loanDeduction = Math.min(scheduledItem.totalDue, activeLoan.outstandingBalance);
        } else {
          const standardEmi = Math.round(
            (activeLoan.principalBDT / Math.max(1, activeLoan.tenureMonths)) * 100
          ) / 100;
          loanDeduction = Math.min(standardEmi, activeLoan.outstandingBalance);
        }
      }

      // 4. Compute Net Pay with statutory minimum wage floor
      const calculatedNet =
        grossSalary + commissionAddition - (lwpDeduction + lateDeduction + loanDeduction);
      const netPay = Math.max(
        PayrollService.MINIMUM_WAGE_FLOOR,
        Math.round(calculatedNet * 100) / 100
      );

      // Check if a draft or submitted payroll run already exists for this month & employee
      let payrollRun = await PayrollRunModel.findOne({
        monthYear,
        employeeId: emp._id,
      }).session(session || null);

      if (payrollRun && payrollRun.status === 'POSTED') {
        logger.info(
          `Skipping already POSTED payroll run for employee ${emp.employeeCode} (${monthYear})`
        );
        payrollRuns.push(payrollRun);
        continue;
      }

      const runCode = payrollRun
        ? payrollRun.payrollRunCode
        : `PR-${monthYear}-${emp.employeeCode}`;

      if (!payrollRun) {
        payrollRun = new PayrollRunModel({
          payrollRunCode: runCode,
          monthYear,
          employeeId: emp._id,
          grossSalary,
          commissionAddition,
          lwpDeduction,
          lateDeduction,
          loanDeduction,
          netPay,
          status: 'SUBMITTED',
        });
      } else {
        payrollRun.grossSalary = grossSalary;
        payrollRun.commissionAddition = commissionAddition;
        payrollRun.lwpDeduction = lwpDeduction;
        payrollRun.lateDeduction = lateDeduction;
        payrollRun.loanDeduction = loanDeduction;
        payrollRun.netPay = netPay;
        payrollRun.status = 'SUBMITTED';
      }

      await payrollRun.save({ session });
      payrollRuns.push(payrollRun);

      totalGrossSalary += grossSalary;
      totalCommissions += commissionAddition;
      totalLwpDeductions += lwpDeduction;
      totalLateDeductions += lateDeduction;
      totalLoanDeductions += loanDeduction;
      totalNetPay += netPay;
    }

    logger.info(
      `Monthly payroll computed for ${payrollRuns.length} employees for ${monthYear} (Total Net: ${totalNetPay} BDT)`
    );

    return {
      monthYear,
      totalEmployees: payrollRuns.length,
      totalGrossSalary: Math.round(totalGrossSalary * 100) / 100,
      totalCommissions: Math.round(totalCommissions * 100) / 100,
      totalLwpDeductions: Math.round(totalLwpDeductions * 100) / 100,
      totalLateDeductions: Math.round(totalLateDeductions * 100) / 100,
      totalLoanDeductions: Math.round(totalLoanDeductions * 100) / 100,
      totalNetPay: Math.round(totalNetPay * 100) / 100,
      payrollRuns,
    };
  }

  /**
   * Posts finalized monthly payroll to General Ledger with automated balanced JV.
   *
   * Balanced Journal Entry:
   *   Debit 6110 Salaries & Allowances Expense (Effective Gross: gross - late - lwp)
   *   Debit 6120 Sales Commissions Expense
   *   Credit 2100 Accrued Salaries Payable (Net Pay)
   *   Credit 1420 Employee Advance / Loan Recoveries
   */
  public static async postPayrollToGl(
    monthYear: string,
    approvedBy: string | Types.ObjectId,
    session?: ClientSession,
    idempotencyKey?: string
  ): Promise<PostPayrollGlResult> {
    if (!/^\d{4}-\d{2}$/.test(monthYear)) {
      throw new ValidationError('Invalid monthYear format. Must be YYYY-MM');
    }

    // Ensure accounts exist in COA
    await this.ensurePayrollChartOfAccounts(session);

    // Fetch payroll runs for the month
    const runs = await PayrollRunModel.find({
      monthYear,
      status: { $in: ['DRAFT', 'SUBMITTED', 'APPROVED'] },
    }).session(session || null);

    if (runs.length === 0) {
      throw new NotFoundError(`No unposted payroll runs found for month ${monthYear}`);
    }

    let totalGross = 0;
    let totalCommissions = 0;
    let totalLwp = 0;
    let totalLate = 0;
    let totalLoanDeductions = 0;
    let totalNetPay = 0;

    for (const r of runs) {
      totalGross += r.grossSalary;
      totalCommissions += r.commissionAddition;
      totalLwp += r.lwpDeduction;
      totalLate += r.lateDeduction;
      totalLoanDeductions += r.loanDeduction;
      totalNetPay += r.netPay;
    }

    // Mathematical balance check:
    // Effective Gross = totalGross - (totalLwp + totalLate)
    // Total Debits = Effective Gross + totalCommissions
    // Total Credits = totalNetPay + totalLoanDeductions
    // Because NetPay = Effective Gross + totalCommissions - totalLoanDeductions,
    // Total Debits === Total Credits!
    const effectiveGross = Math.round((totalGross - (totalLwp + totalLate)) * 100) / 100;
    const roundedCommissions = Math.round(totalCommissions * 100) / 100;
    const roundedNetPay = Math.round(totalNetPay * 100) / 100;
    const roundedLoanDeductions = Math.round(totalLoanDeductions * 100) / 100;

    // Adjust any 1-cent rounding difference to Accrued Salaries Payable
    const totalDebit = Math.round((effectiveGross + roundedCommissions) * 100) / 100;
    const totalCredit = Math.round((roundedNetPay + roundedLoanDeductions) * 100) / 100;
    let adjustedNetPay = roundedNetPay;
    if (Math.abs(totalDebit - totalCredit) > 0.001) {
      adjustedNetPay = Math.round((totalDebit - roundedLoanDeductions) * 100) / 100;
    }

    const lines: CreateVoucherLineDTO[] = [];

    // 1. Debit 6110 Salaries & Allowances Expense
    if (effectiveGross > 0) {
      lines.push({
        accountCode: PayrollService.ACCT_SALARIES_EXPENSE,
        accountName: 'Salaries & Allowances Expense',
        debit: effectiveGross,
        credit: 0,
        description: `Consolidated Monthly Payroll Salaries for ${monthYear}`,
      });
    }

    // 2. Debit 6120 Sales Commissions Expense
    if (roundedCommissions > 0) {
      lines.push({
        accountCode: PayrollService.ACCT_COMMISSIONS_EXPENSE,
        accountName: 'Sales Commissions Expense',
        debit: roundedCommissions,
        credit: 0,
        description: `Consolidated Sales Rep Commissions for ${monthYear}`,
      });
    }

    // 3. Credit 2100 Accrued Salaries Payable
    if (adjustedNetPay > 0) {
      lines.push({
        accountCode: PayrollService.ACCT_SALARIES_PAYABLE,
        accountName: 'Accrued Salaries Payable',
        debit: 0,
        credit: adjustedNetPay,
        description: `Net Salaries Payable to Staff for ${monthYear}`,
      });
    }

    // 4. Credit 1420 Employee Advance / Loan Recoveries
    if (roundedLoanDeductions > 0) {
      lines.push({
        accountCode: PayrollService.ACCT_LOAN_RECOVERIES,
        accountName: 'Employee Advance / Loan Recoveries',
        debit: 0,
        credit: roundedLoanDeductions,
        description: `Employee Loan EMI Recoveries for ${monthYear}`,
      });
    }

    const voucherKey = idempotencyKey || `PAYROLL-JV-${monthYear}`;

    // Post General Ledger Journal Voucher
    const { journalEntry } = await AccountingService.createJournalVoucher(
      {
        voucherType: 'JOURNAL',
        transactionDate: new Date(),
        sourceDocumentRef: `PR-${monthYear}`,
        lines,
        idempotencyKey: voucherKey,
        notes: `Automated monthly payroll posting for ${monthYear} (${runs.length} employees)`,
      },
      approvedBy,
      session
    );

    // Update all payroll runs to POSTED status
    const approvedById = new Types.ObjectId(approvedBy);
    const now = new Date();

    for (const run of runs) {
      run.status = 'POSTED';
      run.journalRef = journalEntry.voucherNo;
      run.approvedBy = approvedById;
      run.processedAt = now;
      await run.save({ session });

      // If employee had loan deductions, apply to Loan ledger
      if (run.loanDeduction > 0) {
        try {
          const emp = await EmployeeProfileModel.findById(run.employeeId).session(session || null);
          if (emp) {
            const loan = await LoanModel.findOne({
              borrowerId: { $in: [emp._id, emp.userId] },
              loanType: 'EMPLOYEE_LOAN',
              status: 'ACTIVE',
              outstandingBalance: { $gt: 0 },
            }).session(session || null);

            if (loan) {
              await LoanService.recordLoanRepayment(
                loan.loanCode,
                run.loanDeduction,
                {
                  session,
                  userId: approvedById,
                  notes: `Payroll EMI recovery deduction for ${monthYear}`,
                }
              );
            }
          }
        } catch (loanErr: any) {
          logger.warn(`Could not sync loan repayment for payroll run ${run.payrollRunCode}: ${loanErr.message}`);
        }
      }
    }

    logger.info(
      `Payroll for ${monthYear} posted to GL successfully: JV ${journalEntry.voucherNo} (${runs.length} employees, Net: ${adjustedNetPay} BDT)`
    );

    return {
      monthYear,
      journalVoucherNo: journalEntry.voucherNo,
      journalEntryId: journalEntry._id,
      postedCount: runs.length,
      totalNetPay: adjustedNetPay,
      status: 'POSTED',
    };
  }
}

export default PayrollService;
