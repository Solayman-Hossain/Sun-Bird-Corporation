import { Router } from 'express';
import { QuorumController } from '../../controllers/QuorumController';
import { authGuard } from '../../middlewares/authGuard';
import { validateRequest } from '../../middlewares/validateRequest';
import { signQuorumSchema, emergencyOverrideSchema } from '../../validators/system-aux.validator';

const router = Router();

// ── Multi-Director Quorum Approvals (§22.5.2 & §22.5.3) ─────────────────────

router.get(
  '/',
  authGuard,
  QuorumController.getQuorums
);

router.get(
  '/:id',
  authGuard,
  QuorumController.getQuorumById
);

router.post(
  '/:id/sign',
  authGuard,
  validateRequest({ body: signQuorumSchema }),
  QuorumController.signQuorum
);

router.post(
  '/:id/emergency-override',
  authGuard,
  validateRequest({ body: emergencyOverrideSchema }),
  QuorumController.emergencyOverride
);

export default router;
