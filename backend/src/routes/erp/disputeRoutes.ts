import { Router } from 'express';
import { DisputeController } from '../../controllers/DisputeController';

const router = Router();

// GET /api/v1/erp/disputes (Moderation Queue - Prompt 19 & 20)
router.get('/', DisputeController.getClaimsQueue);

// PATCH /api/v1/erp/disputes/:id/resolve
router.patch('/:id/resolve', DisputeController.resolveClaim);

export default router;

