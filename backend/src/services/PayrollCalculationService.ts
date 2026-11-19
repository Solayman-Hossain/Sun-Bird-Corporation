import { Types } from 'mongoose';
import {
  SalaryComponentModel,
  ISalaryComponent,
  SalaryStructureModel,
  ISalaryStructure,
  PayrollBatchModel,
  IPayrollBatch,
  PayslipModel,
  IPayslip,
  EmployeeProfileModel,
  IEmployeeProfile,
  EmployeeAdvanceModel,
  LoanModel,
  AttendancePunchModel,
  CounterModel,
  ChartOfAccountsModel,
} from '../models';
import { AccountingService, CreateVoucherLineDTO } from './AccountingService';
import { AuditLogService } from './AuditLogService';
import logger from '../config/logger';
import { NotFoundError, ValidationError } from '../errors/AppError';

export interface ComputeBatchOptions {
  monthYear: string; // YYYY-MM
  organizationId?: string | Types.ObjectId;
  actorId?: string | Types.ObjectId;
}

export class PayrollCalculationService {
  public static readonly ACCT_SALARIES_EXPENSE = 6110;
  public static readonly ACCT_COMMISSIONS_EXPENSE = 6120;
  public static readonly ACCT_SALARIES_PAYABLE = 2100;
  public static readonly ACCT_LOAN_RECOVERIES = 1420;
  public static readonly ACCT_BANK_CASH = 1010;

  // ── Salary Components ──
  public static async getSalaryComponents(organizationId?: string | Types.ObjectId): Promise<ISalaryComponent[]> {
    const query: any = {};
    if (organizationId) query.organizationId = organizationId;
    return await SalaryComponentModel.find(query).sort({ code: 1 }).lean() as any;
  }

  public static async createSalaryComponent(data: Partial<ISalaryComponent>): Promise<ISalaryComponent> {
    const comp = new SalaryComponentModel(data);
    return await comp.save();
  }

  // ── Salary Structures ──
  public static async getSalaryStructures(organizationId?: string | Types.ObjectId): Promise<ISalaryStructure[]> {
    const query: any = {};
    if (organizationId) query.organizationId = organizationId;
    return await SalaryStructureModel.find(query).sort({ structureCode: 1 }).lean() as any;
  }

  public static async createSalaryStructure(data: Partial<ISalaryStructure>): Promise<ISalaryStructure> {
    const structure = new SalaryStructureModel(data);
    return await structure.save();
  }

  // ── Ensure COA Accounts ──
  public static async ensureCoaAccounts(): Promise<void> {
    const accounts = [
      {
        accountCode: PayrollCalculationService.ACCT_SALARIES_EXPENSE,
        accountName: 'Salaries & Allowances Expense',
        accountType: 'EXPENSE' as const,
        normalBalance: 'DEBIT' as const,
      },
      {
        accountCode: PayrollCalculationService.ACCT_COMMISSIONS_EXPENSE,
        accountName: 'Sales Commissions Expense',
        accountType: 'EXPENSE' as const,
        normalBalance: 'DEBIT' as const,
      },
      {
        accountCode: PayrollCalculationService.ACCT_SALARIES_PAYABLE,
        accountName: 'Accrued Salaries Payable',
        accountType: 'LIABILITY' as const,
        normalBalance: 'CREDIT' as const,
      },
      {
        accountCode: PayrollCalculationService.ACCT_LOAN_RECOVERIES,
        accountName: 'Employee Advance / Loan Recoveries',
        accountType: 'ASSET' as const,
        normalBalance: 'CREDIT' as const,
      },
      {
        accountCode: PayrollCalculationService.ACCT_BANK_CASH,
        accountName: 'Main Cash & Bank Account',
        accountType: 'ASSET' as const,
        normalBalance: 'DEBIT' as const,
      },
    ];

    for (const acc of accounts) {
      await ChartOfAccountsModel.findOneAndUpdate(
        { accountCode: acc.accountCode },
        { $setOnInsert: { ...acc, isActive: true } },
        { upsert: true, new: true }
      );
    }
  }

