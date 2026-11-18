import { apiClient } from '../lib/api';

function buildQuery(params: Record<string, string | number | boolean | undefined>): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') {
      q.append(k, String(v));
    }
  }
  const str = q.toString();
  return str ? `?${str}` : '';
}

// ─── TYPES ───────────────────────────────────────────────────────────────────

export interface AccountsDashboardData {
  financialSummary: {
    totalAssets: number;
    totalLiabilities: number;
    totalEquity: number;
    netProfitLoss: number;
    totalRevenue: number;
    totalExpenses: number;
    cashAndBankBalance: number;
    totalReceivables: number;
    totalPayables: number;
    workingCapital: number;
  };
  charts: {
    monthlyTrends: Array<{ month: string; revenue: number; expenses: number; profit: number }>;
    expenseBreakdown: Array<{ category: string; amount: number; percentage: number }>;
    cashFlowSummary: { operating: number; investing: number; financing: number };
  };
  alerts: Array<{ type: string; message: string; severity: string; count: number }>;
  recentJournalVouchers: Array<{ voucherNo: string; date: string; description: string; amount: number; status: string }>;
}

export interface JournalVoucherItem {
  _id: string;
  voucherNo: string;
  voucherType: string;
  status: string;
  sourceDocumentRef?: string;
  lines: Array<{ accountCode: number; accountName: string; debit: number; credit: number; narration?: string }>;
  totalDebit: number;
  totalCredit: number;
  createdAt: string;
  approvedAt?: string;
  approvedBy?: string;
  reversedBy?: string;
}

export interface ChartOfAccountItem {
  _id: string;
  accountCode: number;
  accountName: string;
  accountType: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';
  normalBalance: 'DEBIT' | 'CREDIT';
  parentCode?: number;
  isControl: boolean;
  isActive: boolean;
  openingBalance?: number;
  description?: string;
}

export interface GeneralLedgerEntry {
  date: string;
  voucherNo: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
  reference?: string;
}

export interface CashBookEntry {
  date: string;
  description: string;
  reference: string;
  debit: number;
  credit: number;
  balance: number;
  voucherNo: string;
}

export interface BankReconciliationItem {
  _id: string;
  bankAccountCode: number;
  bankAccountName: string;
  statementPeriodStart: string;
  statementPeriodEnd: string;
  statementClosingBalance: number;
  bookBalance: number;
  difference: number;
  status: 'DRAFT' | 'IN_PROGRESS' | 'FINALIZED';
  statementLines: Array<{
    lineId: string;
    date: string;
    description: string;
    reference: string;
    amount: number;
    type: 'DEBIT' | 'CREDIT';
    isMatched: boolean;
    matchedVoucherNo?: string;
  }>;
  createdAt: string;
}

export interface ReceivablesDashboard {
  totalReceivables: number;
  current: number;
  overdue30: number;
  overdue60: number;
  overdue90: number;
  overdueAbove90: number;
  topDebtors: Array<{ customerId: string; customerName: string; outstanding: number; oldestDueDate: string }>;
  agingBuckets: Array<{ bucket: string; amount: number; count: number }>;
}

export interface PayablesDashboard {
  totalPayables: number;
  current: number;
  overdue30: number;
  overdue60: number;
  overdue90: number;
  overdueAbove90: number;
  topCreditors: Array<{ supplierId: string; supplierName: string; outstanding: number }>;
}

export interface PartnerItem {
  _id: string;
  partnerName: string;
  partnerCode: string;
  partnerType: string;
  phone?: string;
  email?: string;
  capitalContribution: number;
  profitShareRatio: number;
  currentBalance: number;
  isActive: boolean;
}

export interface BudgetItem {
  _id: string;
  budgetName: string;
  fiscalYear: number;
  accountCode: number;
  accountName?: string;
  allocatedAmount: number;
  spentAmount: number;
  remainingAmount: number;
  utilizationPct: number;
  status: 'DRAFT' | 'APPROVED' | 'REVISED' | 'CLOSED';
  department?: string;
}

export interface BudgetVsActualItem {
  accountCode: number;
  accountName: string;
  budgetedAmount: number;
  actualAmount: number;
  variance: number;
  variancePct: number;
}

export interface TrialBalance {
  isBalanced: boolean;
  totalDebit: number;
  totalCredit: number;
  asOf: string;
  accounts: Array<{ accountCode: number; accountName: string; accountType: string; debit: number; credit: number }>;
}

export interface ProfitLoss {
  periodStart: string;
  periodEnd: string;
  revenue: number;
  costOfGoodsSold: number;
  grossProfit: number;
  operatingExpenses: number;
  operatingProfit: number;
  otherIncome: number;
  otherExpenses: number;
  netProfitBeforeTax: number;
  tax: number;
  netProfit: number;
  sections: Array<{ section: string; accounts: Array<{ accountCode: number; accountName: string; amount: number }> }>;
}

