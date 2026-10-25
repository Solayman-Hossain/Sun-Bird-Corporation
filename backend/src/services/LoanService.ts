import { ClientSession, Types } from 'mongoose';
import {
  LoanModel,
  ILoan,
  IRepaymentScheduleItem,
  LoanType,
  BorrowerType,
  LoanStatus,
  InterestMethod,
} from '../models/Loan';
import { ChartOfAccountsModel } from '../models/ChartOfAccounts';
import { CounterService } from './CounterService';
import { AccountingService } from './AccountingService';
import { ValidationError, NotFoundError } from '../errors/AppError';
import logger from '../config/logger';

export interface CreateLoanDTO {
  loanCode?: string;
  loanType: LoanType;
  borrowerId: Types.ObjectId | string;
  borrowerType: BorrowerType;
  lenderId?: string;
  principalBDT: number;
  isInterestFree?: boolean;
  interestRate?: number;
  interestMethod?: InterestMethod;
  startDate?: Date | string;
  tenureMonths: number;
  contractDocUrl?: string;
  approvedBy?: Types.ObjectId | string;
  postDisbursementJv?: boolean;
}

export interface LoanFilterDTO {
  loanType?: LoanType;
  borrowerId?: Types.ObjectId | string;
  borrowerType?: BorrowerType;
  status?: LoanStatus;
  page?: number;
  limit?: number;
}

export interface RecordRepaymentOptions {
  session?: ClientSession;
  userId?: Types.ObjectId | string;
  paymentAccountCode?: number; // e.g. 1020 Bank or 1010 Cash
  transactionDate?: Date | string;
  notes?: string;
}

export interface LoanRepaymentResult {
  loanCode: string;
  paymentAmount: number;
  principalPaid: number;
  interestPaid: number;
  remainingOutstandingBalance: number;
  loanStatus: LoanStatus;
  settledInstallmentsCount: number;
  journalVoucherNo?: string;
  journalEntryId?: Types.ObjectId;
  loan: ILoan;
}