  // ── Compute Monthly Payroll Batch ──
  public static async computePayrollBatch(options: ComputeBatchOptions): Promise<IPayrollBatch> {
    const { monthYear, organizationId, actorId } = options;

    // Check if batch already exists
    let batch = await PayrollBatchModel.findOne({ monthYear, organizationId });
    if (batch && ['APPROVED', 'PAID', 'POSTED_GL'].includes(batch.status)) {
      throw new ValidationError(`Payroll batch for ${monthYear} is already ${batch.status}`);
    }

    const empQuery: any = { isActive: true };
    if (organizationId) empQuery.organizationId = organizationId;
    const employees = await EmployeeProfileModel.find(empQuery);

    if (employees.length === 0) {
      throw new ValidationError('No active employees found to compute payroll');
    }

    if (!batch) {
      const counter = await CounterModel.findByIdAndUpdate(
        `PAYROLL_BATCH_${monthYear}`,
        { $inc: { seq: 1 } },
        { upsert: true, new: true }
      );
      const batchCode = `PRB-${monthYear.replace('-', '')}-${String(counter.seq).padStart(2, '0')}`;
      batch = new PayrollBatchModel({
        batchCode,
        monthYear,
        organizationId,
        status: 'DRAFT',
      });
      await batch.save();
    }

    // Clear old draft payslips for this batch if recomputing
    await PayslipModel.deleteMany({ payrollBatchId: batch._id });

    let totalGross = 0;
    let totalAllowances = 0;
    let totalDeductions = 0;
    let totalNet = 0;

    let slipIndex = 1;
    for (const emp of employees) {
      const basic = emp.basicSalary || 0;
      const houseRent = emp.houseRentAllowance || 0;
      const medical = emp.medicalAllowance || 0;
      const conveyance = emp.conveyanceAllowance || 0;

      const allowances = [
        { name: 'House Rent Allowance', amount: houseRent },
        { name: 'Medical Allowance', amount: medical },
        { name: 'Conveyance Allowance', amount: conveyance },
      ];

      // Check advances due for this month
      const advance = await EmployeeAdvanceModel.findOne({
        employeeId: emp._id,
        repaymentMonth: monthYear,
        status: 'DISBURSED',
      });
      const advanceDeduction = advance ? advance.amount : 0;

      // Check loan installment
      const loan = await LoanModel.findOne({
        borrowerId: emp._id,
        borrowerType: 'EMPLOYEE',
        status: 'ACTIVE',
      });
      const loanDeduction = loan ? Math.min(loan.outstandingBalance, 2000) : 0;

      // Check late punches for this month
      const punches = await AttendancePunchModel.find({
        employeeId: emp._id,
        punchDate: { $regex: new RegExp(`^${monthYear}-`) },
        punchType: 'IN',
      });
      const lateCount = punches.filter((p) => p.isLate).length;
      const latePenalty = lateCount > 3 ? Math.round((basic / 26) * 0.5) : 0; // 0.5 day wage penalty if late > 3 times

      const deductions = [];
      if (advanceDeduction > 0) deductions.push({ name: 'Salary Advance Recovery', amount: advanceDeduction });
      if (loanDeduction > 0) deductions.push({ name: 'Employee Loan Installment', amount: loanDeduction });
      if (latePenalty > 0) deductions.push({ name: 'Late Arrival Penalty', amount: latePenalty });

      const grossEarnings = basic + houseRent + medical + conveyance;
      const totalEmpDeductions = advanceDeduction + loanDeduction + latePenalty;
      const netSalary = Math.max(0, grossEarnings - totalEmpDeductions);

      const payslipNo = `SLIP-${monthYear.replace('-', '')}-${String(slipIndex).padStart(4, '0')}`;
      slipIndex++;

      await PayslipModel.create({
        payslipNo,
        payrollBatchId: batch._id,
        employeeId: emp._id,
        monthYear,
        basicSalary: basic,
        allowances,
        deductions,
        overtimeHours: 0,
        overtimeAmount: 0,
        bonus: 0,
        loanDeduction,
        advanceDeduction,
        latePenalty,
        lwpDeduction: 0,
        grossEarnings,
        totalDeductions: totalEmpDeductions,
        netSalary,
        paymentStatus: 'UNPAID',
        organizationId: emp.organizationId,
      });

      totalGross += grossEarnings;
      totalAllowances += houseRent + medical + conveyance;
      totalDeductions += totalEmpDeductions;
      totalNet += netSalary;
    }

    batch.totalEmployees = employees.length;
    batch.totalGross = totalGross;
    batch.totalAllowances = totalAllowances;
    batch.totalDeductions = totalDeductions;
    batch.totalNet = totalNet;
    batch.status = 'DRAFT';

    const savedBatch = await batch.save();

    await AuditLogService.record({
      actorId: actorId ? new Types.ObjectId(actorId) : undefined,
      actorRole: 'HR_PAYROLL_MANAGER',
      action: 'CREATE',
      targetCollection: 'PayrollBatch',
      targetId: savedBatch._id,
      organizationId: savedBatch.organizationId,
      module: 'HRM',
      diff: { batchCode: savedBatch.batchCode, totalNet: savedBatch.totalNet },
    });

    return savedBatch;
  }