export interface BalanceSheet {
  isBalanced: boolean;
  asOf: string;
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
  sections: Array<{ section: string; accounts: Array<{ accountCode: number; accountName: string; amount: number }> }>;
}

export interface CashFlowStatement {
  periodStart: string;
  periodEnd: string;
  operatingActivities: number;
  investingActivities: number;
  financingActivities: number;
  netCashFlow: number;
  openingCash: number;
  closingCash: number;
  sections: Array<{ section: string; items: Array<{ description: string; amount: number }> }>;
}

export interface FinancialAnalysis {
  asOf: string;
  ratios: {
    currentRatio: number;
    quickRatio: number;
    debtToEquity: number;
    grossProfitMargin: number;
    netProfitMargin: number;
    returnOnAssets: number;
    returnOnEquity: number;
    assetTurnover: number;
  };
  trends: Array<{ period: string; revenue: number; netProfit: number; totalAssets: number }>;
}

export interface AccountingSettings {
  _id?: string;
  defaultCashAccountCode: number;
  defaultBankAccountCode: number;
  defaultARAccountCode: number;
  defaultAPAccountCode: number;
  defaultVATOutputCode: number;
  defaultVATInputCode: number;
  defaultCOGSAccountCode: number;
  defaultInventoryAccountCode: number;
  autoPostJournalVouchers: boolean;
  requireApprovalAbove: number;
  fiscalYearStart: number;
}

// ─── SERVICE ─────────────────────────────────────────────────────────────────

