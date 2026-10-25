import { z } from 'zod';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;
const mobileRegex = /^(\+8801|8801|01)[3-9]\d{8}$/;

export const createUserSchema = z.object({
  fullName: z.string().trim().min(2, 'Full name must be at least 2 characters'),
  email: z.string().trim().toLowerCase().email('Valid email address required'),
  mobile: z.string().trim().regex(mobileRegex, 'Valid Bangladeshi mobile number required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  userType: z.enum(['STAFF', 'DIRECTOR', 'SUPER_ADMIN', 'VENDOR', 'RESELLER', 'CUSTOMER']),
  roleId: z.string().trim().regex(objectIdRegex, 'Invalid role ObjectId format').optional(),
  branchId: z.string().trim().regex(objectIdRegex, 'Invalid branch ObjectId format').optional(),
  warehouseId: z.string().trim().regex(objectIdRegex, 'Invalid warehouse ObjectId format').optional(),
  hardwareFingerprint: z.string().trim().optional(),
});

export const updateUserSchema = z.object({
  fullName: z.string().trim().min(2, 'Full name must be at least 2 characters').optional(),
  email: z.string().trim().toLowerCase().email('Valid email address required').optional(),
  mobile: z.string().trim().regex(mobileRegex, 'Valid Bangladeshi mobile number required').optional(),
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
  userType: z.enum(['STAFF', 'DIRECTOR', 'SUPER_ADMIN', 'VENDOR', 'RESELLER', 'CUSTOMER']).optional(),
  roleId: z.string().trim().regex(objectIdRegex, 'Invalid role ObjectId format').nullable().optional(),
  branchId: z.string().trim().regex(objectIdRegex, 'Invalid branch ObjectId format').nullable().optional(),
  warehouseId: z.string().trim().regex(objectIdRegex, 'Invalid warehouse ObjectId format').nullable().optional(),
  hardwareFingerprint: z.string().trim().optional(),
  isActive: z.boolean().optional(),
});
