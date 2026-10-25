import { Router } from 'express';
import { LogisticsController } from '../../controllers/LogisticsController';
import { authGuard } from '../../middlewares/authGuard';
import { hasPermission } from '../../middlewares/rbacGuard';
import { validateRequest } from '../../middlewares/validateRequest';
import { bookConsignmentSchema } from '../../validators/logistics.validator';

const router = Router();

/**
 * @route   POST /api/v1/erp/logistics/consignments
 * @desc    Books courier consignment with Pathao or Steadfast
 * @access  Bearer JWT (sales:CREATE)
 */
router.post(
  '/consignments',
  authGuard,
  hasPermission('sales', 'CREATE'),
  validateRequest({ body: bookConsignmentSchema }),
  LogisticsController.bookConsignment
);

/**
 * @route   GET /api/v1/erp/logistics/consignments
 * @desc    Lists courier consignments with filters and pagination
 * @access  Bearer JWT (sales:READ)
 */
router.get(
  '/consignments',
  authGuard,
  hasPermission('sales', 'READ'),
  LogisticsController.listConsignments
);

/**
 * @route   GET /api/v1/erp/logistics/consignments/:id
 * @desc    Retrieves consignment details by ID
 * @access  Bearer JWT (sales:READ)
 */
router.get(
  '/consignments/:id',
  authGuard,
  hasPermission('sales', 'READ'),
  LogisticsController.getConsignmentById
);

export default router;
