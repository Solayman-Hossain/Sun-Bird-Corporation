import { Types } from 'mongoose';
import { JournalEntryModel, IJournalEntry } from '../models/JournalEntry';
import { ChartOfAccountsModel } from '../models/ChartOfAccounts';
import { AccountingService } from './AccountingService';
import { ValidationError, NotFoundError } from '../errors/AppError';

export interface CashBankTransactionDTO {
  organizationId?: string | Types.ObjectId;
  transactionType: 'CASH_IN' | 'CASH_OUT' | 'BANK_DEPOSIT' | 'BANK_WITHDRAWAL' | 'BANK_TRANSFER' | 'CASH_TRANSFER';
  transactionDate?: Date | string;
  sourceAccountCode: number;
  destinationAccountCode: number;
  amount: number;
  referenceNumber: string;
  description: string;
  userId: string | Types.ObjectId;
}

export class CashBankService {
  /**
   * Cash Book: Returns all journal ledger entries affecting cash accounts (codes 1000-1009, 1011-1019)
   */
  public static async getCashBook(params: {
    organizationId?: string;
    accountCode?: number;
    startDate?: Date;
    endDate?: Date;
  }): Promise<{
    openingBalance: number;
    closingBalance: number;
    totalDebit: number;
    totalCredit: number;
    entries: Array<{
      voucherNo: string;
      voucherType: string;
      date: Date;
      description: string;
      accountCode: number;
      accountName: string;
      debit: number;
      credit: number;
      runningBalance: number;
      sourceDocumentRef: string;
    }>;
  }> {
    const cashFilter: any = { status: 'POSTED' };
    const dateQuery: any = {};
    if (params.startDate) dateQuery.$gte = new Date(params.startDate);
    if (params.endDate) dateQuery.$lte = new Date(params.endDate);
    if (params.startDate || params.endDate) cashFilter.transactionDate = dateQuery;

    const targetAccountCode = params.accountCode || 1005;

    const journals = await JournalEntryModel.find(cashFilter)
      .sort({ transactionDate: 1, createdAt: 1 })
      .lean();

    let runningBalance = 0;
    let totalDebit = 0;
    let totalCredit = 0;
    const entries: any[] = [];

    for (const jv of journals) {
      for (const line of jv.lines) {
        if (line.accountCode === targetAccountCode) {
          const debit = line.debit || 0;
          const credit = line.credit || 0;
          runningBalance += debit - credit;
          totalDebit += debit;
          totalCredit += credit;

          entries.push({
            voucherNo: jv.voucherNo,
            voucherType: jv.voucherType,
            date: jv.transactionDate,
            description: line.description || jv.description || jv.sourceDocumentRef,
            accountCode: line.accountCode,
            accountName: line.accountName,
            debit,
            credit,
            runningBalance,
            sourceDocumentRef: jv.sourceDocumentRef,
          });
        }
      }
    }

    return {
      openingBalance: 0,
      closingBalance: runningBalance,
      totalDebit,
      totalCredit,
      entries,
    };
  }

  /**
   * Bank Book: Returns all journal ledger entries affecting bank accounts (codes 1010, 1012, etc.)
   */
  public static async getBankBook(params: {
    organizationId?: string;
    accountCode?: number;
    startDate?: Date;
    endDate?: Date;
  }): Promise<{
    openingBalance: number;
    closingBalance: number;
    totalDebit: number;
    totalCredit: number;
    entries: Array<{
      voucherNo: string;
      voucherType: string;
      date: Date;
      description: string;
      accountCode: number;
      accountName: string;
      debit: number;
      credit: number;
      runningBalance: number;
      sourceDocumentRef: string;
    }>;
  }> {
    const bankFilter: any = { status: 'POSTED' };
    const dateQuery: any = {};
    if (params.startDate) dateQuery.$gte = new Date(params.startDate);
    if (params.endDate) dateQuery.$lte = new Date(params.endDate);
    if (params.startDate || params.endDate) bankFilter.transactionDate = dateQuery;

    const targetAccountCode = params.accountCode || 1010;

    const journals = await JournalEntryModel.find(bankFilter)
      .sort({ transactionDate: 1, createdAt: 1 })
      .lean();

    let runningBalance = 0;
    let totalDebit = 0;
    let totalCredit = 0;
    const entries: any[] = [];

    for (const jv of journals) {
      for (const line of jv.lines) {
        if (line.accountCode === targetAccountCode) {
          const debit = line.debit || 0;
          const credit = line.credit || 0;
          runningBalance += debit - credit;
          totalDebit += debit;
          totalCredit += credit;

          entries.push({
            voucherNo: jv.voucherNo,
            voucherType: jv.voucherType,
            date: jv.transactionDate,
            description: line.description || jv.description || jv.sourceDocumentRef,
            accountCode: line.accountCode,
            accountName: line.accountName,
            debit,
            credit,
            runningBalance,
            sourceDocumentRef: jv.sourceDocumentRef,
          });
        }
      }
    }

    return {
      openingBalance: 0,
      closingBalance: runningBalance,
      totalDebit,
      totalCredit,
      entries,
    };
  }

  /**
   * Records a cash/bank movement or transfer creating a balanced CONTRA or PAYMENT journal voucher.
   */
  public static async recordCashBankTransaction(
    dto: CashBankTransactionDTO
  ): Promise<{ journalEntry: IJournalEntry }> {
    if (dto.amount <= 0) {
      throw new ValidationError('Transaction amount must be strictly positive');
    }
    if (dto.sourceAccountCode === dto.destinationAccountCode) {
      throw new ValidationError('Source and destination accounts must be distinct');
    }

    const [srcCoa, destCoa] = await Promise.all([
      ChartOfAccountsModel.findOne({ accountCode: dto.sourceAccountCode, isActive: true }),
      ChartOfAccountsModel.findOne({ accountCode: dto.destinationAccountCode, isActive: true }),
    ]);

    if (!srcCoa) throw new NotFoundError(`Source account code ${dto.sourceAccountCode} not found in COA`);
    if (!destCoa) throw new NotFoundError(`Destination account code ${dto.destinationAccountCode} not found in COA`);

    const isContra =
      (srcCoa.accountCode === 1005 && destCoa.accountCode === 1010) ||
      (srcCoa.accountCode === 1010 && destCoa.accountCode === 1005) ||
      (srcCoa.accountType === 'ASSET' && destCoa.accountType === 'ASSET');

    const voucherType = isContra ? 'CONTRA' : 'PAYMENT';

    // Debit destination (receiving account increases), Credit source (disbursing account decreases)
    const result = await AccountingService.createJournalVoucher(
      {
        voucherType,
        transactionDate: dto.transactionDate || new Date(),
        sourceDocumentRef: dto.referenceNumber || `CB-${Date.now()}`,
        lines: [
          {
            accountCode: destCoa.accountCode,
            accountName: destCoa.accountName,
            debit: dto.amount,
            credit: 0,
            description: dto.description || `${dto.transactionType} to ${destCoa.accountName}`,
          },
          {
            accountCode: srcCoa.accountCode,
            accountName: srcCoa.accountName,
            debit: 0,
            credit: dto.amount,
            description: dto.description || `${dto.transactionType} from ${srcCoa.accountName}`,
          },
        ],
        notes: dto.description,
      },
      dto.userId
    );

    return { journalEntry: result.journalEntry };
  }
}
