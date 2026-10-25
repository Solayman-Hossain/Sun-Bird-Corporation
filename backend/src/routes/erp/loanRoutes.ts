import { Router } from 'express';
import { LoanController } from '../../controllers/LoanController';
import { authGuard } from '../../middlewares/authGuard';
import { hasPermission } from '../../middlewares/rbacGuard';
import { idempotency } from '../../middlewares/idempotency';
import { validateRequest } from '../../middlewares/validateRequest';
import {
  createLoanSchema,
  recordLoanRepaymentSchema,
} from '../../validators/accounting.validator';

const router = Router();

// ── Multi-Type Loan Management (§6.5) ────────────────────────────────────────
router.post(
  '/',
  authGuard,
  hasPermission('accounting', 'CREATE'),
  idempotency(),
  validateRequest({ body: createLoanSchema }),
  LoanController.createLoan
);

router.get(
  '/',
  authGuard,
  hasPermission('accounting', 'READ'),
  LoanController.getLoans
);

router.post(
  '/calculate-schedule',
  authGuard,
  hasPermission('accounting', 'READ'),
  LoanController.calculateSchedule
);

router.get(
  '/:loanCode',
  authGuard,
  hasPermission('accounting', 'READ'),
  LoanController.getLoanByCode
);

router.post(
  '/:id/repay',
  authGuard,
  hasPermission('accounting', 'UPDATE'),
  idempotency(),
  validateRequest({ body: recordLoanRepaymentSchema }),
  LoanController.recordLoanRepayment
);

router.post(
  '/repay',
  authGuard,
  hasPermission('accounting', 'UPDATE'),
  idempotency(),
  validateRequest({ body: recordLoanRepaymentSchema }),
  LoanController.recordLoanRepayment
);

export default router;
