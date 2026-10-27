import { Router } from 'express';
import { CustomerPortalController } from '../../controllers/CustomerPortalController';
import { authGuard } from '../../middlewares/authGuard';
import { validateRequest } from '../../middlewares/validateRequest';
import { updateCustomerProfileSchema } from '../../validators/customer.validator';

const router = Router();

// Apply authGuard to all customer portal routes
router.use(authGuard);

/**
 * @route   GET /api/v1/portal/customer/profile
 * @desc    Retrieves profile and account overview for the authenticated customer
 * @access  Bearer JWT (userType: 'CUSTOMER')
 */
router.get('/profile', CustomerPortalController.getProfile);

/**
 * @route   PUT /api/v1/portal/customer/profile
 * @desc    Updates customer personal details, contact info, and delivery addresses
 * @access  Bearer JWT (userType: 'CUSTOMER')
 */
router.put(
  '/profile',
  validateRequest({ body: updateCustomerProfileSchema }),
  CustomerPortalController.updateProfile
);

/**
 * @route   GET /api/v1/portal/customer/orders
 * @desc    Lists paginated order history placed by this customer
 * @access  Bearer JWT (userType: 'CUSTOMER')
 */
router.get('/orders', CustomerPortalController.getOrders);

/**
 * @route   GET /api/v1/portal/customer/verification-logs
 * @desc    Lists OTP login & security verification history for transparency
 * @access  Bearer JWT (userType: 'CUSTOMER')
 */
router.get('/verification-logs', CustomerPortalController.getVerificationLogs);

export default router;
