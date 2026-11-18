import { Types } from 'mongoose';
import {
  BankReconciliationModel,
  IBankReconciliation,
  IBankStatementLine,
} from '../models/BankReconciliation';
import { JournalEntryModel } from '../models/JournalEntry';
import { ValidationError, NotFoundError } from '../errors/AppError';

export interface CreateReconciliationDTO {
  organizationId: string | Types.ObjectId;
  bankAccountCode: number;
  bankAccountName: string;
  statementPeriodStart: Date | string;
  statementPeriodEnd: Date | string;
  statementClosingBalance: number;
  statementLines: Array<{
    date: Date | string;
    description: string;
    reference?: string;
    amount: number;
    type: 'DEBIT' | 'CREDIT';
  }>;
  notes?: string;
}

export class BankReconciliationService {
  /**
   * Retrieves bank reconciliation sessions
   */
  public static async getReconciliations(params: {
    organizationId?: string;
    bankAccountCode?: number;
  }): Promise<IBankReconciliation[]> {
    const filter: any = {};
    if (params.organizationId) filter.organizationId = new Types.ObjectId(params.organizationId);
    if (params.bankAccountCode) filter.bankAccountCode = params.bankAccountCode;

    return BankReconciliationModel.find(filter).sort({ statementPeriodEnd: -1 }).lean() as any;
  }

  /**
   * Creates a new Bank Reconciliation session and auto-computes the ledger balance from posted journal entries.
   */
  public static async createReconciliation(
    dto: CreateReconciliationDTO
  ): Promise<IBankReconciliation> {
    const orgId = new Types.ObjectId(dto.organizationId.toString());
    const periodStart = new Date(dto.statementPeriodStart);
    const periodEnd = new Date(dto.statementPeriodEnd);

    // Compute ledger closing balance for this bank account up to periodEnd
    const journals = await JournalEntryModel.find({
      status: 'POSTED',
      transactionDate: { $lte: periodEnd },
      'lines.accountCode': dto.bankAccountCode,
    }).lean();

    let ledgerBalance = 0;
    for (const jv of journals) {
      for (const line of jv.lines) {
        if (line.accountCode === dto.bankAccountCode) {
          ledgerBalance += (line.debit || 0) - (line.credit || 0);
        }
      }
    }

    const statementLines: IBankStatementLine[] = (dto.statementLines || []).map((line, idx) => ({
      lineId: `stmt_${Date.now()}_${idx}`,
      date: new Date(line.date),
      description: line.description,
      reference: line.reference,
      amount: Number(line.amount),
      type: line.type,
      isMatched: false,
    }));

    const difference = Number((dto.statementClosingBalance - ledgerBalance).toFixed(2));

    const recon = await BankReconciliationModel.create({
      organizationId: orgId,
      bankAccountCode: dto.bankAccountCode,
      bankAccountName: dto.bankAccountName,
      statementPeriodStart: periodStart,
      statementPeriodEnd: periodEnd,
      statementClosingBalance: dto.statementClosingBalance,
      ledgerClosingBalance: ledgerBalance,
      difference,
      status: 'DRAFT',
      statementLines,
      notes: dto.notes,
    });

    return recon;
  }

  /**
   * Manually or automatically matches a statement line against a posted Journal Voucher
   */
  public static async matchStatementLine(
    reconId: string,
    lineId: string,
    voucherNo: string
  ): Promise<IBankReconciliation> {
    const recon = await BankReconciliationModel.findById(reconId);
    if (!recon) throw new NotFoundError('Bank Reconciliation', reconId);

    const line = recon.statementLines.find((l) => l.lineId === lineId);
    if (!line) throw new NotFoundError('Statement Line', lineId);

    const jv = await JournalEntryModel.findOne({ voucherNo, status: 'POSTED' });
    if (!jv) throw new NotFoundError('Posted Journal Voucher', voucherNo);

    line.isMatched = true;
    line.matchedVoucherNo = voucherNo;

    // Check if all lines are matched
    const allMatched = recon.statementLines.every((l) => l.isMatched);
    if (allMatched && recon.difference === 0) {
      recon.status = 'IN_REVIEW';
    }

    await recon.save();
    return recon;
  }

  /**
   * Finalizes reconciliation
   */
  public static async finalizeReconciliation(
    reconId: string,
    userId: string | Types.ObjectId
  ): Promise<IBankReconciliation> {
    const recon = await BankReconciliationModel.findById(reconId);
    if (!recon) throw new NotFoundError('Bank Reconciliation', reconId);

    recon.status = 'RECONCILED';
    recon.reconciledBy = new Types.ObjectId(userId.toString());
    recon.reconciledAt = new Date();

    await recon.save();
    return recon;
  }
}
