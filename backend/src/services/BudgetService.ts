import { Types } from 'mongoose';
import { BudgetModel, IBudget, BudgetType } from '../models/Budget';
import { JournalEntryModel } from '../models/JournalEntry';
import { ChartOfAccountsModel } from '../models/ChartOfAccounts';
import { ValidationError, NotFoundError } from '../errors/AppError';

export interface CreateBudgetDTO {
  organizationId: string | Types.ObjectId;
  fiscalYear: string;
  budgetName: string;
  budgetType?: BudgetType;
  accountCode: number;
  department?: string;
  costCenter?: string;
  allocatedAmount: number;
  notes?: string;
}

export class BudgetService {
  /**
   * Retrieves budgets for an organization and fiscal year
   */
  public static async getBudgets(params: {
    organizationId?: string;
    fiscalYear?: string;
  }): Promise<IBudget[]> {
    const filter: any = {};
    if (params.organizationId) filter.organizationId = new Types.ObjectId(params.organizationId);
    if (params.fiscalYear) filter.fiscalYear = params.fiscalYear;

    return BudgetModel.find(filter).sort({ accountCode: 1 }).lean() as any;
  }

  /**
   * Creates a new Budget entry
   */
  public static async createBudget(dto: CreateBudgetDTO): Promise<IBudget> {
    if (dto.allocatedAmount < 0) {
      throw new ValidationError('Allocated budget amount cannot be negative');
    }

    const coa = await ChartOfAccountsModel.findOne({ accountCode: dto.accountCode, isActive: true });
    if (!coa) throw new NotFoundError('Chart of Accounts', String(dto.accountCode));

    const budget = await BudgetModel.create({
      organizationId: new Types.ObjectId(dto.organizationId.toString()),
      fiscalYear: dto.fiscalYear,
      budgetName: dto.budgetName,
      budgetType: dto.budgetType || 'ANNUAL',
      accountCode: dto.accountCode,
      accountName: coa.accountName,
      department: dto.department,
      costCenter: dto.costCenter,
      allocatedAmount: dto.allocatedAmount,
      notes: dto.notes,
      status: 'DRAFT',
    });

    return budget;
  }

  /**
   * Approves a budget
   */
  public static async approveBudget(
    budgetId: string,
    userId: string | Types.ObjectId
  ): Promise<IBudget> {
    const budget = await BudgetModel.findById(budgetId);
    if (!budget) throw new NotFoundError('Budget', budgetId);

    budget.status = 'APPROVED';
    budget.approvedBy = new Types.ObjectId(userId.toString());
    budget.approvedAt = new Date();
    await budget.save();

    return budget;
  }

  /**
   * Budget vs Actual: Compares allocated budgets with real posted journal line expenditures
   */
  public static async getBudgetVsActual(params: {
    organizationId?: string;
    fiscalYear?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<{
    fiscalYear: string;
    totalBudget: number;
    totalActual: number;
    totalVariance: number;
    items: Array<{
      budgetId: string;
      budgetName: string;
      accountCode: number;
      accountName: string;
      department?: string;
      budgetAmount: number;
      actualAmount: number;
      variance: number; // actual - budget
      variancePercentage: number;
      utilizationPercentage: number;
      status: string;
    }>;
  }> {
    const fiscalYear = params.fiscalYear || String(new Date().getFullYear());
    const filter: any = { fiscalYear };
    if (params.organizationId) filter.organizationId = new Types.ObjectId(params.organizationId);

    const budgets = await BudgetModel.find(filter).lean();

    // Query posted journals
    const jvFilter: any = { status: 'POSTED' };
    if (params.startDate || params.endDate) {
      const dQuery: any = {};
      if (params.startDate) dQuery.$gte = new Date(params.startDate);
      if (params.endDate) dQuery.$lte = new Date(params.endDate);
      jvFilter.transactionDate = dQuery;
    }

    const journals = await JournalEntryModel.find(jvFilter).lean();

    // Sum actual debits (expenses) by accountCode
    const actualSpendMap = new Map<number, number>();
    for (const jv of journals) {
      for (const line of jv.lines) {
        const current = actualSpendMap.get(line.accountCode) || 0;
        // For expenses/assets, debit increases spending. For credit/revenue, credit increases.
        const net = (line.debit || 0) - (line.credit || 0);
        actualSpendMap.set(line.accountCode, current + (net > 0 ? net : 0));
      }
    }

    let totalBudget = 0;
    let totalActual = 0;

    const items = budgets.map((b) => {
      const budgetAmt = b.allocatedAmount || 0;
      const actualAmt = Number((actualSpendMap.get(b.accountCode) || 0).toFixed(2));
      const variance = Number((actualAmt - budgetAmt).toFixed(2));
      const variancePct = budgetAmt > 0 ? Number(((variance / budgetAmt) * 100).toFixed(2)) : 0;
      const utilPct = budgetAmt > 0 ? Number(((actualAmt / budgetAmt) * 100).toFixed(2)) : 0;

      totalBudget += budgetAmt;
      totalActual += actualAmt;

      return {
        budgetId: b._id.toString(),
        budgetName: b.budgetName,
        accountCode: b.accountCode,
        accountName: b.accountName,
        department: b.department,
        budgetAmount: budgetAmt,
        actualAmount: actualAmt,
        variance,
        variancePercentage: variancePct,
        utilizationPercentage: utilPct,
        status: b.status,
      };
    });

    return {
      fiscalYear,
      totalBudget: Number(totalBudget.toFixed(2)),
      totalActual: Number(totalActual.toFixed(2)),
      totalVariance: Number((totalActual - totalBudget).toFixed(2)),
      items,
    };
  }
}