export class LoanService {
  /**
   * Computes the month-by-month repayment schedule for a loan.
   *
   * - If `isInterestFree: true` or `interestRate === 0`:
   *   Interest accrued is strictly zero. Total principal is amortized evenly across tenure.
   * - If `isInterestFree: false` and `interestRate > 0`:
   *   - FLAT: Total interest = Principal * (Rate/100) * (Tenure/12).
   *     Equal principal and equal interest per month.
   *   - REDUCING_BALANCE: Standard actuarial EMI formula:
   *     EMI = P * r * (1 + r)^n / ((1 + r)^n - 1)
   *     Interest = Current Balance * r, Principal = EMI - Interest.
   */
  public static generateRepaymentSchedule(params: {
    principalBDT: number;
    tenureMonths: number;
    startDate: Date;
    isInterestFree: boolean;
    interestRate: number;
    interestMethod: InterestMethod;
  }): IRepaymentScheduleItem[] {
    const {
      principalBDT,
      tenureMonths,
      startDate,
      isInterestFree,
      interestRate,
      interestMethod,
    } = params;

    if (principalBDT <= 0) {
      throw new ValidationError('principalBDT must be strictly greater than 0');
    }
    if (tenureMonths <= 0 || !Number.isInteger(tenureMonths)) {
      throw new ValidationError('tenureMonths must be a positive integer');
    }

    const schedule: IRepaymentScheduleItem[] = [];

    // Case 1: Strictly Interest-Free (Rule 5 & PRD §7.15)
    if (isInterestFree || interestRate <= 0) {
      const baseMonthlyPrincipal = Number((principalBDT / tenureMonths).toFixed(2));
      let principalAccumulator = 0;

      for (let i = 1; i <= tenureMonths; i++) {
        const dueDate = new Date(startDate);
        dueDate.setMonth(dueDate.getMonth() + i);

        // Adjust rounding on the final installment so exact sum matches principalBDT
        let principalDue: number;
        if (i === tenureMonths) {
          principalDue = Number((principalBDT - principalAccumulator).toFixed(2));
        } else {
          principalDue = baseMonthlyPrincipal;
          principalAccumulator = Number((principalAccumulator + principalDue).toFixed(2));
        }

        schedule.push({
          dueDate,
          principalDue,
          interestDue: 0,
          totalDue: principalDue,
          isPaid: false,
        });
      }

      return schedule;
    }

    // Case 2: Interest-Bearing FLAT Method
    if (interestMethod === 'FLAT') {
      const totalInterest = Number(
        (principalBDT * (interestRate / 100) * (tenureMonths / 12)).toFixed(2)
      );
      const baseMonthlyPrincipal = Number((principalBDT / tenureMonths).toFixed(2));
      const baseMonthlyInterest = Number((totalInterest / tenureMonths).toFixed(2));

      let principalAccumulator = 0;
      let interestAccumulator = 0;

      for (let i = 1; i <= tenureMonths; i++) {
        const dueDate = new Date(startDate);
        dueDate.setMonth(dueDate.getMonth() + i);

        let principalDue: number;
        let interestDue: number;

        if (i === tenureMonths) {
          principalDue = Number((principalBDT - principalAccumulator).toFixed(2));
          interestDue = Number((totalInterest - interestAccumulator).toFixed(2));
        } else {
          principalDue = baseMonthlyPrincipal;
          interestDue = baseMonthlyInterest;
          principalAccumulator = Number((principalAccumulator + principalDue).toFixed(2));
          interestAccumulator = Number((interestAccumulator + interestDue).toFixed(2));
        }

        const totalDue = Number((principalDue + interestDue).toFixed(2));

        schedule.push({
          dueDate,
          principalDue,
          interestDue,
          totalDue,
          isPaid: false,
        });
      }

      return schedule;
    }

    // Case 3: Interest-Bearing REDUCING_BALANCE Method (Amortization)
    const monthlyRate = interestRate / 100 / 12;
    const factor = Math.pow(1 + monthlyRate, tenureMonths);
    const emi = Number(((principalBDT * monthlyRate * factor) / (factor - 1)).toFixed(2));

    let remainingBalance = principalBDT;
    let principalAccumulator = 0;

    for (let i = 1; i <= tenureMonths; i++) {
      const dueDate = new Date(startDate);
      dueDate.setMonth(dueDate.getMonth() + i);

      let interestDue = Number((remainingBalance * monthlyRate).toFixed(2));
      let principalDue = Number((emi - interestDue).toFixed(2));

      if (i === tenureMonths || principalDue > remainingBalance) {
        principalDue = Number((principalBDT - principalAccumulator).toFixed(2));
        interestDue = Number((remainingBalance * monthlyRate).toFixed(2));
      } else {
        principalAccumulator = Number((principalAccumulator + principalDue).toFixed(2));
      }

      remainingBalance = Math.max(0, Number((remainingBalance - principalDue).toFixed(2)));
      const totalDue = Number((principalDue + interestDue).toFixed(2));

      schedule.push({
        dueDate,
        principalDue,
        interestDue,
        totalDue,
        isPaid: false,
      });
    }

    return schedule;
  }

