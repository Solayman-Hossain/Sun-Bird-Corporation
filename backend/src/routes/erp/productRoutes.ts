import { Router } from 'express';
import { ProductController } from '../../controllers/ProductController';
import { authGuard } from '../../middlewares/authGuard';
import { hasPermission } from '../../middlewares/rbacGuard';
import { validateRequest } from '../../middlewares/validateRequest';
import {
  createProductSchema,
  updateProductSchema,
  createUomConversionSchema,
} from '../../validators/product.validator';

const router = Router();

/**
 * @route   POST /api/v1/erp/products
 * @desc    Registers a new master product SKU
 * @access  Bearer JWT (products:CREATE)
 */
router.post(
  '/',
  authGuard,
  hasPermission('products', 'CREATE'),
  validateRequest({ body: createProductSchema }),
  ProductController.createProduct
);

/**
 * @route   PUT /api/v1/erp/products/:id
 * @desc    Updates master product SKU details
 * @access  Bearer JWT (products:UPDATE)
 */
router.put(
  '/:id',
  authGuard,
  hasPermission('products', 'UPDATE'),
  validateRequest({ body: updateProductSchema }),
  ProductController.updateProduct
);

/**
 * @route   DELETE /api/v1/erp/products/:id
 * @desc    Soft-deactivates a product SKU
 * @access  Bearer JWT (products:DELETE)
 */
router.delete(
  '/:id',
  authGuard,
  hasPermission('products', 'DELETE'),
  ProductController.deactivateProduct
);

/**
 * @route   POST /api/v1/erp/products/uom-conversions
 * @desc    Sets multi-UOM conversion factors (Carton -> Box -> Piece)
 * @access  Bearer JWT (products:CREATE or products:MANAGE)
 */
router.post(
  '/uom-conversions',
  authGuard,
  hasPermission('products', 'CREATE'),
  validateRequest({ body: createUomConversionSchema }),
  ProductController.createUomConversion
);

export default router;
