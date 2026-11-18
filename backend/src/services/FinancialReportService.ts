import { Types } from 'mongoose';
import { JournalEntryModel } from '../models/JournalEntry';
import { ChartOfAccountsModel, IChartOfAccounts, AccountType, NormalBalance } from '../models/ChartOfAccounts';
import { ValidationError, NotFoundError } from '../errors/AppError';
import logger from '../config/logger';

export interface TrialBalanceItem {
  accountCode: number;
  accountName: string;
  accountType: AccountType;
  normalBalance: NormalBalance;
  totalDebit: number;
  totalCredit: number;
  netDebit: number;
  netCredit: number;
}

export interface TrialBalanceReport {
  period: {
    startDate?: Date;
    endDate?: Date;
  };
  accounts: TrialBalanceItem[];
  totalDebit: number;
  totalCredit: number;
  totalNetDebit: number;
  totalNetCredit: number;
  isBalanced: boolean;
  difference: number;
  generatedAt: Date;
}

export interface ProfitAndLossLineItem {
  accountCode: number;
  accountName: string;
  amount: number;
}

export interface ProfitAndLossReport {
  period: {
    startDate?: Date;
    endDate?: Date;
  };
  revenue: {
    items: ProfitAndLossLineItem[];
    totalRevenue: number;
  };
  cogs: {
    items: ProfitAndLossLineItem[];
    totalCogs: number;
  };
  grossProfit: number;
  operatingExpenses: {
    items: ProfitAndLossLineItem[];
    totalOperatingExpenses: number;
  };
  netOperatingProfit: number;
  generatedAt: Date;
}

export interface BalanceSheetLineItem {
  accountCode: number;
  accountName: string;
  amount: number;
}

export interface BalanceSheetReport {
  asOfDate: Date;
  assets: {
    items: BalanceSheetLineItem[];
    totalAssets: number;
  };
  liabilities: {
    items: BalanceSheetLineItem[];
    totalLiabilities: number;
  };
  equity: {
    items: BalanceSheetLineItem[];
    totalEquity: number;
  };
  currentPeriodNetProfit: number;
  totalLiabilitiesAndEquity: number;
  isBalanced: boolean;
  difference: number;
  generatedAt: Date;
}

export interface GeneralLedgerEntry {
  voucherId: Types.ObjectId;
  voucherNo: string;
  voucherType: string;
  transactionDate: Date;
  sourceDocumentRef: string;
  description?: string;
  debit: number;
  credit: number;
  runningBalance: number;
}

export interface CashFlowStatementReport {
  period: {
    startDate?: Date;
    endDate?: Date;
  };
  operatingActivities: {
    netProfit: number;
    depreciation: number;
    changeInReceivables: number;
    changeInInventory: number;
    changeInPayables: number;
    totalOperatingCashFlow: number;
  };
  investingActivities: {
    fixedAssetPurchases: number;
    totalInvestingCashFlow: number;
  };
  financingActivities: {
    partnerCapitalInflow: number;
    partnerDrawingsOutflow: number;
    loanNetMovement: number;
    totalFinancingCashFlow: number;
  };
  netCashFlow: number;
  openingCashBalance: number;
  closingCashBalance: number;
  generatedAt: Date;
}

export interface FinancialAnalysisReport {
  asOfDate: Date;
  ratios: {
    currentRatio: number;
    quickRatio: number;
    grossProfitMargin: number;
    netProfitMargin: number;
    operatingMargin: number;
    debtToEquityRatio: number;
    workingCapital: number;
  };
  summary: {
    totalRevenue: number;
    totalExpenses: number;
    netProfit: number;
    totalAssets: number;
    totalLiabilities: number;
    totalEquity: number;
  };
  definitions: Record<string, string>;
  generatedAt: Date;
}

export interface GeneralLedgerReport {
  accountCode: number;
  accountName: string;
  accountType: AccountType;
  normalBalance: NormalBalance;
  period: {
    startDate?: Date;
    endDate?: Date;
  };
  openingBalance: number;
  entries: GeneralLedgerEntry[];
  periodTotalDebit: number;
  periodTotalCredit: number;
  closingBalance: number;
  generatedAt: Date;
}