  /**
   * Creates and registers a new multi-type loan, generating its repayment schedule.
   *
   * Supported types:
   * - BANK_LOAN
   * - PARTNER_DIRECTOR_LOAN
   * - SUPPLIER_CREDIT
   * - EMPLOYEE_LOAN
   * - CUSTOMER_ADVANCE
   */
  public static async createLoan(
    loanData: CreateLoanDTO,
    approvedBy?: Types.ObjectId | string,
    session?: ClientSession
  ): Promise<ILoan> {
    const {
      loanType,
      borrowerId,
      borrowerType,
      lenderId,
      principalBDT,
      tenureMonths,
      contractDocUrl,
      postDisbursementJv = false,
    } = loanData;

    // 1. Validation
    if (!loanType) throw new ValidationError('loanType is required');
    if (!borrowerId) throw new ValidationError('borrowerId is required');
    if (!borrowerType) throw new ValidationError('borrowerType is required');
    if (!principalBDT || principalBDT <= 0) {
      throw new ValidationError('principalBDT must be greater than zero');
    }
    if (!tenureMonths || tenureMonths < 1) {
      throw new ValidationError('tenureMonths must be at least 1 month');
    }

    const isInterestFree = loanData.isInterestFree ?? (loanData.interestRate === 0);
    let interestRate = loanData.interestRate ?? 0;

    // Strict Rule 5 check: interest-free loan must not accrue interest
    if (isInterestFree) {
      if (interestRate > 0) {
        throw new ValidationError('Interest-free loan cannot have interestRate > 0');
      }
      interestRate = 0;
    }

    const interestMethod: InterestMethod = loanData.interestMethod || 'REDUCING_BALANCE';
    const startDate = loanData.startDate ? new Date(loanData.startDate) : new Date();

    // 2. Generate unique loanCode
    let loanCode = loanData.loanCode?.trim();
    if (!loanCode) {
      try {
        loanCode = await CounterService.getNextSequence('LN', session);
      } catch (err) {
        const year = new Date().getFullYear();
        const rand = Math.floor(10000 + Math.random() * 90000);
        loanCode = `LN-${year}-${rand}`;
      }
    }

    // 3. Generate schedule
    const repaymentSchedule = this.generateRepaymentSchedule({
      principalBDT,
      tenureMonths,
      startDate,
      isInterestFree,
      interestRate,
      interestMethod,
    });

    const parsedBorrowerId =
      typeof borrowerId === 'string' ? new Types.ObjectId(borrowerId) : borrowerId;
    const approver =
      approvedBy || loanData.approvedBy
        ? typeof (approvedBy || loanData.approvedBy) === 'string'
          ? new Types.ObjectId((approvedBy || loanData.approvedBy) as string)
          : (approvedBy || loanData.approvedBy)
        : undefined;

    const loanDoc = new LoanModel({
      loanCode,
      loanType,
      borrowerId: parsedBorrowerId,
      borrowerType,
      lenderId,
      principalBDT: Number(principalBDT.toFixed(2)),
      isInterestFree,
      interestRate,
      interestMethod,
      startDate,
      tenureMonths,
      outstandingBalance: Number(principalBDT.toFixed(2)),
      repaymentSchedule,
      status: 'ACTIVE',
      contractDocUrl,
      approvedBy: approver,
    });

    await loanDoc.save(session ? { session } : {});

    // 4. Optionally post disbursement Journal Voucher
    if (postDisbursementJv && approver) {
      try {
        await this.postDisbursementJournalEntry(loanDoc, approver, session);
      } catch (jvErr) {
        logger.error(`Failed to post disbursement JV for loan ${loanCode}:`, jvErr);
        // Do not abort loan creation if JV was optional
      }
    }

    logger.info(
      `Loan registered successfully: ${loanCode} (${loanType}, Principal: ${principalBDT} BDT, Tenure: ${tenureMonths}m)`
    );

    return loanDoc;
  }

