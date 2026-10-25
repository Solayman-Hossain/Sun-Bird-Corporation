import { z } from 'zod';

export const sendOtpSchema = z.object({
  mobile: z
    .string()
    .trim()
    .min(10, 'Mobile number must be at least 10 digits')
    .max(15, 'Mobile number exceeds valid length')
    .regex(
      /^(\+8801|8801|01)[3-9]\d{8}$/,
      'Must be a valid Bangladeshi mobile operator number (e.g., 017XXXXXXXX)'
    ),
  purpose: z.string().optional().default('LOGIN'),
});

export const verifyOtpSchema = z.object({
  mobile: z
    .string()
    .trim()
    .min(10, 'Mobile number required')
    .regex(/^(\+8801|8801|01)[3-9]\d{8}$/, 'Valid Bangladeshi mobile number required'),
  otp: z.string().trim().length(6, 'OTP must be exactly 6 digits'),
  fullName: z.string().trim().min(2, 'Name must be at least 2 characters').optional(),
});

export const erpLoginSchema = z.object({
  email: z.string().trim().min(1, 'Email or mobile is required'),
  password: z.string().min(1, 'Password is required'),
  totpCode: z.string().trim().optional(),
  hardwareFingerprint: z.string().trim().optional(),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().trim().optional(),
});

export const verifyMfaSchema = z.object({
  totpCode: z.string().trim().min(6, 'TOTP code must be at least 6 characters'),
});
