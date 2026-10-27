import { z } from 'zod';

export const updateCustomerProfileSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters').max(100).optional(),
  email: z.string().email('Invalid email address format').optional(),
  billingAddress: z.string().max(300, 'Billing address cannot exceed 300 characters').optional(),
  shippingAddress: z.string().max(300, 'Shipping address cannot exceed 300 characters').optional(),
  companyName: z.string().max(150, 'Company name cannot exceed 150 characters').optional(),
  buyerBin: z.string().max(50, 'Buyer BIN cannot exceed 50 characters').optional(),
});

export type UpdateCustomerProfileInput = z.infer<typeof updateCustomerProfileSchema>;