  /**
   * Records a loan repayment, deducting from principal and interest, updating the
   * repayment schedule installments, and posting a double-entry clearance JV.
   *
   * Signature supports both:
   * - `recordLoanRepayment(loanCode, paymentAmount, session)`
   * - `recordLoanRepayment(loanCode, paymentAmount, options)`
   */
  public static async recordLoanRepayment(
    loanCode: string,
    paymentAmount: number,
    sessionOrOptions?: ClientSession | RecordRepaymentOptions,
    maybeSession?: ClientSession
  ): Promise<LoanRepaymentResult> {
    let session: ClientSession | undefined;
    let options: RecordRepaymentOptions = {};

    if (sessionOrOptions && 'startTransaction' in sessionOrOptions) {
      // It's a Mongoose ClientSession
      session = sessionOrOptions as ClientSession;
    } else if (sessionOrOptions && typeof sessionOrOptions === 'object') {
      options = sessionOrOptions as RecordRepaymentOptions;
      session = options.session || maybeSession;
    }

    if (!loanCode || typeof loanCode !== 'string') {
      throw new ValidationError('loanCode must be a valid non-empty string');
    }
    if (!paymentAmount || paymentAmount <= 0) {
      throw new ValidationError('paymentAmount must be strictly greater than zero');
    }

    const normalizedCode = loanCode.trim().toUpperCase();

    // 1. Fetch Loan
    const query = { loanCode: normalizedCode };
    const loan = await (session ? LoanModel.findOne(query).session(session) : LoanModel.findOne(query));

    if (!loan) {
      throw new NotFoundError(`Loan with code '${normalizedCode}' not found`);
    }

    if (loan.status === 'CLOSED' || loan.status === 'WRITTEN_OFF') {
      throw new ValidationError(`Cannot record repayment on a loan with status '${loan.status}'`);
    }

    const roundedPayment = Number(paymentAmount.toFixed(2));
    let unallocatedPayment = roundedPayment;
    let totalPrincipalPaid = 0;
    let totalInterestPaid = 0;
    let settledCount = 0;
    const paymentTimestamp = options.transactionDate
      ? new Date(options.transactionDate)
      : new Date();

    // 2. Iterate through unpaid installments in repayment schedule
    for (const item of loan.repaymentSchedule) {
      if (unallocatedPayment <= 0) break;
      if (item.isPaid) continue;

      const interestPartDue = Number((item.interestDue || 0).toFixed(2));
      const principalPartDue = Number((item.principalDue || 0).toFixed(2));
      const installmentTotalDue = Number((item.totalDue || 0).toFixed(2));

      if (unallocatedPayment >= installmentTotalDue) {
        // Fully pay this installment
        item.isPaid = true;
        item.paidAt = paymentTimestamp;
        totalInterestPaid += interestPartDue;
        totalPrincipalPaid += principalPartDue;
        unallocatedPayment = Number((unallocatedPayment - installmentTotalDue).toFixed(2));
        settledCount++;
      } else {
        // Partially pay this installment (cover interest first, then principal)
        const interestCovered = Math.min(interestPartDue, unallocatedPayment);
        const remainingForPrincipal = Number((unallocatedPayment - interestCovered).toFixed(2));
        const principalCovered = Math.min(principalPartDue, remainingForPrincipal);

        totalInterestPaid += interestCovered;
        totalPrincipalPaid += principalCovered;
        unallocatedPayment = 0;
      }
    }

    // If payment amount exceeded schedule total (e.g. advance or principal lump-sum payoff)
    if (unallocatedPayment > 0) {
      totalPrincipalPaid += unallocatedPayment;
      unallocatedPayment = 0;
    }

    totalPrincipalPaid = Number(totalPrincipalPaid.toFixed(2));
    totalInterestPaid = Number(totalInterestPaid.toFixed(2));

    // 3. Update outstandingBalance and loan status
    const previousBalance = loan.outstandingBalance;
    const newOutstandingBalance = Math.max(
      0,
      Number((previousBalance - totalPrincipalPaid).toFixed(2))
    );
    loan.outstandingBalance = newOutstandingBalance;

    if (newOutstandingBalance <= 0.01) {
      loan.outstandingBalance = 0;
      loan.status = 'CLOSED';
    }

    await loan.save(session ? { session } : {});

    // 4. Post Loan Clearance / Repayment Journal Voucher
    let journalVoucherNo: string | undefined;
    let journalEntryId: Types.ObjectId | undefined;

    const initiatingUserId =
      options.userId || loan.approvedBy || loan.borrowerId;

    try {
      const jvResult = await this.postRepaymentJournalEntry(
        loan,
        roundedPayment,
        totalPrincipalPaid,
        totalInterestPaid,
        initiatingUserId,
        options.paymentAccountCode,
        session
      );
      journalVoucherNo = jvResult.voucherNo;
      journalEntryId = jvResult.journalId;
    } catch (jvErr) {
      logger.warn(
        `Automated JV posting for loan repayment ${loan.loanCode} deferred or logged warning:`,
        jvErr
      );
    }

    logger.info(
      `Recorded repayment for Loan ${loan.loanCode}: Paid ${roundedPayment} BDT (Principal: ${totalPrincipalPaid}, Interest: ${totalInterestPaid}), New Balance: ${loan.outstandingBalance} BDT, Status: ${loan.status}`
    );

    return {
      loanCode: loan.loanCode,
      paymentAmount: roundedPayment,
      principalPaid: totalPrincipalPaid,
      interestPaid: totalInterestPaid,
      remainingOutstandingBalance: loan.outstandingBalance,
      loanStatus: loan.status,
      settledInstallmentsCount: settledCount,
      journalVoucherNo,
      journalEntryId,
      loan,
    };
  }

