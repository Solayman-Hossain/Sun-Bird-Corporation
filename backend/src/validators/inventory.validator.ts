import { z } from 'zod';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const createBatchSchema = z.object({
  productId: z
    .string()
    .trim()
    .regex(objectIdRegex, 'Invalid MongoDB ObjectId for productId'),
  sku: z
    .string()
    .trim()
    .min(1, 'SKU is required')
    .transform((val) => val.toUpperCase()),
  batchNumber: z
    .string()
    .trim()
    .min(1, 'Batch number cannot be empty'),
  category: z.enum(['EXPIRY_CONTROLLED', 'NON_EXPIRING']),
  manufacturingDate: z
    .string()
    .datetime({ offset: true })
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/))
    .or(z.date())
    .optional(),
  expiryDate: z
    .string()
    .datetime({ offset: true })
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/))
    .or(z.date())
    .optional(),
  currentQty: z.number().min(0).default(0),
  unitCost: z.number().min(0, 'Unit cost cannot be negative'),
  warehouseId: z
    .string()
    .trim()
    .regex(objectIdRegex, 'Invalid MongoDB ObjectId for warehouseId'),
});

export const stockMovementSchema = z.object({
  sku: z
    .string()
    .trim()
    .min(1, 'SKU is required')
    .transform((val) => val.toUpperCase()),
  batchId: z
    .string()
    .trim()
    .regex(objectIdRegex, 'Invalid MongoDB ObjectId for batchId'),
  warehouseId: z
    .string()
    .trim()
    .regex(objectIdRegex, 'Invalid MongoDB ObjectId for warehouseId'),
  movementType: z.enum([
    'GRN',
    'DISPATCH_CHALLAN',
    'TRANSFER_IN',
    'TRANSFER_OUT',
    'PHYSICAL_ADJUSTMENT',
    'RETURN_RESTOCK',
    'PURCHASE_RECEIPT',
    'SALES_DISPATCH',
    'ADJUSTMENT',
  ]),
  qtyChange: z
    .number()
    .refine((val) => val !== 0, 'Quantity change cannot be zero'),
  unitCost: z.number().min(0).optional(),
  referenceNo: z
    .string()
    .trim()
    .min(1, 'Reference number cannot be empty'),
  referenceType: z
    .string()
    .trim()
    .min(1, 'Reference type cannot be empty'),
  notes: z.string().trim().optional(),
});

export const createSerialsSchema = z.object({
  productId: z
    .string()
    .trim()
    .regex(objectIdRegex, 'Invalid MongoDB ObjectId for productId'),
  batchId: z
    .string()
    .trim()
    .regex(objectIdRegex, 'Invalid MongoDB ObjectId for batchId'),
  serialList: z
    .array(z.string().trim().min(1, 'Serial number cannot be empty'))
    .min(1, 'At least one serial number must be provided'),
  warrantyMonths: z.number().int().min(0).default(12),
});

export const bindSerialSchema = z.object({
  serialNumber: z
    .string()
    .trim()
    .min(1, 'Serial number cannot be empty'),
  customerId: z
    .string()
    .trim()
    .regex(objectIdRegex, 'Invalid MongoDB ObjectId for customerId'),
  challanId: z
    .string()
    .trim()
    .regex(objectIdRegex, 'Invalid MongoDB ObjectId for challanId'),
  warrantyMonths: z.number().int().min(0).optional(),
});

export const verifyWarrantySchema = z.object({
  serialNumber: z
    .string()
    .trim()
    .min(1, 'Serial number cannot be empty'),
});

export type CreateBatchInput = z.infer<typeof createBatchSchema>;
export type StockMovementInput = z.infer<typeof stockMovementSchema>;
export type CreateSerialsInput = z.infer<typeof createSerialsSchema>;
export type BindSerialInput = z.infer<typeof bindSerialSchema>;
export type VerifyWarrantyInput = z.infer<typeof verifyWarrantySchema>;
