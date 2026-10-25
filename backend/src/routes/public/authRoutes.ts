import { Router } from 'express';
import { AuthController } from '../../controllers/AuthController';
import { validateRequest } from '../../middlewares/validateRequest';
import {
  sendOtpSchema,
  verifyOtpSchema,
} from '../../validators/auth.validator';

const router = Router();

/**
 * @route   POST /api/v1/public/auth/send-otp
 * @desc    Dispatches a 6-digit verification code to the customer's mobile number
 * @access  Public
 */
router.post(
  '/send-otp',
  validateRequest({ body: sendOtpSchema }),
  AuthController.sendOtp
);

/**
 * @route   POST /api/v1/public/auth/verify-otp
 * @desc    Verifies OTP, authenticates or creates customer record, sets refresh cookie, returns access token
 * @access  Public
 */
router.post(
  '/verify-otp',
  validateRequest({ body: verifyOtpSchema }),
  AuthController.verifyOtp
);

export default router;