  /**
   * Helper: Posts double-entry Journal Voucher for loan repayment.
   */
  private static async postRepaymentJournalEntry(
    loan: ILoan,
    paymentAmount: number,
    principalPaid: number,
    interestPaid: number,
    userId: Types.ObjectId | string,
    preferredBankCode?: number,
    session?: ClientSession
  ): Promise<{ voucherNo: string; journalId: Types.ObjectId }> {
    const bankAccountCode = preferredBankCode || 1020;

    // Ensure required accounts exist in COA
    await this.ensureCoaAccountsExist(loan.loanType, bankAccountCode, session);

    const lines: Array<{
      accountCode: number;
      accountName?: string;
      debit: number;
      credit: number;
      description?: string;
    }> = [];

    const parsedUserId =
      typeof userId === 'string' ? new Types.ObjectId(userId) : userId;

    if (loan.loanType === 'EMPLOYEE_LOAN') {
      // Sun Bird receives cash/bank back from employee
      // Dr 1020 Bank (paymentAmount)
      // Cr 1140 Employee Loan (principalPaid)
      // Cr 4090 Other Income (interestPaid, if any)
      lines.push({
        accountCode: bankAccountCode,
        debit: paymentAmount,
        credit: 0,
        description: `Loan Repayment received from ${loan.borrowerType} - ${loan.loanCode}`,
      });
      lines.push({
        accountCode: 1140,
        debit: 0,
        credit: principalPaid,
        description: `Principal clearance for ${loan.loanCode}`,
      });
      if (interestPaid > 0) {
        lines.push({
          accountCode: 4090,
          debit: 0,
          credit: interestPaid,
          description: `Interest income received on loan ${loan.loanCode}`,
        });
      }
    } else if (loan.loanType === 'BANK_LOAN') {
      // Sun Bird pays bank back
      // Dr 2110 Bank Loan Liability (principalPaid)
      // Dr 6410 Interest Expense (interestPaid, if any)
      // Cr 1020 Bank (paymentAmount)
      lines.push({
        accountCode: 2110,
        debit: principalPaid,
        credit: 0,
        description: `Principal repayment for Bank Loan ${loan.loanCode}`,
      });
      if (interestPaid > 0) {
        lines.push({
          accountCode: 6410,
          debit: interestPaid,
          credit: 0,
          description: `Interest expense on Bank Loan ${loan.loanCode}`,
        });
      }
      lines.push({
        accountCode: bankAccountCode,
        debit: 0,
        credit: paymentAmount,
        description: `Bank repayment clearance for ${loan.loanCode}`,
      });
    } else if (loan.loanType === 'PARTNER_DIRECTOR_LOAN') {
      if (loan.borrowerType === 'COMPANY') {
        // Company repaying partner/director
        lines.push({
          accountCode: 2120,
          debit: principalPaid,
          credit: 0,
          description: `Repayment to Director/Partner for ${loan.loanCode}`,
        });
        if (interestPaid > 0) {
          lines.push({
            accountCode: 6410,
            debit: interestPaid,
            credit: 0,
            description: `Interest expense on Partner Loan ${loan.loanCode}`,
          });
        }
        lines.push({
          accountCode: bankAccountCode,
          debit: 0,
          credit: paymentAmount,
          description: `Clearance to Director for ${loan.loanCode}`,
        });
      } else {
        // Partner repaying company
        lines.push({
          accountCode: bankAccountCode,
          debit: paymentAmount,
          credit: 0,
          description: `Repayment from Partner on ${loan.loanCode}`,
        });
        lines.push({
          accountCode: 1150,
          debit: 0,
          credit: principalPaid,
          description: `Partner loan receivable clearance ${loan.loanCode}`,
        });
        if (interestPaid > 0) {
          lines.push({
            accountCode: 4090,
            debit: 0,
            credit: interestPaid,
            description: `Interest income on Partner Loan ${loan.loanCode}`,
          });
        }
      }
    } else if (loan.loanType === 'CUSTOMER_ADVANCE') {
      // Customer advance adjusted or refunded
      lines.push({
        accountCode: 2130,
        debit: paymentAmount,
        credit: 0,
        description: `Customer advance clearance for ${loan.loanCode}`,
      });
      lines.push({
        accountCode: bankAccountCode,
        debit: 0,
        credit: paymentAmount,
        description: `Bank adjustment for customer advance ${loan.loanCode}`,
      });
    } else {
      // SUPPLIER_CREDIT or generic
      lines.push({
        accountCode: 2010,
        debit: principalPaid,
        credit: 0,
        description: `Supplier credit clearance for ${loan.loanCode}`,
      });
      if (interestPaid > 0) {
        lines.push({
          accountCode: 6410,
          debit: interestPaid,
          credit: 0,
          description: `Interest on supplier credit ${loan.loanCode}`,
        });
      }
      lines.push({
        accountCode: bankAccountCode,
        debit: 0,
        credit: paymentAmount,
        description: `Bank repayment for supplier credit ${loan.loanCode}`,
      });
    }

    const jvResult = await AccountingService.createJournalVoucher(
      {
        voucherType: 'PAYMENT',
        sourceDocumentRef: loan.loanCode,
        lines,
        status: 'POSTED',
        notes: `Automated Loan Clearance JV for ${loan.loanCode}`,
      },
      parsedUserId,
      session
    );

    return {
      voucherNo: jvResult.journalEntry.voucherNo,
      journalId: jvResult.journalEntry._id,
    };
  }

