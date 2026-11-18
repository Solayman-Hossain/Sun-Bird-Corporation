import { Router } from 'express';
import { AccountingController } from '../../controllers/AccountingController';
import { authGuard } from '../../middlewares/authGuard';
import { hasPermission } from '../../middlewares/rbacGuard';
import { idempotency } from '../../middlewares/idempotency';
import { validateRequest } from '../../middlewares/validateRequest';
import {
  createCoaSchema,
  createJournalVoucherSchema,
  reverseJournalSchema,
} from '../../validators/accounting.validator';

const router = Router();

// ── Chart of Accounts (COA) (§6.1) ───────────────────────────────────────────
router.get(
  '/coa',
  authGuard,
  hasPermission('accounting', 'READ'),
  AccountingController.getChartOfAccounts
);

router.post(
  '/coa',
  authGuard,
  hasPermission('accounting', 'MANAGE'),
  validateRequest({ body: createCoaSchema }),
  AccountingController.createChartOfAccount
);

// ── Double-Entry Balanced Journal Entries (§6.2) ─────────────────────────────
router.post(
  '/journals',
  authGuard,
  hasPermission('accounting', 'CREATE'),
  idempotency(),
  validateRequest({ body: createJournalVoucherSchema }),
  AccountingController.createJournalEntry
);

router.get(
  '/journals',
  authGuard,
  hasPermission('accounting', 'READ'),
  AccountingController.getJournalEntries
);

router.get(
  '/journals/:voucherNo',
  authGuard,
  hasPermission('accounting', 'READ'),
  AccountingController.getJournalEntryByVoucher
);

router.post(
  '/journals/:id/reverse',
  authGuard,
  hasPermission('accounting', 'POST'),
  idempotency(),
  validateRequest({ body: reverseJournalSchema }),
  AccountingController.reverseJournalEntry
);

// ── Real-Time Financial Statements & Aggregations (§6.3) ─────────────────────
router.get(
  '/reports/trial-balance',
  authGuard,
  hasPermission('accounting', 'READ'),
  AccountingController.getTrialBalance
);

router.get(
  '/reports/profit-loss',
  authGuard,
  hasPermission('accounting', 'READ'),
  AccountingController.getProfitAndLoss
);

router.get(
  '/reports/balance-sheet',
  authGuard,
  hasPermission('accounting', 'READ'),
  AccountingController.getBalanceSheet
);

router.get(
  '/reports/general-ledger',
  authGuard,
  hasPermission('accounting', 'READ'),
  AccountingController.getGeneralLedger
);

// ── Module 08: Accounts Dashboard ───────────────────────────────────────────
router.get(
  '/dashboard',
  authGuard,
  hasPermission('accounting', 'READ'),
  AccountingController.getDashboard
);

// ── Cash & Bank Management ──────────────────────────────────────────────────
router.get(
  '/cash-book',
  authGuard,
  hasPermission('accounting', 'READ'),
  AccountingController.getCashBook
);

router.get(
  '/bank-book',
  authGuard,
  hasPermission('accounting', 'READ'),
  AccountingController.getBankBook
);

router.post(
  '/cash-bank/transfer',
  authGuard,
  hasPermission('accounting', 'CREATE'),
  AccountingController.recordCashBankTransaction
);

// ── Bank Reconciliation ─────────────────────────────────────────────────────
router.get(
  '/bank-reconciliations',
  authGuard,
  hasPermission('accounting', 'READ'),
  AccountingController.getBankReconciliations
);

router.post(
  '/bank-reconciliations',
  authGuard,
  hasPermission('accounting', 'CREATE'),
  AccountingController.createBankReconciliation
);

router.post(
  '/bank-reconciliations/:id/match',
  authGuard,
  hasPermission('accounting', 'UPDATE'),
  AccountingController.matchStatementLine
);

router.post(
  '/bank-reconciliations/:id/finalize',
  authGuard,
  hasPermission('accounting', 'APPROVE'),
  AccountingController.finalizeBankReconciliation
);

