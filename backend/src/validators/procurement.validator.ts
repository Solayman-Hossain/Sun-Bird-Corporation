import { z } from 'zod';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const createSupplierSchema = z.object({
  supplierCode: z
    .string()
    .trim()
    .min(2, 'Supplier code must be at least 2 characters')
    .max(50, 'Supplier code must not exceed 50 characters')
    .transform((val) => val.toUpperCase()),
  companyName: z
    .string()
    .trim()
    .min(1, 'Company name is required')
    .max(255, 'Company name must not exceed 255 characters'),
  contactPerson: z.string().trim().optional(),
  email: z.string().trim().toLowerCase().email('Valid email address required').optional(),
  phone: z.string().trim().optional(),
  address: z.string().trim().optional(),
  country: z.string().trim().min(1, 'Country is required').default('Bangladesh'),
  currency: z.enum(['BDT', 'USD', 'EUR', 'CNY', 'JPY']).default('BDT'),
  supplierType: z.enum(['LOCAL', 'FOREIGN', 'INDENTING_AGENT']),
  paymentTerms: z.string().trim().optional(),
  bankDetails: z.string().trim().optional(),
  swiftCode: z.string().trim().toUpperCase().optional(),
  userId: z.string().trim().regex(objectIdRegex, 'Invalid User ObjectId').optional(),
  aiRiskScore: z.number().min(0).max(100).optional(),
});

export const updateSupplierSchema = createSupplierSchema.partial();

export const linkSupplierUserSchema = z.object({
  userId: z
    .string()
    .trim()
    .regex(objectIdRegex, 'Invalid User ObjectId format'),
});

export const broadcastRfqSchema = z.object({
  rfqNumber: z
    .string()
    .trim()
    .min(2, 'RFQ number must be at least 2 characters')
    .transform((val) => val.toUpperCase()),
  title: z
    .string()
    .trim()
    .min(1, 'Title is required'),
  productId: z
    .string()
    .trim()
    .regex(objectIdRegex, 'Invalid Product ObjectId'),
  targetQuantity: z.number().int().min(1, 'Target quantity must be at least 1'),
  uom: z.string().trim().optional(),
  targetDeliveryDate: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
  deadline: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  invitedSuppliers: z
    .array(z.string().trim().regex(objectIdRegex, 'Invalid Supplier ObjectId'))
    .optional(),
  notes: z.string().trim().optional(),
});

export const submitQuotationSchema = z.object({
  rfqNumber: z
    .string()
    .trim()
    .min(1, 'RFQ number is required')
    .transform((val) => val.toUpperCase()),
  supplierId: z
    .string()
    .trim()
    .regex(objectIdRegex, 'Invalid Supplier ObjectId')
    .optional(), // Optional if submitted by authenticated vendor portal user
  productId: z
    .string()
    .trim()
    .regex(objectIdRegex, 'Invalid Product ObjectId'),
  sku: z
    .string()
    .trim()
    .min(1, 'SKU is required')
    .transform((val) => val.toUpperCase()),
  quotedUnitPrice: z.number().min(0, 'Unit price cannot be negative'),
  currency: z.enum(['BDT', 'USD', 'EUR', 'CNY']).default('USD'),
  leadTimeDays: z.number().int().min(0, 'Lead time cannot be negative'),
  paymentTerms: z.string().trim().optional(),
  moq: z.number().int().min(1).default(1),
  validUntil: z
    .string()
    .datetime({ offset: true })
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/))
    .optional(),
  aiRiskFlags: z.array(z.string().trim()).optional().default([]),
});

export const compileCsSchema = z.object({
  rfqNumber: z
    .string()
    .trim()
    .min(1, 'RFQ number is required')
    .transform((val) => val.toUpperCase()),
  csNumber: z
    .string()
    .trim()
    .min(1)
    .transform((val) => val.toUpperCase())
    .optional(),
});

export const createPoFromCsSchema = z.object({
  csId: z
    .string()
    .trim()
    .regex(objectIdRegex, 'Invalid Comparative Statement ObjectId'),
  winningBidId: z
    .string()
    .trim()
    .min(1, 'Winning bid identifier is required'),
  quantity: z.number().int().min(1).optional(),
  exchangeRate: z.number().min(0.0001).optional(),
  deliveryWarehouseId: z
    .string()
    .trim()
    .regex(objectIdRegex, 'Invalid Warehouse ObjectId')
    .optional(),
  deliveryDeadline: z
    .string()
    .datetime({ offset: true })
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/))
    .optional(),
  taxAmount: z.number().min(0).optional(),
  shippingTerms: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

