import { Router, Request, Response } from 'express';
import {
  DoubleEntryImbalanceError,
  ValidationError,
  NotFoundError,
  CreditLockedError,
  QuorumRequiredError,
} from '../errors/AppError';

const router = Router();

/**
 * Verification route that throws DoubleEntryImbalanceError(10000, 9500)
 * To assert correct 422 JSON response matching Prompt 03 verification criteria.
 */
router.get('/double-entry', (req: Request, res: Response) => {
  throw new DoubleEntryImbalanceError(10000, 9500);
});

/**
 * Additional test routes for error verification
 */
router.get('/validation', (req: Request, res: Response) => {
  throw new ValidationError([
    { field: 'mushakChallanNo', issue: 'Mushak-6.3 Challan number must match CH-YYYYMM-XXXXX format' },
  ]);
});

router.get('/credit-locked', (req: Request, res: Response) => {
  throw new CreditLockedError('CUST-8801', 500000, 620000);
});

router.get('/quorum', (req: Request, res: Response) => {
  throw new QuorumRequiredError(2, 2500000, 2);
});

import { z } from 'zod';
import { validateRequest } from '../middlewares/validateRequest';
import { idempotency } from '../middlewares/idempotency';

/**
 * Route for testing Zod schema validation
 */
const sampleItemSchema = z.object({
  itemName: z.string().min(3, 'Item name must be at least 3 characters'),
  unitPrice: z.number().positive('Unit price must be positive'),
});

router.post(
  '/validate-sample',
  validateRequest({ body: sampleItemSchema }),
  (req: Request, res: Response) => {
    res.status(200).json({
      success: true,
      data: req.body,
    });
  }
);

/**
 * Route for testing Idempotency Guard with concurrent simulation
 */
router.post(
  '/idempotent-order',
  idempotency({ required: true, resource: 'ORDER' }),
  async (req: Request, res: Response) => {
    // Artificial 300ms processing delay to simulate database transaction / payment processing
    await new Promise((resolve) => setTimeout(resolve, 300));

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      orderId: 'ORD-' + (req.body?.sku || 'SAMPLE-101'),
      processedAt: new Date().toISOString(),
    });
  }
);

export default router;