  /**
   * Helper: Posts disbursement JV when loan is disbursed.
   */
  private static async postDisbursementJournalEntry(
    loan: ILoan,
    userId: Types.ObjectId | string,
    session?: ClientSession
  ): Promise<{ voucherNo: string; journalId: Types.ObjectId }> {
    const bankAccountCode = 1020;
    await this.ensureCoaAccountsExist(loan.loanType, bankAccountCode, session);

    const lines: Array<{
      accountCode: number;
      accountName?: string;
      debit: number;
      credit: number;
      description?: string;
    }> = [];

    const parsedUserId =
      typeof userId === 'string' ? new Types.ObjectId(userId) : userId;

    if (loan.loanType === 'EMPLOYEE_LOAN') {
      lines.push({
        accountCode: 1140,
        debit: loan.principalBDT,
        credit: 0,
        description: `Employee Loan disbursement - ${loan.loanCode}`,
      });
      lines.push({
        accountCode: bankAccountCode,
        debit: 0,
        credit: loan.principalBDT,
        description: `Bank payout for loan ${loan.loanCode}`,
      });
    } else if (loan.loanType === 'BANK_LOAN') {
      lines.push({
        accountCode: bankAccountCode,
        debit: loan.principalBDT,
        credit: 0,
        description: `Bank Loan proceeds received - ${loan.loanCode}`,
      });
      lines.push({
        accountCode: 2110,
        debit: 0,
        credit: loan.principalBDT,
        description: `Bank Loan liability created - ${loan.loanCode}`,
      });
    } else if (loan.loanType === 'PARTNER_DIRECTOR_LOAN') {
      if (loan.borrowerType === 'COMPANY') {
        lines.push({
          accountCode: bankAccountCode,
          debit: loan.principalBDT,
          credit: 0,
          description: `Director Loan funds received - ${loan.loanCode}`,
        });
        lines.push({
          accountCode: 2120,
          debit: 0,
          credit: loan.principalBDT,
          description: `Director Loan liability created - ${loan.loanCode}`,
        });
      } else {
        lines.push({
          accountCode: 1150,
          debit: loan.principalBDT,
          credit: 0,
          description: `Loan to Partner disbursed - ${loan.loanCode}`,
        });
        lines.push({
          accountCode: bankAccountCode,
          debit: 0,
          credit: loan.principalBDT,
          description: `Bank payout for partner loan ${loan.loanCode}`,
        });
      }
    } else if (loan.loanType === 'CUSTOMER_ADVANCE') {
      lines.push({
        accountCode: bankAccountCode,
        debit: loan.principalBDT,
        credit: 0,
        description: `Customer advance receipt - ${loan.loanCode}`,
      });
      lines.push({
        accountCode: 2130,
        debit: 0,
        credit: loan.principalBDT,
        description: `Customer advance liability - ${loan.loanCode}`,
      });
    } else {
      lines.push({
        accountCode: 1200,
        debit: loan.principalBDT,
        credit: 0,
        description: `Supplier credit inventory received - ${loan.loanCode}`,
      });
      lines.push({
        accountCode: 2010,
        debit: 0,
        credit: loan.principalBDT,
        description: `Supplier credit liability created - ${loan.loanCode}`,
      });
    }

    const jvResult = await AccountingService.createJournalVoucher(
      {
        voucherType: 'PAYMENT',
        sourceDocumentRef: loan.loanCode,
        lines,
        status: 'POSTED',
        notes: `Disbursement JV for ${loan.loanCode}`,
      },
      parsedUserId,
      session
    );

    return {
      voucherNo: jvResult.journalEntry.voucherNo,
      journalId: jvResult.journalEntry._id,
    };
  }

