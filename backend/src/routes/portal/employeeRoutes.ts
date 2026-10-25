import { Router } from 'express';
import { HrmController } from '../../controllers/HrmController';
import { authGuard } from '../../middlewares/authGuard';
import { validateRequest } from '../../middlewares/validateRequest';
import { mobilePunchSchema } from '../../validators/hrm.validator';

const router = Router();

// ── Mobile Attendance Punch & Clock-In/Out (§7.2) ───────────────────────────
router.post(
  '/punch',
  authGuard,
  validateRequest({ body: mobilePunchSchema }),
  HrmController.recordPunch
);

// ── Employee Self-Service Attendance History ────────────────────────────────
router.get(
  '/attendance',
  authGuard,
  HrmController.getMyAttendance
);

// ── Employee Self-Service Payslips ──────────────────────────────────────────
router.get(
  '/payslips',
  authGuard,
  HrmController.getMyPayslips
);

export default router;