  // ── Review & Approve Batch ──
  public static async updateBatchStatus(
    batchId: string | Types.ObjectId,
    status: 'REVIEWED' | 'APPROVED',
    actorId?: string | Types.ObjectId
  ): Promise<IPayrollBatch> {
    const batch = await PayrollBatchModel.findById(batchId);
    if (!batch) throw new NotFoundError('Payroll batch not found');

    batch.status = status;
    if (status === 'APPROVED' && actorId) {
      batch.approvedBy = new Types.ObjectId(actorId);
    }

    const saved = await batch.save();

    await AuditLogService.record({
      actorId: actorId ? new Types.ObjectId(actorId) : undefined,
      actorRole: 'HR_DIRECTOR',
      action: status === 'APPROVED' ? 'APPROVE' : 'UPDATE',
      targetCollection: 'PayrollBatch',
      targetId: saved._id,
      organizationId: saved.organizationId,
      module: 'HRM',
      diff: { status },
    });

    return saved;
  }

  // ── Post Payroll Accrual to General Ledger ──
  public static async postPayrollToGl(
    batchId: string | Types.ObjectId,
    actorId?: string | Types.ObjectId
  ): Promise<{ journalRef: string; batch: IPayrollBatch }> {
    const batch = await PayrollBatchModel.findById(batchId);
    if (!batch) throw new NotFoundError('Payroll batch not found');

    if (batch.status === 'POSTED_GL') {
      throw new ValidationError(`Batch ${batch.batchCode} is already posted to GL with ref ${batch.journalRef}`);
    }

    await this.ensureCoaAccounts();

    const voucherLines: CreateVoucherLineDTO[] = [
      {
        accountCode: PayrollCalculationService.ACCT_SALARIES_EXPENSE,
        debit: batch.totalGross,
        credit: 0,
        description: `Gross Salaries & Allowances for ${batch.monthYear}`,
      },
      {
        accountCode: PayrollCalculationService.ACCT_SALARIES_PAYABLE,
        debit: 0,
        credit: batch.totalNet,
        description: `Net Accrued Salaries Payable for ${batch.monthYear}`,
      },
    ];

    if (batch.totalDeductions > 0) {
      voucherLines.push({
        accountCode: PayrollCalculationService.ACCT_LOAN_RECOVERIES,
        debit: 0,
        credit: batch.totalDeductions,
        description: `Employee Loan & Advance Deductions for ${batch.monthYear}`,
      });
    }

    const result = await AccountingService.createJournalVoucher(
      {
        voucherType: 'JOURNAL',
        sourceDocumentRef: batch.batchCode,
        notes: `Monthly Payroll Accrual for ${batch.monthYear} (${batch.batchCode})`,
        lines: voucherLines,
      },
      actorId ? String(actorId) : '000000000000000000000001'
    );

    batch.status = 'POSTED_GL';
    batch.journalRef = result.journalEntry.voucherNo;
    const savedBatch = await batch.save();

    return { journalRef: result.journalEntry.voucherNo, batch: savedBatch };
  }