export class FinancialReportService {
  /**
   * Helper to normalize date ranges.
   */
  private static normalizeDateRange(startDate?: Date | string, endDate?: Date | string): {
    start?: Date;
    end?: Date;
    matchQuery: any;
  } {
    const matchQuery: any = { status: 'POSTED' };

    let start: Date | undefined;
    let end: Date | undefined;

    if (startDate) {
      start = new Date(startDate);
      if (isNaN(start.getTime())) throw new ValidationError('Invalid startDate parameter');
    }

    if (endDate) {
      end = new Date(endDate);
      if (isNaN(end.getTime())) throw new ValidationError('Invalid endDate parameter');
      // If no time is specified, include the entire end date day
      if (typeof endDate === 'string' && !endDate.includes('T') && !endDate.includes(':')) {
        end.setHours(23, 59, 59, 999);
      }
    }

    if (start || end) {
      matchQuery.transactionDate = {};
      if (start) matchQuery.transactionDate.$gte = start;
      if (end) matchQuery.transactionDate.$lte = end;
    }

    return { start, end, matchQuery };
  }

  /**
   * Trial Balance: Aggregates lines of all POSTED journal entries.
   * Computes sum of net debit and net credit per account code (1010 to 6510).
   * Asserts total debits equal total credits.
   */
  public static async getTrialBalance(
    startDate?: Date | string,
    endDate?: Date | string
  ): Promise<TrialBalanceReport> {
    const { start, end, matchQuery } = this.normalizeDateRange(startDate, endDate);

    // 1. Aggregate posted journal entry lines
    const aggregatedLines = await JournalEntryModel.aggregate<{
      _id: number;
      accountName?: string;
      totalDebit: number;
      totalCredit: number;
    }>([
      { $match: matchQuery },
      { $unwind: '$lines' },
      {
        $group: {
          _id: '$lines.accountCode',
          accountName: { $first: '$lines.accountName' },
          totalDebit: { $sum: '$lines.debit' },
          totalCredit: { $sum: '$lines.credit' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // 2. Fetch Chart of Accounts metadata for all referenced accounts (or all COA)
    const coaList = await ChartOfAccountsModel.find({}).lean();
    const coaMap = new Map<number, IChartOfAccounts>();
    coaList.forEach((coa) => coaMap.set(coa.accountCode, coa as any));

    let grandTotalDebit = 0;
    let grandTotalCredit = 0;
    let totalNetDebit = 0;
    let totalNetCredit = 0;

    const accounts: TrialBalanceItem[] = aggregatedLines.map((agg) => {
      const accountCode = agg._id;
      const coa = coaMap.get(accountCode);

      // Default fallback categorization if not in master
      let accountType: AccountType = 'ASSET';
      let normalBalance: NormalBalance = 'DEBIT';

      if (coa) {
        accountType = coa.accountType;
        normalBalance = coa.normalBalance;
      } else {
        if (accountCode >= 1000 && accountCode < 2000) {
          accountType = 'ASSET';
          normalBalance = 'DEBIT';
        } else if (accountCode >= 2000 && accountCode < 3000) {
          accountType = 'LIABILITY';
          normalBalance = 'CREDIT';
        } else if (accountCode >= 3000 && accountCode < 4000) {
          accountType = 'EQUITY';
          normalBalance = 'CREDIT';
        } else if (accountCode >= 4000 && accountCode < 5000) {
          accountType = 'REVENUE';
          normalBalance = 'CREDIT';
        } else if (accountCode >= 5000 && accountCode < 6000) {
          accountType = 'EXPENSE';
          normalBalance = 'DEBIT';
        } else if (accountCode >= 6000 && accountCode < 7000) {
          accountType = 'EXPENSE';
          normalBalance = 'DEBIT';
        }
      }

      const rawDebit = Number(agg.totalDebit.toFixed(2));
      const rawCredit = Number(agg.totalCredit.toFixed(2));

      grandTotalDebit += rawDebit;
      grandTotalCredit += rawCredit;

      // Calculate Net Debit or Net Credit for Trial Balance presentation
      let netDebit = 0;
      let netCredit = 0;

      if (rawDebit >= rawCredit) {
        netDebit = Number((rawDebit - rawCredit).toFixed(2));
      } else {
        netCredit = Number((rawCredit - rawDebit).toFixed(2));
      }

      totalNetDebit += netDebit;
      totalNetCredit += netCredit;

      return {
        accountCode,
        accountName: agg.accountName || coa?.accountName || `Account ${accountCode}`,
        accountType,
        normalBalance,
        totalDebit: rawDebit,
        totalCredit: rawCredit,
        netDebit,
        netCredit,
      };
    });

    grandTotalDebit = Number(grandTotalDebit.toFixed(2));
    grandTotalCredit = Number(grandTotalCredit.toFixed(2));
    totalNetDebit = Number(totalNetDebit.toFixed(2));
    totalNetCredit = Number(totalNetCredit.toFixed(2));

    const difference = Number(Math.abs(totalNetDebit - totalNetCredit).toFixed(2));
    const isBalanced = difference < 0.01;

    return {
      period: {
        startDate: start,
        endDate: end,
      },
      accounts,
      totalDebit: grandTotalDebit,
      totalCredit: grandTotalCredit,
      totalNetDebit,
      totalNetCredit,
      isBalanced,
      difference,
      generatedAt: new Date(),
    };
  }

  /**
   * Profit & Loss (Income Statement):
   * - Revenue (4000s) minus Cost of Goods Sold (5000s / 5010) = Gross Profit
   * - Gross Profit minus Operating Expenses (6000s) = Net Operating Profit
   */
  public static async getProfitAndLoss(
    startDate?: Date | string,
    endDate?: Date | string
  ): Promise<ProfitAndLossReport> {
    const { start, end, matchQuery } = this.normalizeDateRange(startDate, endDate);

    // 1. Fetch COA map for metadata categorization
    const coaList = await ChartOfAccountsModel.find({}).lean();
    const coaMap = new Map<number, IChartOfAccounts>();
    coaList.forEach((coa) => coaMap.set(coa.accountCode, coa as any));

    // 2. Aggregate all lines for POSTED vouchers within period
    const aggregatedLines = await JournalEntryModel.aggregate<{
      _id: number;
      accountName?: string;
      totalDebit: number;
      totalCredit: number;
    }>([
      { $match: matchQuery },
      { $unwind: '$lines' },
      {
        $group: {
          _id: '$lines.accountCode',
          accountName: { $first: '$lines.accountName' },
          totalDebit: { $sum: '$lines.debit' },
          totalCredit: { $sum: '$lines.credit' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const revenueItems: ProfitAndLossLineItem[] = [];
    const cogsItems: ProfitAndLossLineItem[] = [];
    const opexItems: ProfitAndLossLineItem[] = [];

    let totalRevenue = 0;
    let totalCogs = 0;
    let totalOperatingExpenses = 0;

    aggregatedLines.forEach((agg) => {
      const code = agg._id;
      const coa = coaMap.get(code);
      const name = agg.accountName || coa?.accountName || `Account ${code}`;

      // Determine category:
      const isRevenue =
        coa?.accountType === 'REVENUE' ||
        (code >= 4000 && code < 5000) ||
        (code >= 400000 && code < 500000);

      const isCogs =
        (code >= 5000 && code < 6000) ||
        (code >= 500000 && code < 600000) ||
        code === 5010 ||
        (coa?.accountType === 'EXPENSE' &&
          (coa.accountName.toLowerCase().includes('cost of goods') ||
            coa.accountName.toLowerCase().includes('cogs') ||
            coa.accountName.toLowerCase().includes('purchase cost')));

      const isOpex =
        !isCogs &&
        (coa?.accountType === 'EXPENSE' ||
          (code >= 6000 && code < 7000) ||
          (code >= 600000 && code < 700000));

      if (isRevenue) {
        // Revenue normal balance is CREDIT: Revenue = Credit - Debit
        const netRevenue = Number((agg.totalCredit - agg.totalDebit).toFixed(2));
        revenueItems.push({ accountCode: code, accountName: name, amount: netRevenue });
        totalRevenue += netRevenue;
      } else if (isCogs) {
        // COGS normal balance is DEBIT: COGS = Debit - Credit
        const netCogs = Number((agg.totalDebit - agg.totalCredit).toFixed(2));
        cogsItems.push({ accountCode: code, accountName: name, amount: netCogs });
        totalCogs += netCogs;
      } else if (isOpex) {
        // Operating Expenses normal balance is DEBIT: OpEx = Debit - Credit
        const netOpex = Number((agg.totalDebit - agg.totalCredit).toFixed(2));
        opexItems.push({ accountCode: code, accountName: name, amount: netOpex });
        totalOperatingExpenses += netOpex;
      }
    });

    totalRevenue = Number(totalRevenue.toFixed(2));
    totalCogs = Number(totalCogs.toFixed(2));
    totalOperatingExpenses = Number(totalOperatingExpenses.toFixed(2));

    const grossProfit = Number((totalRevenue - totalCogs).toFixed(2));
    const netOperatingProfit = Number((grossProfit - totalOperatingExpenses).toFixed(2));

    return {
      period: {
        startDate: start,
        endDate: end,
      },
      revenue: {
        items: revenueItems,
        totalRevenue,
      },
      cogs: {
        items: cogsItems,
        totalCogs,
      },
      grossProfit,
      operatingExpenses: {
        items: opexItems,
        totalOperatingExpenses,
      },
      netOperatingProfit,
      generatedAt: new Date(),
    };
  }

  /**
   * Balance Sheet:
   * Assets (1000s) = Liabilities (2000s) + Equity (3000s) + Current Period Net Profit.
   */
  public static async getBalanceSheet(asOfDate?: Date | string): Promise<BalanceSheetReport> {
    const targetDate = asOfDate ? new Date(asOfDate) : new Date();
    if (isNaN(targetDate.getTime())) {
      throw new ValidationError('Invalid asOfDate parameter');
    }

    const matchQuery: any = {
      status: 'POSTED',
      transactionDate: { $lte: targetDate },
    };

    // 1. Fetch COA map for metadata categorization
    const coaList = await ChartOfAccountsModel.find({}).lean();
    const coaMap = new Map<number, IChartOfAccounts>();
    coaList.forEach((coa) => coaMap.set(coa.accountCode, coa as any));

    // 2. Aggregate all lines up to targetDate
    const aggregatedLines = await JournalEntryModel.aggregate<{
      _id: number;
      accountName?: string;
      totalDebit: number;
      totalCredit: number;
    }>([
      { $match: matchQuery },
      { $unwind: '$lines' },
      {
        $group: {
          _id: '$lines.accountCode',
          accountName: { $first: '$lines.accountName' },
          totalDebit: { $sum: '$lines.debit' },
          totalCredit: { $sum: '$lines.credit' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const assetItems: BalanceSheetLineItem[] = [];
    const liabilityItems: BalanceSheetLineItem[] = [];
    const equityItems: BalanceSheetLineItem[] = [];

    let totalAssets = 0;
    let totalLiabilities = 0;
    let totalEquity = 0;

    let cumulativeRevenue = 0;
    let cumulativeExpenses = 0;

    aggregatedLines.forEach((agg) => {
      const code = agg._id;
      const coa = coaMap.get(code);
      const name = agg.accountName || coa?.accountName || `Account ${code}`;

      const isAsset =
        coa?.accountType === 'ASSET' ||
        (code >= 1000 && code < 2000) ||
        (code >= 100000 && code < 200000);

      const isLiability =
        coa?.accountType === 'LIABILITY' ||
        (code >= 2000 && code < 3000) ||
        (code >= 200000 && code < 300000);

      const isEquity =
        coa?.accountType === 'EQUITY' ||
        (code >= 3000 && code < 4000) ||
        (code >= 300000 && code < 400000);

      const isRevenue =
        coa?.accountType === 'REVENUE' ||
        (code >= 4000 && code < 5000) ||
        (code >= 400000 && code < 500000);

      const isExpense =
        coa?.accountType === 'EXPENSE' ||
        (code >= 5000 && code < 7000) ||
        (code >= 500000 && code < 700000);

      if (isAsset) {
        // Asset normal balance is DEBIT: Asset = Debit - Credit
        const netAsset = Number((agg.totalDebit - agg.totalCredit).toFixed(2));
        assetItems.push({ accountCode: code, accountName: name, amount: netAsset });
        totalAssets += netAsset;
      } else if (isLiability) {
        // Liability normal balance is CREDIT: Liability = Credit - Debit
        const netLiability = Number((agg.totalCredit - agg.totalDebit).toFixed(2));
        liabilityItems.push({ accountCode: code, accountName: name, amount: netLiability });
        totalLiabilities += netLiability;
      } else if (isEquity) {
        // Equity normal balance is CREDIT: Equity = Credit - Debit
        const netEquity = Number((agg.totalCredit - agg.totalDebit).toFixed(2));
        equityItems.push({ accountCode: code, accountName: name, amount: netEquity });
        totalEquity += netEquity;
      } else if (isRevenue) {
        // Revenue credits
        cumulativeRevenue += agg.totalCredit - agg.totalDebit;
      } else if (isExpense) {
        // COGS and Operating Expense debits
        cumulativeExpenses += agg.totalDebit - agg.totalCredit;
      }
    });

    totalAssets = Number(totalAssets.toFixed(2));
    totalLiabilities = Number(totalLiabilities.toFixed(2));
    totalEquity = Number(totalEquity.toFixed(2));

    const currentPeriodNetProfit = Number((cumulativeRevenue - cumulativeExpenses).toFixed(2));
    const totalLiabilitiesAndEquity = Number(
      (totalLiabilities + totalEquity + currentPeriodNetProfit).toFixed(2)
    );

    const difference = Number(Math.abs(totalAssets - totalLiabilitiesAndEquity).toFixed(2));
    const isBalanced = difference < 0.01;

    return {
      asOfDate: targetDate,
      assets: {
        items: assetItems,
        totalAssets,
      },
      liabilities: {
        items: liabilityItems,
        totalLiabilities,
      },
      equity: {
        items: equityItems,
        totalEquity,
      },
      currentPeriodNetProfit,
      totalLiabilitiesAndEquity,
      isBalanced,
      difference,
      generatedAt: new Date(),
    };
  }

  /**
   * General Ledger Drilldown:
   * Detailed chronological listing of all voucher lines impacting the account with running balance.
   */
  public static async getGeneralLedgerDrilldown(
    accountCode: number,
    startDate?: Date | string,
    endDate?: Date | string
  ): Promise<GeneralLedgerReport> {
    const code = Number(accountCode);
    if (!code || isNaN(code)) {
      throw new ValidationError('Valid numeric accountCode is required');
    }

    const coa = await ChartOfAccountsModel.findOne({ accountCode: code }).lean();
    let accountName = coa?.accountName || `Account ${code}`;
    let accountType: AccountType = coa?.accountType || 'ASSET';
    let normalBalance: NormalBalance = coa?.normalBalance || 'DEBIT';

    if (!coa) {
      if (code >= 2000 && code < 4000) {
        normalBalance = 'CREDIT';
        accountType = code < 3000 ? 'LIABILITY' : 'EQUITY';
      } else if (code >= 4000 && code < 5000) {
        normalBalance = 'CREDIT';
        accountType = 'REVENUE';
      } else if (code >= 5000) {
        normalBalance = 'DEBIT';
        accountType = 'EXPENSE';
      }
    }

    const { start, end } = this.normalizeDateRange(startDate, endDate);

    // 1. Calculate opening balance before startDate if startDate is specified
    let openingBalance = 0;
    if (start) {
      const openingAgg = await JournalEntryModel.aggregate<{
        totalDebit: number;
        totalCredit: number;
      }>([
        {
          $match: {
            status: 'POSTED',
            transactionDate: { $lt: start },
            'lines.accountCode': code,
          },
        },
        { $unwind: '$lines' },
        {
          $match: {
            'lines.accountCode': code,
          },
        },
        {
          $group: {
            _id: null,
            totalDebit: { $sum: '$lines.debit' },
            totalCredit: { $sum: '$lines.credit' },
          },
        },
      ]);

      if (openingAgg.length > 0) {
        const d = openingAgg[0].totalDebit;
        const c = openingAgg[0].totalCredit;
        openingBalance = normalBalance === 'DEBIT' ? d - c : c - d;
      }
    }

    openingBalance = Number(openingBalance.toFixed(2));

    // 2. Fetch period journal entries affecting this account code
    const periodMatch: any = {
      status: 'POSTED',
      'lines.accountCode': code,
    };
    if (start || end) {
      periodMatch.transactionDate = {};
      if (start) periodMatch.transactionDate.$gte = start;
      if (end) periodMatch.transactionDate.$lte = end;
    }

    const vouchers = await JournalEntryModel.find(periodMatch)
      .sort({ transactionDate: 1, createdAt: 1 })
      .lean();

    let currentBalance = openingBalance;
    let periodTotalDebit = 0;
    let periodTotalCredit = 0;

    const entries: GeneralLedgerEntry[] = [];

    for (const voucher of vouchers) {
      for (const line of voucher.lines) {
        if (line.accountCode === code) {
          const debit = Number((line.debit || 0).toFixed(2));
          const credit = Number((line.credit || 0).toFixed(2));

          periodTotalDebit += debit;
          periodTotalCredit += credit;

          if (normalBalance === 'DEBIT') {
            currentBalance += debit - credit;
          } else {
            currentBalance += credit - debit;
          }

          entries.push({
            voucherId: voucher._id,
            voucherNo: voucher.voucherNo,
            voucherType: voucher.voucherType,
            transactionDate: voucher.transactionDate,
            sourceDocumentRef: voucher.sourceDocumentRef,
            description: line.description || undefined,
            debit,
            credit,
            runningBalance: Number(currentBalance.toFixed(2)),
          });
        }
      }
    }

    periodTotalDebit = Number(periodTotalDebit.toFixed(2));
    periodTotalCredit = Number(periodTotalCredit.toFixed(2));
    const closingBalance = Number(currentBalance.toFixed(2));

    return {
      accountCode: code,
      accountName,
      accountType,
      normalBalance,
      period: {
        startDate: start,
        endDate: end,
      },
      openingBalance,
      entries,
      periodTotalDebit,
      periodTotalCredit,
      closingBalance,
      generatedAt: new Date(),
    };
  }

  /**
   * Cash Flow Statement: Operating, Investing, and Financing activities computed from posted journal entries.
   */
  public static async getCashFlowStatement(
    startDate?: Date | string,
    endDate?: Date | string
  ): Promise<CashFlowStatementReport> {
    const { start, end } = this.normalizeDateRange(startDate, endDate);

    // 1. Get P&L for base net profit
    const pnl = await this.getProfitAndLoss(start, end);
    const netProfit = pnl.netOperatingProfit || 0;

    // 2. Query posted journals for movements
    const match: any = { status: 'POSTED' };
    if (start || end) {
      match.transactionDate = {};
      if (start) match.transactionDate.$gte = start;
      if (end) match.transactionDate.$lte = end;
    }

    const journals = await JournalEntryModel.find(match).lean();

    let changeInAR = 0;
    let changeInInventory = 0;
    let changeInAP = 0;
    let fixedAssetPurchases = 0;
    let partnerCapitalInflow = 0;
    let partnerDrawingsOutflow = 0;
    let loanNetMovement = 0;

    for (const jv of journals) {
      for (const line of jv.lines) {
        // Accounts Receivable (1020)
        if (line.accountCode === 1020) {
          // Increase in AR is an outflow of operating cash: -(Debit - Credit)
          changeInAR -= (line.debit || 0) - (line.credit || 0);
        }
        // Inventory (1050)
        else if (line.accountCode === 1050) {
          // Increase in Inventory is an outflow: -(Debit - Credit)
          changeInInventory -= (line.debit || 0) - (line.credit || 0);
        }
        // Accounts Payable (2010)
        else if (line.accountCode === 2010) {
          // Increase in AP is a source of operating cash: +(Credit - Debit)
          changeInAP += (line.credit || 0) - (line.debit || 0);
        }
        // Fixed Assets (1200 - 1299)
        else if (line.accountCode >= 1200 && line.accountCode <= 1299) {
          fixedAssetPurchases += (line.debit || 0) - (line.credit || 0);
        }
        // Partner Capital (3001)
        else if (line.accountCode === 3001) {
          partnerCapitalInflow += (line.credit || 0) - (line.debit || 0);
        }
        // Partner Drawings (3002)
        else if (line.accountCode === 3002) {
          partnerDrawingsOutflow += (line.debit || 0) - (line.credit || 0);
        }
        // Loans (2020)
        else if (line.accountCode === 2020) {
          loanNetMovement += (line.credit || 0) - (line.debit || 0);
        }
      }
    }

    const depreciation = 0; // Derived if recorded
    const totalOperating = Number(
      (netProfit + depreciation + changeInAR + changeInInventory + changeInAP).toFixed(2)
    );
    const totalInvesting = Number((-fixedAssetPurchases).toFixed(2));
    const totalFinancing = Number(
      (partnerCapitalInflow - partnerDrawingsOutflow + loanNetMovement).toFixed(2)
    );

    const netCashFlow = Number((totalOperating + totalInvesting + totalFinancing).toFixed(2));

    // Get current cash & bank balance from Trial Balance
    const tb = await this.getTrialBalance(undefined, end);
    let closingCash = 0;
    for (const acc of tb.accounts) {
      if (acc.accountCode === 1005 || acc.accountCode === 1010) {
        closingCash += acc.netDebit - acc.netCredit;
      }
    }
    const openingCash = Number((closingCash - netCashFlow).toFixed(2));

    return {
      period: { startDate: start, endDate: end },
      operatingActivities: {
        netProfit,
        depreciation,
        changeInReceivables: Number(changeInAR.toFixed(2)),
        changeInInventory: Number(changeInInventory.toFixed(2)),
        changeInPayables: Number(changeInAP.toFixed(2)),
        totalOperatingCashFlow: totalOperating,
      },
      investingActivities: {
        fixedAssetPurchases: Number(fixedAssetPurchases.toFixed(2)),
        totalInvestingCashFlow: totalInvesting,
      },
      financingActivities: {
        partnerCapitalInflow: Number(partnerCapitalInflow.toFixed(2)),
        partnerDrawingsOutflow: Number(partnerDrawingsOutflow.toFixed(2)),
        loanNetMovement: Number(loanNetMovement.toFixed(2)),
        totalFinancingCashFlow: totalFinancing,
      },
      netCashFlow,
      openingCashBalance: openingCash,
      closingCashBalance: Number(closingCash.toFixed(2)),
      generatedAt: new Date(),
    };
  }

  /**
   * Financial Analysis: Real-time calculation of key financial performance ratios
   */
  public static async getFinancialAnalysis(asOfDate?: Date | string): Promise<FinancialAnalysisReport> {
    const date = asOfDate ? new Date(asOfDate) : new Date();
    const [bs, pnl] = await Promise.all([
      this.getBalanceSheet(date),
      this.getProfitAndLoss(undefined, date),
    ]);

    const totalRevenue = pnl.revenue.totalRevenue || 0;
    const totalExpenses = (pnl.cogs.totalCogs || 0) + (pnl.operatingExpenses.totalOperatingExpenses || 0);
    const netProfit = pnl.netOperatingProfit || 0;
    const grossProfit = pnl.grossProfit || 0;

    const totalAssets = bs.assets.totalAssets || 0;
    const totalLiabilities = bs.liabilities.totalLiabilities || 0;
    const totalEquity = bs.equity.totalEquity || 0;

    // Filter current assets and current liabilities
    let currentAssets = 0;
    let quickAssets = 0;
    for (const a of bs.assets.items) {
      if (a.accountCode >= 1000 && a.accountCode < 1200) {
        currentAssets += a.amount;
        if (a.accountCode !== 1050) { // Exclude inventory for quick assets
          quickAssets += a.amount;
        }
      }
    }

    let currentLiabilities = 0;
    for (const l of bs.liabilities.items) {
      if (l.accountCode >= 2000 && l.accountCode < 2200) {
        currentLiabilities += l.amount;
      }
    }

    const currentRatio = currentLiabilities > 0 ? Number((currentAssets / currentLiabilities).toFixed(2)) : 0;
    const quickRatio = currentLiabilities > 0 ? Number((quickAssets / currentLiabilities).toFixed(2)) : 0;
    const grossProfitMargin = totalRevenue > 0 ? Number(((grossProfit / totalRevenue) * 100).toFixed(2)) : 0;
    const netProfitMargin = totalRevenue > 0 ? Number(((netProfit / totalRevenue) * 100).toFixed(2)) : 0;
    const operatingMargin = totalRevenue > 0 ? Number(((netProfit / totalRevenue) * 100).toFixed(2)) : 0;
    const debtToEquityRatio = totalEquity > 0 ? Number((totalLiabilities / totalEquity).toFixed(2)) : 0;
    const workingCapital = Number((currentAssets - currentLiabilities).toFixed(2));

    return {
      asOfDate: date,
      ratios: {
        currentRatio,
        quickRatio,
        grossProfitMargin,
        netProfitMargin,
        operatingMargin,
        debtToEquityRatio,
        workingCapital,
      },
      summary: {
        totalRevenue,
        totalExpenses,
        netProfit,
        totalAssets,
        totalLiabilities,
        totalEquity,
      },
      definitions: {
        currentRatio: 'Current Assets / Current Liabilities (Liquidity benchmark: ≥ 1.5)',
        quickRatio: '(Cash + Receivables) / Current Liabilities (Acid-test liquidity)',
        grossProfitMargin: '(Gross Profit / Total Revenue) * 100',
        netProfitMargin: '(Net Profit / Total Revenue) * 100',
        debtToEquityRatio: 'Total Liabilities / Total Equity (Leverage risk)',
        workingCapital: 'Current Assets - Current Liabilities (Short-term capital buffer)',
      },
      generatedAt: new Date(),
    };
  }
}

export default FinancialReportService;
