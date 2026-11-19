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

// ── 02-04. Employee Master & Directory (§7.1) ───────────────────────────────
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
  '/employees/next-code',
  authGuard,
  hasPermission('hrm', 'READ'),
  HrmController.getNextEmployeeCode
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

// ── 05-06. Onboarding & Offboarding ──────────────────────────────────────────
router.patch(
  '/employees/:id/onboarding-task',
  authGuard,
  hasPermission('hrm', 'UPDATE'),
  HrmController.updateOnboardingTask
);

router.post(
  '/employees/:id/offboarding',
  authGuard,
  hasPermission('hrm', 'UPDATE'),
  HrmController.processOffboarding
);

// ── 07-10. Departments, Designations, Grades, Employment Types ───────────────
router.get('/departments', authGuard, hasPermission('hrm', 'READ'), HrmController.getDepartments);
router.post('/departments', authGuard, hasPermission('hrm', 'CREATE'), HrmController.createDepartment);

router.get('/designations', authGuard, hasPermission('hrm', 'READ'), HrmController.getDesignations);
router.post('/designations', authGuard, hasPermission('hrm', 'CREATE'), HrmController.createDesignation);

router.get('/job-grades', authGuard, hasPermission('hrm', 'READ'), HrmController.getJobGrades);
router.post('/job-grades', authGuard, hasPermission('hrm', 'CREATE'), HrmController.createJobGrade);

router.get('/employment-types', authGuard, hasPermission('hrm', 'READ'), HrmController.getEmploymentTypes);
router.post('/employment-types', authGuard, hasPermission('hrm', 'CREATE'), HrmController.createEmploymentType);

// ── 12. Employee ID Card ─────────────────────────────────────────────────────
router.get('/employees/:id/id-card', authGuard, hasPermission('hrm', 'READ'), HrmController.getEmployeeIdCard);

// ── 15. Organization Chart ───────────────────────────────────────────────────
router.get('/org-chart', authGuard, hasPermission('hrm', 'READ'), HrmController.getOrganizationChart);

// ── 16-24. Attendance, Shifts, Rosters & Holidays ────────────────────────────
router.get('/attendance/stats', authGuard, hasPermission('hrm', 'READ'), HrmController.getAttendanceStats);
router.post('/attendance/import', authGuard, hasPermission('hrm', 'CREATE'), HrmController.importAttendance);
router.get('/attendance/corrections', authGuard, hasPermission('hrm', 'READ'), HrmController.getAttendanceCorrections);
router.post('/attendance/corrections', authGuard, hasPermission('hrm', 'CREATE'), HrmController.requestAttendanceCorrection);
router.put('/attendance/corrections/:id', authGuard, hasPermission('hrm', 'APPROVE'), HrmController.processAttendanceCorrection);

router.get('/shifts', authGuard, hasPermission('hrm', 'READ'), HrmController.getShifts);
router.post('/shifts', authGuard, hasPermission('hrm', 'CREATE'), HrmController.createShift);

router.get('/rosters', authGuard, hasPermission('hrm', 'READ'), HrmController.getRosters);
router.post('/rosters', authGuard, hasPermission('hrm', 'CREATE'), HrmController.assignRoster);

router.get('/holidays', authGuard, hasPermission('hrm', 'READ'), HrmController.getHolidays);
router.post('/holidays', authGuard, hasPermission('hrm', 'CREATE'), HrmController.createHoliday);

// ── 25-30. Leave Management ──────────────────────────────────────────────────
router.get('/leaves/types', authGuard, hasPermission('hrm', 'READ'), HrmController.getLeaveTypes);
router.post('/leaves/types', authGuard, hasPermission('hrm', 'CREATE'), HrmController.createLeaveType);
router.get('/leaves/balances/:employeeId', authGuard, hasPermission('hrm', 'READ'), HrmController.getLeaveBalances);
router.post('/leaves/init-balances', authGuard, hasPermission('hrm', 'UPDATE'), HrmController.initLeaveBalances);
router.get('/leaves/requests', authGuard, hasPermission('hrm', 'READ'), HrmController.getLeaveRequests);
router.post('/leaves/requests', authGuard, hasPermission('hrm', 'CREATE'), HrmController.submitLeaveRequest);
router.put('/leaves/requests/:id', authGuard, hasPermission('hrm', 'APPROVE'), HrmController.processLeaveApproval);
router.get('/leaves/calendar', authGuard, hasPermission('hrm', 'READ'), HrmController.getLeaveCalendar);

