import { Router } from 'express';
import { AuthController } from '../../controllers/AuthController';
import { authGuard } from '../../middlewares/authGuard';
import { validateRequest } from '../../middlewares/validateRequest';
import {
  erpLoginSchema,
  refreshTokenSchema,
  verifyMfaSchema,
} from '../../validators/auth.validator';

const router = Router();

/**
 * @route   POST /api/v1/erp/auth/login
 * @desc    Authenticates ERP staff via credentials and optional MFA/device fingerprint
 * @access  Public (ERP Gateway)
 */
router.post(
  '/login',
  validateRequest({ body: erpLoginSchema }),
  AuthController.erpLogin
);

/**
 * @route   POST /api/v1/erp/auth/refresh-token
 * @desc    Rotates refresh token in refresh_tokens collection, emits new access token & refresh cookie
 * @access  Public (Reads HTTP-Only Cookie or Request Body)
 */
router.post(
  '/refresh-token',
  validateRequest({ body: refreshTokenSchema }),
  AuthController.refreshToken
);

/**
 * @route   POST /api/v1/erp/auth/logout
 * @desc    Revokes refresh token and clears HTTP-Only cookie
 * @access  Public / Authenticated
 */
router.post('/logout', AuthController.logout);

/**
 * @route   POST /api/v1/erp/auth/setup-mfa
 * @desc    Generates TOTP secret and otpauth URI for staff/director
 * @access  Bearer JWT
 */
router.post('/setup-mfa', authGuard, AuthController.setupMfa);

/**
 * @route   POST /api/v1/erp/auth/verify-mfa
 * @desc    Confirms TOTP code and activates MFA on account
 * @access  Bearer JWT
 */
router.post(
  '/verify-mfa',
  authGuard,
  validateRequest({ body: verifyMfaSchema }),
  AuthController.verifyMfa
);

export default router;
