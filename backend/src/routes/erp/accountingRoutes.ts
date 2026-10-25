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

export default router;