// ── 33-43. Payroll, Salary Structure, Batches & Payslips ─────────────────────
router.get('/salary/components', authGuard, hasPermission('hrm', 'READ'), HrmController.getSalaryComponents);
router.post('/salary/components', authGuard, hasPermission('hrm', 'CREATE'), HrmController.createSalaryComponent);

router.get('/salary/structures', authGuard, hasPermission('hrm', 'READ'), HrmController.getSalaryStructures);
router.post('/salary/structures', authGuard, hasPermission('hrm', 'CREATE'), HrmController.createSalaryStructure);

router.get('/payroll/batches', authGuard, hasPermission('hrm', 'READ'), HrmController.getPayrollBatches);
router.post('/payroll/batches/compute', authGuard, hasPermission('hrm', 'CREATE'), HrmController.computePayrollBatch);
router.put('/payroll/batches/:id/status', authGuard, hasPermission('hrm', 'APPROVE'), HrmController.updateBatchStatus);
router.post('/payroll/batches/:id/post-gl', authGuard, hasPermission('hrm', 'APPROVE'), HrmController.postBatchToGl);
router.post('/payroll/batches/:id/disburse', authGuard, hasPermission('hrm', 'APPROVE'), HrmController.disburseSalaryPayment);

router.get('/payroll/payslips', authGuard, hasPermission('hrm', 'READ'), HrmController.getPayslips);
router.get('/payroll/payslips/:id/print', authGuard, hasPermission('hrm', 'READ'), HrmController.getPayslipPrint);

// Legacy Payroll Run routes preserved for backwards compatibility
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

// ── 44-47. Loans, Advances & Claims ──────────────────────────────────────────
router.get('/advances', authGuard, hasPermission('hrm', 'READ'), HrmController.getAdvances);
router.post('/advances', authGuard, hasPermission('hrm', 'CREATE'), HrmController.requestAdvance);
router.put('/advances/:id/approve', authGuard, hasPermission('hrm', 'APPROVE'), HrmController.approveAdvance);
router.post('/advances/:id/disburse', authGuard, hasPermission('hrm', 'APPROVE'), HrmController.disburseAdvance);

router.get('/loans', authGuard, hasPermission('hrm', 'READ'), HrmController.getEmployeeLoans);
router.post('/loans', authGuard, hasPermission('hrm', 'CREATE'), HrmController.createEmployeeLoan);

router.get('/expense-claims', authGuard, hasPermission('hrm', 'READ'), HrmController.getExpenseClaims);
router.post('/expense-claims', authGuard, hasPermission('hrm', 'CREATE'), HrmController.submitExpenseClaim);
router.put('/expense-claims/:id/approve', authGuard, hasPermission('hrm', 'APPROVE'), HrmController.approveExpenseClaim);
router.post('/expense-claims/:id/settle', authGuard, hasPermission('hrm', 'APPROVE'), HrmController.settleExpenseClaim);

// ── 48-52. Talent, Reports, Logs & Settings ──────────────────────────────────
router.get('/performance', authGuard, hasPermission('hrm', 'READ'), HrmController.getPerformanceReviews);
router.post('/performance', authGuard, hasPermission('hrm', 'CREATE'), HrmController.createPerformanceReview);

router.get('/training', authGuard, hasPermission('hrm', 'READ'), HrmController.getTrainingRecords);
router.post('/training', authGuard, hasPermission('hrm', 'CREATE'), HrmController.createTrainingRecord);

router.get('/reports/headcount', authGuard, hasPermission('hrm', 'READ'), HrmController.getHeadcountReport);
router.get('/reports/payroll', authGuard, hasPermission('hrm', 'READ'), HrmController.getPayrollAnalyticsReport);

router.get('/audit-logs', authGuard, hasPermission('hrm', 'READ'), HrmController.getHrAuditLogs);

router.get('/settings', authGuard, hasPermission('hrm', 'READ'), HrmController.getSettings);
router.put('/settings', authGuard, hasPermission('hrm', 'UPDATE'), HrmController.updateSettings);

export default router;
