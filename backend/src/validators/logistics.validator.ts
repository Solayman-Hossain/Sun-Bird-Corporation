import { z } from 'zod';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const bookConsignmentSchema = z.object({
  orderId: z.string().trim().regex(objectIdRegex, 'Invalid Order ObjectId'),
  courierProvider: z.enum(['PATHAO', 'STEADFAST']),
  recipientName: z.string().trim().optional(),
  recipientPhone: z.string().trim().optional(),
  recipientAddress: z.string().trim().optional(),
  recipientCity: z.union([z.string().trim(), z.number()]).optional(),
  recipientZone: z.union([z.string().trim(), z.number()]).optional(),
  codAmount: z.number().nonnegative('COD amount must be non-negative').optional(),
  itemWeightKg: z.number().positive('Item weight must be greater than zero').optional(),
  challanId: z.string().trim().regex(objectIdRegex, 'Invalid Challan ObjectId').optional(),
  instructions: z.string().trim().optional(),
});