  // ── Salary Disbursement / Payment ──
  public static async disburseSalaryPayment(
    batchId: string | Types.ObjectId,
    paymentMethod: 'BANK_TRANSFER' | 'CHEQUE' | 'CASH',
    actorId?: string | Types.ObjectId
  ): Promise<IPayrollBatch> {
    const batch = await PayrollBatchModel.findById(batchId);
    if (!batch) throw new NotFoundError('Payroll batch not found');

    batch.status = 'PAID';
    batch.disbursementDate = new Date();
    batch.paymentMethod = paymentMethod;

    // Mark all payslips as PAID
    await PayslipModel.updateMany(
      { payrollBatchId: batch._id },
      {
        $set: {
          paymentStatus: 'PAID',
          paymentDate: new Date(),
          paymentReference: `${paymentMethod}-${batch.batchCode}`,
        },
      }
    );

    // Also mark recovered advances
    await EmployeeAdvanceModel.updateMany(
      { repaymentMonth: batch.monthYear, status: 'DISBURSED' },
      { $set: { status: 'RECOVERED', recoveredAt: new Date() } }
    );

    // Create payment journal entry (Debit Accrued Salaries, Credit Bank/Cash)
    await this.ensureCoaAccounts();
    await AccountingService.createJournalVoucher(
      {
        voucherType: 'PAYMENT',
        sourceDocumentRef: `PAY-${batch.batchCode}`,
        notes: `Disbursement of Salaries for ${batch.monthYear} via ${paymentMethod}`,
        lines: [
          {
            accountCode: PayrollCalculationService.ACCT_SALARIES_PAYABLE,
            debit: batch.totalNet,
            credit: 0,
            description: `Clearing Salaries Payable for ${batch.monthYear}`,
          },
          {
            accountCode: PayrollCalculationService.ACCT_BANK_CASH,
            debit: 0,
            credit: batch.totalNet,
            description: `Disbursed from Bank/Cash for ${batch.monthYear}`,
          },
        ],
      },
      actorId ? String(actorId) : '000000000000000000000001'
    );

    return await batch.save();
  }

  // ── Detailed Payslip Data for Print ──
  public static async getPayslipPrintData(payslipId: string | Types.ObjectId): Promise<any> {
    const payslip = await PayslipModel.findById(payslipId)
      .populate('employeeId', 'employeeCode department designation personalInfo bankDetails')
      .populate('payrollBatchId', 'batchCode monthYear paymentMethod disbursementDate')
      .lean();

    if (!payslip) throw new NotFoundError('Payslip not found');

    const emp: any = payslip.employeeId;
    const name =
      ((emp?.personalInfo?.firstName || '') + ' ' + (emp?.personalInfo?.lastName || '')).trim() ||
      emp?.employeeCode;

    return {
      payslipNo: payslip.payslipNo,
      monthYear: payslip.monthYear,
      employee: {
        code: emp?.employeeCode,
        name,
        department: emp?.department,
        designation: emp?.designation,
        bankAccount: emp?.bankDetails?.accountNo || 'N/A',
        bankName: emp?.bankDetails?.bankName || 'N/A',
      },
      earnings: [
        { name: 'Basic Salary', amount: payslip.basicSalary },
        ...payslip.allowances,
        ...(payslip.overtimeAmount > 0 ? [{ name: 'Overtime', amount: payslip.overtimeAmount }] : []),
        ...(payslip.bonus > 0 ? [{ name: 'Bonus', amount: payslip.bonus }] : []),
      ],
      deductions: payslip.deductions,
      grossEarnings: payslip.grossEarnings,
      totalDeductions: payslip.totalDeductions,
      netSalary: payslip.netSalary,
      paymentStatus: payslip.paymentStatus,
      paymentDate: payslip.paymentDate,
      company: 'SUN BIRD CORPORATION',
    };
  }
}