export const accountingService = {

  // 01. DASHBOARD
  async getDashboard(): Promise<{ success: boolean; data: AccountsDashboardData }> {
    return apiClient('/erp/accounts/dashboard');
  },

  // 02. CHART OF ACCOUNTS
  async getChartOfAccounts(params: { accountType?: string; search?: string; isActive?: boolean } = {}): Promise<{ success: boolean; data: ChartOfAccountItem[] }> {
    return apiClient(`/erp/accounts/chart-of-accounts${buildQuery(params)}`);
  },

  async createAccount(data: Partial<ChartOfAccountItem>): Promise<{ success: boolean; data: ChartOfAccountItem }> {
    return apiClient('/erp/accounts/chart-of-accounts', { method: 'POST', body: JSON.stringify(data) });
  },

  async updateAccount(id: string, data: Partial<ChartOfAccountItem>): Promise<{ success: boolean; data: ChartOfAccountItem }> {
    return apiClient(`/erp/accounts/chart-of-accounts/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  },

  // 03. GENERAL LEDGER
  async getGeneralLedger(params: { accountCode: number; startDate?: string; endDate?: string; page?: number; limit?: number }): Promise<{ success: boolean; data: { account: ChartOfAccountItem; entries: GeneralLedgerEntry[]; openingBalance: number; closingBalance: number; total: number } }> {
    return apiClient(`/erp/accounts/general-ledger${buildQuery(params as any)}`);
  },

  // 04. JOURNAL ENTRIES
  async listJournalVouchers(params: { status?: string; voucherType?: string; startDate?: string; endDate?: string; page?: number; limit?: number } = {}): Promise<{ success: boolean; data: JournalVoucherItem[]; total: number; page: number; totalPages: number }> {
    return apiClient(`/erp/accounts/journal-vouchers${buildQuery(params)}`);
  },

  async createJournalVoucher(data: { voucherType: string; lines: Array<{ accountCode: number; debit: number; credit: number; narration?: string }>; sourceDocumentRef?: string; notes?: string }): Promise<{ success: boolean; data: JournalVoucherItem }> {
    return apiClient('/erp/accounts/journal-vouchers', { method: 'POST', body: JSON.stringify(data) });
  },

  async approveJournalVoucher(id: string): Promise<{ success: boolean; data: JournalVoucherItem }> {
    return apiClient(`/erp/accounts/journal-vouchers/${id}/approve`, { method: 'POST', body: '{}' });
  },

  async reverseJournalVoucher(id: string, reason: string): Promise<{ success: boolean; data: JournalVoucherItem }> {
    return apiClient(`/erp/accounts/journal-vouchers/${id}/reverse`, { method: 'POST', body: JSON.stringify({ reason }) });
  },

  // 05. CASH BOOK
  async getCashBook(params: { accountCode?: number; startDate?: string; endDate?: string } = {}): Promise<{ success: boolean; data: { accountCode: number; accountName: string; openingBalance: number; closingBalance: number; entries: CashBookEntry[] } }> {
    return apiClient(`/erp/accounts/cash-book${buildQuery(params as any)}`);
  },

  // 06. BANK BOOK
  async getBankBook(params: { accountCode?: number; startDate?: string; endDate?: string } = {}): Promise<{ success: boolean; data: { accountCode: number; accountName: string; openingBalance: number; closingBalance: number; entries: CashBookEntry[] } }> {
    return apiClient(`/erp/accounts/bank-book${buildQuery(params as any)}`);
  },

  async recordCashBankTransaction(data: { type: 'RECEIPT' | 'PAYMENT'; accountCode: number; amount: number; description: string; reference?: string; counterpartAccountCode: number }): Promise<{ success: boolean; data: { journalVoucherNo: string } }> {
    return apiClient('/erp/accounts/cash-bank/transaction', { method: 'POST', body: JSON.stringify(data) });
  },

  // 07. BANK RECONCILIATION
  async getBankReconciliations(params: { status?: string; page?: number; limit?: number } = {}): Promise<{ success: boolean; data: BankReconciliationItem[]; total: number }> {
    return apiClient(`/erp/accounts/bank-reconciliations${buildQuery(params)}`);
  },

  async createBankReconciliation(data: { bankAccountCode: number; bankAccountName: string; statementPeriodStart: string; statementPeriodEnd: string; statementClosingBalance: number; statementLines: Array<{ date: string; description: string; reference: string; amount: number; type: 'DEBIT' | 'CREDIT' }>; notes?: string }): Promise<{ success: boolean; data: BankReconciliationItem }> {
    return apiClient('/erp/accounts/bank-reconciliations', { method: 'POST', body: JSON.stringify(data) });
  },

  async matchStatementLine(reconId: string, lineId: string, voucherNo: string): Promise<{ success: boolean; data: BankReconciliationItem }> {
    return apiClient(`/erp/accounts/bank-reconciliations/${reconId}/match`, { method: 'POST', body: JSON.stringify({ lineId, voucherNo }) });
  },

  async finalizeBankReconciliation(reconId: string): Promise<{ success: boolean; data: BankReconciliationItem }> {
    return apiClient(`/erp/accounts/bank-reconciliations/${reconId}/finalize`, { method: 'POST', body: '{}' });
  },

  // 08. RECEIVABLES (AR)
  async getReceivablesDashboard(): Promise<{ success: boolean; data: ReceivablesDashboard }> {
    return apiClient('/erp/accounts/receivables');
  },

  async getCustomerLedger(customerId: string, params: { startDate?: string; endDate?: string } = {}): Promise<{ success: boolean; data: { customer: { name: string; code: string }; entries: Array<{ date: string; description: string; debit: number; credit: number; balance: number; reference: string }>; closingBalance: number } }> {
    return apiClient(`/erp/accounts/receivables/customer/${customerId}${buildQuery(params)}`);
  },

  async allocateCustomerPayment(receiptId: string, allocations: Array<{ invoiceId: string; amount: number }>): Promise<{ success: boolean; data: { allocated: number; remaining: number } }> {
    return apiClient(`/erp/accounts/receivables/allocate/${receiptId}`, { method: 'POST', body: JSON.stringify({ allocations }) });
  },

  // 09. PAYABLES (AP)
  async getPayablesDashboard(): Promise<{ success: boolean; data: PayablesDashboard }> {
    return apiClient('/erp/accounts/payables');
  },

  async getSupplierLedger(supplierId: string, params: { startDate?: string; endDate?: string } = {}): Promise<{ success: boolean; data: { supplier: { name: string; code: string }; entries: Array<{ date: string; description: string; debit: number; credit: number; balance: number; reference: string }>; closingBalance: number } }> {
    return apiClient(`/erp/accounts/payables/supplier/${supplierId}${buildQuery(params)}`);
  },

  async recordSupplierPayment(data: { supplierId: string; paymentAmount: number; paymentMethod: string; sourceAccountCode: number; allocations: Array<{ invoiceId: string; amount: number }>; notes?: string }): Promise<{ success: boolean; data: { journalVoucherNo: string } }> {
    return apiClient('/erp/accounts/payables/payment', { method: 'POST', body: JSON.stringify(data) });
  },

  // 10. PARTNER MANAGEMENT
  async getPartners(params: { isActive?: boolean; partnerType?: string } = {}): Promise<{ success: boolean; data: PartnerItem[] }> {
    return apiClient(`/erp/accounts/partners${buildQuery(params)}`);
  },

  async createPartner(data: { partnerName: string; partnerCode: string; partnerType: string; phone?: string; email?: string; capitalContribution: number; profitShareRatio: number }): Promise<{ success: boolean; data: PartnerItem }> {
    return apiClient('/erp/accounts/partners', { method: 'POST', body: JSON.stringify(data) });
  },

  async recordCapitalContribution(data: { partnerId: string; amount: number; accountCode: number; notes?: string }): Promise<{ success: boolean; data: { journalVoucherNo: string } }> {
    return apiClient('/erp/accounts/partners/capital-contribution', { method: 'POST', body: JSON.stringify(data) });
  },

  async recordPartnerWithdrawal(data: { partnerId: string; amount: number; accountCode: number; notes?: string }): Promise<{ success: boolean; data: { journalVoucherNo: string } }> {
    return apiClient('/erp/accounts/partners/withdrawal', { method: 'POST', body: JSON.stringify(data) });
  },

  async previewProfitDistribution(params: { fiscalYear: number; netProfit: number }): Promise<{ success: boolean; data: { distributions: Array<{ partnerId: string; partnerName: string; shareRatio: number; shareAmount: number }> } }> {
    return apiClient(`/erp/accounts/partners/profit-distribution/preview${buildQuery(params as any)}`);
  },

  async postProfitDistribution(data: { fiscalYear: number; netProfit: number; notes?: string }): Promise<{ success: boolean; data: { journalVoucherNo: string } }> {
    return apiClient('/erp/accounts/partners/profit-distribution', { method: 'POST', body: JSON.stringify(data) });
  },

  async recordPartnerSettlement(data: { partnerId: string; settlementAmount: number; accountCode: number; notes?: string }): Promise<{ success: boolean; data: { journalVoucherNo: string } }> {
    return apiClient('/erp/accounts/partners/settlement', { method: 'POST', body: JSON.stringify(data) });
  },

  async getPartnerLedger(partnerId: string): Promise<{ success: boolean; data: { partner: PartnerItem; transactions: Array<{ date: string; type: string; amount: number; balance: number; reference: string; notes?: string }> } }> {
    return apiClient(`/erp/accounts/partners/${partnerId}/ledger`);
  },

  // 11. BUDGET MANAGEMENT
  async getBudgets(params: { fiscalYear?: number; status?: string; department?: string } = {}): Promise<{ success: boolean; data: BudgetItem[]; total: number }> {
    return apiClient(`/erp/accounts/budgets${buildQuery(params as any)}`);
  },

  async createBudget(data: { budgetName: string; fiscalYear: number; accountCode: number; allocatedAmount: number; department?: string; notes?: string }): Promise<{ success: boolean; data: BudgetItem }> {
    return apiClient('/erp/accounts/budgets', { method: 'POST', body: JSON.stringify(data) });
  },

  async approveBudget(id: string): Promise<{ success: boolean; data: BudgetItem }> {
    return apiClient(`/erp/accounts/budgets/${id}/approve`, { method: 'POST', body: '{}' });
  },

  async getBudgetVsActual(params: { fiscalYear: number; department?: string }): Promise<{ success: boolean; data: { items: BudgetVsActualItem[]; totalBudgeted: number; totalActual: number; totalVariance: number } }> {
    return apiClient(`/erp/accounts/budgets/vs-actual${buildQuery(params as any)}`);
  },

  // 12. FINANCIAL REPORTS
  async getTrialBalance(params: { asOf?: string } = {}): Promise<{ success: boolean; data: TrialBalance }> {
    return apiClient(`/erp/accounts/reports/trial-balance${buildQuery(params)}`);
  },

  async getProfitAndLoss(params: { startDate?: string; endDate?: string } = {}): Promise<{ success: boolean; data: ProfitLoss }> {
    return apiClient(`/erp/accounts/reports/profit-loss${buildQuery(params)}`);
  },

  async getBalanceSheet(params: { asOf?: string } = {}): Promise<{ success: boolean; data: BalanceSheet }> {
    return apiClient(`/erp/accounts/reports/balance-sheet${buildQuery(params)}`);
  },

  async getCashFlowStatement(params: { startDate?: string; endDate?: string } = {}): Promise<{ success: boolean; data: CashFlowStatement }> {
    return apiClient(`/erp/accounts/reports/cash-flow${buildQuery(params)}`);
  },

  async getFinancialAnalysis(): Promise<{ success: boolean; data: FinancialAnalysis }> {
    return apiClient('/erp/accounts/reports/financial-analysis');
  },

  // 13. ACCOUNTING SETTINGS
  async getAccountingSettings(): Promise<{ success: boolean; data: AccountingSettings }> {
    return apiClient('/erp/accounts/settings');
  },

  async updateAccountingSettings(data: Partial<AccountingSettings>): Promise<{ success: boolean; data: AccountingSettings }> {
    return apiClient('/erp/accounts/settings', { method: 'PUT', body: JSON.stringify(data) });
  },
};