// ── Accounts Receivable & Allocation ─────────────────────────────────────────
router.get(
  '/receivables',
  authGuard,
  hasPermission('accounting', 'READ'),
  AccountingController.getReceivables
);

router.get(
  '/receivables/customer-ledger/:customerId',
  authGuard,
  hasPermission('accounting', 'READ'),
  AccountingController.getCustomerLedger
);

router.post(
  '/receivables/allocate-payment',
  authGuard,
  hasPermission('accounting', 'UPDATE'),
  AccountingController.allocateCustomerPayment
);

// ── Accounts Payable & Supplier Payments ────────────────────────────────────
router.get(
  '/payables',
  authGuard,
  hasPermission('accounting', 'READ'),
  AccountingController.getPayables
);

router.get(
  '/payables/supplier-ledger/:supplierId',
  authGuard,
  hasPermission('accounting', 'READ'),
  AccountingController.getSupplierLedger
);

router.post(
  '/payables/record-payment',
  authGuard,
  hasPermission('accounting', 'CREATE'),
  AccountingController.recordSupplierPayment
);

// ── Partner Capital, Profit Distribution & Settlements ──────────────────────
router.get(
  '/partners',
  authGuard,
  hasPermission('accounting', 'READ'),
  AccountingController.getPartnersList
);

router.post(
  '/partners',
  authGuard,
  hasPermission('accounting', 'CREATE'),
  AccountingController.createPartnerProfile
);

router.post(
  '/partners/capital-contribution',
  authGuard,
  hasPermission('accounting', 'CREATE'),
  AccountingController.recordCapitalContribution
);

router.post(
  '/partners/withdrawal',
  authGuard,
  hasPermission('accounting', 'CREATE'),
  AccountingController.recordPartnerWithdrawal
);

router.post(
  '/partners/profit-distribution/preview',
  authGuard,
  hasPermission('accounting', 'READ'),
  AccountingController.previewProfitDistribution
);

router.post(
  '/partners/profit-distribution/post',
  authGuard,
  hasPermission('accounting', 'APPROVE'),
  AccountingController.postProfitDistribution
);

router.post(
  '/partners/settlement',
  authGuard,
  hasPermission('accounting', 'APPROVE'),
  AccountingController.recordPartnerSettlement
);

router.get(
  '/partners/:partnerId/ledger',
  authGuard,
  hasPermission('accounting', 'READ'),
  AccountingController.getPartnerLedger
);

// ── Budget Management & Budget vs Actual ────────────────────────────────────
router.get(
  '/budgets',
  authGuard,
  hasPermission('accounting', 'READ'),
  AccountingController.getBudgets
);

router.post(
  '/budgets',
  authGuard,
  hasPermission('accounting', 'CREATE'),
  AccountingController.createBudget
);

router.post(
  '/budgets/:id/approve',
  authGuard,
  hasPermission('accounting', 'APPROVE'),
  AccountingController.approveBudget
);

router.get(
  '/budgets/vs-actual',
  authGuard,
  hasPermission('accounting', 'READ'),
  AccountingController.getBudgetVsActual
);

// ── Cash Flow Statement & Financial Analysis ────────────────────────────────
router.get(
  '/reports/cash-flow',
  authGuard,
  hasPermission('accounting', 'READ'),
  AccountingController.getCashFlowStatement
);

router.get(
  '/reports/financial-analysis',
  authGuard,
  hasPermission('accounting', 'READ'),
  AccountingController.getFinancialAnalysis
);

// ── Accounting Settings ─────────────────────────────────────────────────────
router.get(
  '/settings',
  authGuard,
  hasPermission('accounting', 'READ'),
  AccountingController.getAccountingSettings
);

router.put(
  '/settings',
  authGuard,
  hasPermission('accounting', 'MANAGE'),
  AccountingController.updateAccountingSettings
);

export default router;
