import { Router } from 'express';
import { CrmController } from '../../controllers/CrmController';
import { authGuard } from '../../middlewares/authGuard';
import { hasPermission } from '../../middlewares/rbacGuard';
import { validateRequest } from '../../middlewares/validateRequest';
import {
  createCrmActivitySchema,
  updateCrmActivitySchema,
} from '../../validators/system-aux.validator';

const router = Router();

// ── CRM Leads, Visits & Follow-ups (§19) ────────────────────────────────────

router.post(
  '/activities',
  authGuard,
  hasPermission('crm', 'CREATE'),
  validateRequest({ body: createCrmActivitySchema }),
  CrmController.createActivity
);

router.get(
  '/activities',
  authGuard,
  hasPermission('crm', 'READ'),
  CrmController.getActivities
);

router.get(
  '/activities/:id',
  authGuard,
  hasPermission('crm', 'READ'),
  CrmController.getActivityById
);

router.put(
  '/activities/:id',
  authGuard,
  hasPermission('crm', 'UPDATE'),
  validateRequest({ body: updateCrmActivitySchema }),
  CrmController.updateActivity
);

router.get(
  '/follow-ups',
  authGuard,
  hasPermission('crm', 'READ'),
  CrmController.getUpcomingFollowUps
);

export default router;
