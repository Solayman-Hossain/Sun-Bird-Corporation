import { z } from 'zod';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const posItemSchema = z.object({
  productId: z.string().trim().regex(objectIdRegex, 'Invalid Product ObjectId').optional(),
  sku: z.string().trim().min(1, 'SKU is required'),
  batchId: z.string().trim().regex(objectIdRegex, 'Invalid Batch ObjectId').optional(),
  quantity: z.number().int().positive('Quantity must be greater than zero'),
  unitPrice: z.number().nonnegative('Unit price must be non-negative'),
  lineTotal: z.number().nonnegative().optional(),
  uom: z.string().trim().optional(),
  productName: z.string().trim().optional(),
});

export const posCheckoutSchema = z.object({
  showroomWarehouseId: z
    .string()
    .trim()
    .regex(objectIdRegex, 'Invalid Showroom Warehouse ObjectId'),
  customerMobile: z.string().trim().optional(),
  customerName: z.string().trim().optional(),
  customerId: z.string().trim().regex(objectIdRegex, 'Invalid Customer ObjectId').optional(),
  paymentMethod: z.enum(['CASH', 'MFS_BKASH', 'MFS_NAGAD', 'CARD', 'MIXED_SPLIT']),
  items: z.array(posItemSchema).min(1, 'POS cart must contain at least one line item'),
  paidAmount: z.number().nonnegative('Paid amount must be non-negative'),
  discountAmount: z.number().nonnegative().optional().default(0),
  notes: z.string().trim().optional(),
});

export const posOfflineSyncSchema = z.object({
  transactions: z.array(posCheckoutSchema).min(1, 'Offline sync requires at least one transaction'),
});
