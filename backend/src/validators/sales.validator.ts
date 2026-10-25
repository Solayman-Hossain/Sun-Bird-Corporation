import { z } from 'zod';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const checkoutItemSchema = z.object({
  productId: z.string().trim().regex(objectIdRegex, 'Invalid Product ObjectId'),
  sku: z.string().trim().min(1, 'SKU is required'),
  productName: z.string().trim().min(1, 'Product name is required'),
  quantity: z.number().int().positive('Quantity must be greater than zero'),
  unitPrice: z.number().nonnegative('Unit price must be non-negative'),
  lineTotal: z.number().nonnegative('Line total must be non-negative').optional(),
});

export const publicCheckoutSchema = z.object({
  customerName: z.string().trim().min(1, 'Customer name is required'),
  customerMobile: z.string().trim().min(11, 'Mobile number must be at least 11 digits'),
  customerEmail: z.string().trim().toLowerCase().email('Invalid email address').optional(),
  deliveryAddress: z.string().trim().min(5, 'Delivery address is required'),
  district: z.string().trim().min(2, 'District is required'),
  paymentMethod: z.enum(['COD', 'ONLINE', 'ONLINE_SSLCOMMERZ', 'BANK_TRANSFER', 'CREDIT']),
  items: z.array(checkoutItemSchema).min(1, 'Order must contain at least one line item'),
  shippingFee: z.number().nonnegative().optional().default(0),
  discountAmount: z.number().nonnegative().optional().default(0),
});

export const updateCreditProfileSchema = z.object({
  creditLimitBDT: z.number().nonnegative('Credit limit must be non-negative').optional(),
  creditTermDays: z.number().int().nonnegative('Credit terms must be non-negative').optional(),
  isCreditLocked: z.boolean().optional(),
});

export const directorOverrideCreditSchema = z.object({
  reason: z.string().trim().min(3, 'Business justification is required for Director credit override'),
  totpCode: z.string().trim().optional(),
});

export const challanItemSchema = z.object({
  productId: z.string().trim().regex(objectIdRegex, 'Invalid Product ObjectId'),
  sku: z.string().trim().min(1, 'SKU is required'),
  productNameEn: z.string().trim().min(1, 'English product description required'),
  productNameBn: z.string().trim().min(1, 'Bangla product description required'),
  hsCode: z.string().trim().min(8, '8-digit NBR HS Code is required'),
  batchNumber: z.string().trim().min(1, 'Batch number is required'),
  dispatchedQty: z.number().positive('Dispatched quantity must be positive'),
  uom: z.string().trim().min(1, 'UOM is required'),
  unitPriceBDT: z.number().nonnegative('Unit price must be non-negative'),
  vatRate: z.number().nonnegative().optional().default(15),
  sdRate: z.number().nonnegative().optional().default(0),
  dispatchedSerials: z.array(z.string().trim()).optional(),
});

export const createChallanSchema = z.object({
  orderId: z.string().trim().regex(objectIdRegex, 'Invalid Order ObjectId'),
  customerId: z.string().trim().regex(objectIdRegex, 'Invalid Customer ObjectId'),
  items: z.array(challanItemSchema).min(1, 'Challan must contain at least one line item'),
  vehicleNumber: z.string().trim().optional(),
  driverName: z.string().trim().optional(),
  transporterType: z.enum(['PATHAO', 'STEADFAST', 'OWN_FLEET', 'THIRD_PARTY']).optional(),
  cartonCount: z.number().int().positive().optional().default(1),
});

export const createInvoiceSchema = z.object({
  orderId: z.string().trim().regex(objectIdRegex, 'Invalid Order ObjectId'),
  customerId: z.string().trim().regex(objectIdRegex, 'Invalid Customer ObjectId'),
  challanId: z.string().trim().regex(objectIdRegex, 'Invalid Challan ObjectId').optional(),
  branchId: z.string().trim().optional(),
  subtotal: z.number().nonnegative('Subtotal must be non-negative'),
  discountAmount: z.number().nonnegative().optional().default(0),
  vatRate: z.number().nonnegative().optional().default(15),
  dueInDays: z.number().int().nonnegative().optional().default(30),
});
