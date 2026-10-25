import { Router } from 'express';
import { VendorPortalController } from '../../controllers/VendorPortalController';
import { authGuard } from '../../middlewares/authGuard';
import { validateRequest } from '../../middlewares/validateRequest';
import { submitQuotationSchema } from '../../validators/procurement.validator';

const router = Router();

/**
 * @route   GET /api/v1/portal/vendor/profile
 * @desc    Retrieves profile and historical performance of authenticated vendor
 * @access  Bearer JWT (Vendor Portal)
 */
router.get('/profile', authGuard, VendorPortalController.getProfile);

/**
 * @route   GET /api/v1/portal/vendor/rfqs
 * @desc    Lists open RFQ tenders available for bidding
 * @access  Bearer JWT (Vendor Portal)
 */
router.get('/rfqs', authGuard, VendorPortalController.listAvailableRfqs);

/**
 * @route   POST /api/v1/portal/vendor/quotations
 * @desc    Submits bid quotation for an RFQ
 * @access  Bearer JWT (Vendor Portal)
 */
router.post(
  '/quotations',
  authGuard,
  validateRequest({ body: submitQuotationSchema }),
  VendorPortalController.submitQuotation
);

/**
 * @route   GET /api/v1/portal/vendor/quotations
 * @desc    Lists quotations submitted by this vendor
 * @access  Bearer JWT (Vendor Portal)
 */
router.get('/quotations', authGuard, VendorPortalController.listMyQuotations);

export default router;
