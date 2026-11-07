import { Router } from 'express';
import { DisputeController } from '../../controllers/DisputeController';

const router = Router();

// POST /api/v1/public/disputes/rma
router.post('/rma', DisputeController.submitClaim);

// GET /api/v1/public/disputes/lookup
router.get('/lookup', DisputeController.lookupClaims);

export default router;

