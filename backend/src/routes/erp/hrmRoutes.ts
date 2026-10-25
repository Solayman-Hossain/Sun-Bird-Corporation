import { Router } from 'express';
import { HrmController } from '../../controllers/HrmController';
import { authGuard } from '../../middlewares/authGuard';
import { hasPermission } from '../../middlewares/rbacGuard';
import { idempotency } from '../../middlewares/idempotency';
import { validateRequest } from '../../middlewares/validateRequest';
import {
  createEmployeeSchema,
  updateEmployeeSchema,
  computePayrollSchema,
  postPayrollGlSchema,
} from '../../validators/hrm.validator';

const router = Router();

// ── Employee Master & Salary Structure (§7.1) ───────────────────────────────
router.post(
  '/employees',
  authGuard,
  hasPermission('hrm', 'CREATE'),
  idempotency(),
  validateRequest({ body: createEmployeeSchema }),
  HrmController.createEmployee
);

router.get(
  '/employees',
  authGuard,
  hasPermission('hrm', 'READ'),
  HrmController.getEmployees
);

router.get(
  '/employees/:id',
  authGuard,
  hasPermission('hrm', 'READ'),
  HrmController.getEmployeeById
);

router.put(
  '/employees/:id',
  authGuard,
  hasPermission('hrm', 'UPDATE'),
  validateRequest({ body: updateEmployeeSchema }),
  HrmController.updateEmployee
);

// ── Monthly Payroll Processing & GL Auto-Posting (§7.3) ─────────────────────
router.post(
  '/payroll-runs/compute',
  authGuard,
  hasPermission('hrm', 'UPDATE'),
  idempotency(),
  validateRequest({ body: computePayrollSchema }),
  HrmController.computeMonthlyPayroll
);

router.post(
  '/payroll-runs/post-gl',
  authGuard,
  hasPermission('hrm', 'APPROVE'),
  idempotency(),
  validateRequest({ body: postPayrollGlSchema }),
  HrmController.postPayrollToGl
);

router.get(
  '/payroll-runs',
  authGuard,
  hasPermission('hrm', 'READ'),
  HrmController.getPayrollRuns
);

export default router;