export const createImportLcSchema = z.object({
  lcNumber: z
    .string()
    .trim()
    .min(1)
    .transform((val) => val.toUpperCase())
    .optional(),
  version: z.string().trim().optional(),
  supplierId: z
    .string()
    .trim()
    .regex(objectIdRegex, 'Invalid Supplier ObjectId'),
  purchaseOrderId: z
    .string()
    .trim()
    .regex(objectIdRegex, 'Invalid Purchase Order ObjectId')
    .optional(),
  issuingBank: z.string().trim().min(1, 'Issuing bank is required'),
  foreignCurrency: z.enum(['USD', 'EUR', 'CNY', 'JPY']),
  lcValueFC: z.number().min(0.01, 'LC value must be positive'),
  openingExchangeRate: z.number().min(0.01, 'Opening exchange rate must be positive'),
  portFreeDays: z.number().int().min(0).optional(),
  demurrageDailyRateBDT: z.number().min(0).optional(),
});

export const transitionLcStageSchema = z.object({
  nextStage: z.enum([
    'DRAFT',
    'LC_OPENED',
    'IN_TRANSIT',
    'SHIPMENT_IN_TRANSIT',
    'PORT_ARRIVED',
    'CUSTOMS_ASSESSED',
    'CUSTOMS_CLEARED',
    'PORT_CLEARED',
    'FINAL_SETTLEMENT',
    'SETTLED',
    'AMENDED',
  ]),
  portArrivalDate: z
    .string()
    .datetime({ offset: true })
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/))
    .optional(),
  customsClearanceDate: z
    .string()
    .datetime({ offset: true })
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/))
    .optional(),
  notes: z.string().trim().optional(),
});

export const recordCustomsAssessmentSchema = z.object({
  customsAssessmentRate: z.number().min(0.01, 'Customs rate must be positive'),
  assessmentDate: z
    .string()
    .datetime({ offset: true })
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/))
    .optional(),
});

export const settleLcSchema = z.object({
  finalSettlementRate: z.number().min(0.01, 'Final settlement rate must be positive'),
  settlementDate: z
    .string()
    .datetime({ offset: true })
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/))
    .optional(),
});

export const calculateDemurrageSchema = z.object({
  arrivalDate: z
    .string()
    .datetime({ offset: true })
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  clearanceDate: z
    .string()
    .datetime({ offset: true })
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  freeDays: z.number().int().min(0).optional(),
  dailyRateBDT: z.number().min(0).optional(),
});

export const createLandedCostSchema = z.object({
  lcId: z
    .string()
    .trim()
    .regex(objectIdRegex, 'Invalid Import LC ObjectId'),
  costBreakdown: z.object({
    fobValueBDT: z.number().min(0).optional(),
    customsDuty: z.number().min(0).optional(),
    regulatoryDuty: z.number().min(0).optional(),
    advanceIncomeTax: z.number().min(0).optional(),
    vatAmount: z.number().min(0).optional(),
    cfAgentCharges: z.number().min(0).optional(),
    portDemurragePenalty: z.number().min(0).optional(),
    portHandlingCharges: z.number().min(0).optional(),
    inlandFreight: z.number().min(0).optional(),
    marineInsurance: z.number().min(0).optional(),
    bankCharges: z.number().min(0).optional(),
    otherCharges: z.number().min(0).optional(),
  }),
  allocationMethod: z.enum(['BY_VALUE', 'BY_QUANTITY', 'BY_WEIGHT']),
  items: z.array(
    z.object({
      productId: z
        .string()
        .trim()
        .regex(objectIdRegex, 'Invalid Product ObjectId'),
      sku: z.string().trim().min(1),
      quantity: z.number().int().min(1),
      fobValueBDT: z.number().min(0),
      weightKg: z.number().min(0).optional(),
    })
  ).min(1, 'Consignment must contain at least 1 item for landed cost allocation'),
});

export type CreateSupplierInput = z.infer<typeof createSupplierSchema>;
export type UpdateSupplierInput = z.infer<typeof updateSupplierSchema>;
export type BroadcastRfqInput = z.infer<typeof broadcastRfqSchema>;
export type SubmitQuotationInput = z.infer<typeof submitQuotationSchema>;
export type CompileCsInput = z.infer<typeof compileCsSchema>;
export type CreatePoFromCsInput = z.infer<typeof createPoFromCsSchema>;
export type CreateImportLcInput = z.infer<typeof createImportLcSchema>;
export type TransitionLcStageInput = z.infer<typeof transitionLcStageSchema>;
export type CreateLandedCostInput = z.infer<typeof createLandedCostSchema>;



