import { Router } from 'express';
import { ProductController } from '../../controllers/ProductController';
import { InventoryController } from '../../controllers/InventoryController';

const router = Router();

/**
 * @route   GET /api/v1/public/products
 * @desc    Public storefront product catalog with search, category, brand filters & stock badges
 * @access  Public
 */
router.get('/', ProductController.listPublicProducts);

/**
 * @route   GET /api/v1/public/products/warranty/verify/:serialNumber
 * @desc    Public equipment warranty authenticity check via URL / QR
 * @access  Public
 */
router.get('/warranty/verify/:serialNumber', InventoryController.verifyWarrantyQr);

/**
 * @route   GET /api/v1/public/products/:idOrSku
 * @desc    Public product detail by ID or SKU
 * @access  Public
 */
router.get('/:idOrSku', ProductController.getPublicProductDetail);

export default router;