  /**
   * Helper: Ensures COA accounts needed for loan journals exist in MongoDB.
   */
  private static async ensureCoaAccountsExist(
    loanType: LoanType,
    bankCode: number = 1020,
    session?: ClientSession
  ): Promise<void> {
    const requiredAccounts = [
      {
        accountCode: bankCode,
        accountName: bankCode === 1010 ? 'Cash on Hand' : 'Bank Accounts',
        accountType: 'ASSET' as const,
        normalBalance: 'DEBIT' as const,
      },
      {
        accountCode: 1140,
        accountName: 'Employee Advances and Loans',
        accountType: 'ASSET' as const,
        normalBalance: 'DEBIT' as const,
      },
      {
        accountCode: 1150,
        accountName: 'Partner Loans Receivable',
        accountType: 'ASSET' as const,
        normalBalance: 'DEBIT' as const,
      },
      {
        accountCode: 1200,
        accountName: 'Inventory Asset — Merchandise',
        accountType: 'ASSET' as const,
        normalBalance: 'DEBIT' as const,
      },
      {
        accountCode: 2010,
        accountName: 'Accounts Payable — Trade Creditors',
        accountType: 'LIABILITY' as const,
        normalBalance: 'CREDIT' as const,
      },
      {
        accountCode: 2110,
        accountName: 'Short-Term Bank Borrowings',
        accountType: 'LIABILITY' as const,
        normalBalance: 'CREDIT' as const,
      },
      {
        accountCode: 2120,
        accountName: 'Partner & Director Loans Payable',
        accountType: 'LIABILITY' as const,
        normalBalance: 'CREDIT' as const,
      },
      {
        accountCode: 2130,
        accountName: 'Customer Advances and Deposits',
        accountType: 'LIABILITY' as const,
        normalBalance: 'CREDIT' as const,
      },
      {
        accountCode: 4090,
        accountName: 'Other Revenue & Interest Income',
        accountType: 'REVENUE' as const,
        normalBalance: 'CREDIT' as const,
      },
      {
        accountCode: 6410,
        accountName: 'Interest & Financing Expense',
        accountType: 'EXPENSE' as const,
        normalBalance: 'DEBIT' as const,
      },
    ];

    for (const acc of requiredAccounts) {
      const exists = await (session
        ? ChartOfAccountsModel.findOne({ accountCode: acc.accountCode }).session(session)
        : ChartOfAccountsModel.findOne({ accountCode: acc.accountCode }));

      if (!exists) {
        await ChartOfAccountsModel.create(
          [
            {
              accountCode: acc.accountCode,
              accountName: acc.accountName,
              accountType: acc.accountType,
              normalBalance: acc.normalBalance,
              isControl: false,
              isActive: true,
            },
          ],
          session ? { session } : {}
        );
      }
    }
  }

  /**
   * Retrieves a single loan by its unique loan code.
   */
  public static async getLoanByCode(
    loanCode: string,
    session?: ClientSession
  ): Promise<ILoan> {
    if (!loanCode) throw new ValidationError('loanCode is required');
    const query = { loanCode: loanCode.trim().toUpperCase() };
    const loan = await (session ? LoanModel.findOne(query).session(session) : LoanModel.findOne(query));
    if (!loan) {
      throw new NotFoundError(`Loan with code '${loanCode}' not found`);
    }
    return loan;
  }

  /**
   * Retrieves loans matching filter criteria with pagination.
   */
  public static async getLoans(filter: LoanFilterDTO): Promise<{
    loans: ILoan[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = Math.max(1, filter.page || 1);
    const limit = Math.max(1, Math.min(100, filter.limit || 20));
    const skip = (page - 1) * limit;

    const query: any = {};
    if (filter.loanType) query.loanType = filter.loanType;
    if (filter.status) query.status = filter.status;
    if (filter.borrowerType) query.borrowerType = filter.borrowerType;
    if (filter.borrowerId) {
      query.borrowerId =
        typeof filter.borrowerId === 'string'
          ? new Types.ObjectId(filter.borrowerId)
          : filter.borrowerId;
    }

    const [loans, total] = await Promise.all([
      LoanModel.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      LoanModel.countDocuments(query),
    ]);

    return { loans: loans as unknown as ILoan[], total, page, limit };
  }

  /**
   * Retrieves all loans for a given borrower.
   */
  public static async getBorrowerLoans(
    borrowerId: Types.ObjectId | string,
    loanType?: LoanType
  ): Promise<ILoan[]> {
    const query: any = {
      borrowerId:
        typeof borrowerId === 'string' ? new Types.ObjectId(borrowerId) : borrowerId,
    };
    if (loanType) query.loanType = loanType;
    const records = await LoanModel.find(query).sort({ createdAt: -1 }).lean();
    return records as unknown as ILoan[];
  }
}

export default LoanService;
