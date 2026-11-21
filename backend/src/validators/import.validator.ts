import { z } from 'zod';

export const createImportLcExtendedSchema = z.object({
  lcNumber: z.string().trim().optional(),
  organizationId: z.string().trim(),
  supplierId: z.string().trim(),
  purchaseOrderId: z.string().trim().optional(),
  proformaInvoiceId: z.string().trim().optional(),
  proformaInvoiceNumber: z.string().trim().optional(),
  issuingBank: z.string().trim().min(2, 'Issuing bank is required'),
  advisingBank: z.string().trim().optional(),
  negotiatingBank: z.string().trim().optional(),
  confirmingBank: z.string().trim().optional(),
  foreignCurrency: z.enum(['USD', 'EUR', 'CNY', 'JPY', 'GBP']),
  lcValueFC: z.number().positive('LC value must be positive'),
  openingExchangeRate: z.number().positive('Opening exchange rate must be positive'),
  lcMarginPercentage: z.number().min(0).max(100).optional(),
  lcMarginAmountBDT: z.number().min(0).optional(),
  lcOpeningDate: z.string().or(z.date()).optional(),
  lcExpiryDate: z.string().or(z.date()).optional(),
  latestShipmentDate: z.string().or(z.date()).optional(),
  presentationPeriodDays: z.number().min(1).optional(),
  portOfLoading: z.string().trim().optional(),
  portOfDischarge: z.string().trim().optional(),
  incoterms: z.string().trim().optional(),
  paymentTerms: z.string().trim().optional(),
  tolerancePercentage: z.number().min(0).max(20).optional(),
  portFreeDays: z.number().min(0).optional(),
  demurrageDailyRateBDT: z.number().min(0).optional(),
  remarks: z.string().trim().optional(),
});

export const createProformaInvoiceSchema = z.object({
  piNumber: z.string().trim().min(2, 'PI number is required'),
  piDate: z.string().or(z.date()).optional(),
  organizationId: z.string().trim(),
  supplierId: z.string().trim(),
  countryOfOrigin: z.string().trim().optional(),
  currency: z.enum(['USD', 'EUR', 'CNY', 'JPY', 'GBP']),
  items: z.array(
    z.object({
      productId: z.string().trim().optional(),
      productName: z.string().trim().min(1, 'Product name is required'),
      sku: z.string().trim().optional(),
      hsCode: z.string().trim().optional(),
      quantity: z.number().positive(),
      unit: z.string().trim().default('PCS'),
      unitPriceFC: z.number().positive(),
      specification: z.string().trim().optional(),
    })
  ).min(1, 'At least 1 item is required'),
  freightFC: z.number().min(0).optional(),
  insuranceFC: z.number().min(0).optional(),
  discountFC: z.number().min(0).optional(),
  incoterms: z.string().trim().optional(),
  paymentTerms: z.string().trim().optional(),
  portOfLoading: z.string().trim().optional(),
  portOfDischarge: z.string().trim().optional(),
  estimatedShipmentDate: z.string().or(z.date()).optional(),
  validityDate: z.string().or(z.date()).optional(),
  purchaseOrderId: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

export const createLCAmendmentSchema = z.object({
  lcId: z.string().trim(),
  organizationId: z.string().trim(),
  amendmentDate: z.string().or(z.date()).optional(),
  revisedAmountFC: z.number().positive().optional(),
  revisedExpiryDate: z.string().or(z.date()).optional(),
  revisedShipmentDate: z.string().or(z.date()).optional(),
  changedClauses: z.string().trim().min(2, 'Changed clauses explanation is required'),
  reason: z.string().trim().min(2, 'Amendment reason is required'),
  amendmentChargesBDT: z.number().min(0).optional(),
  bankConfirmationRef: z.string().trim().optional(),
  bankConfirmationDate: z.string().or(z.date()).optional(),
});

export const createShipmentSchema = z.object({
  lcId: z.string().trim(),
  organizationId: z.string().trim(),
  supplierId: z.string().trim(),
  purchaseOrderId: z.string().trim().optional(),
  shipmentNumber: z.number().min(1).optional(),
  shipmentMode: z.enum(['SEA', 'AIR', 'ROAD']),
  vesselName: z.string().trim().optional(),
  voyageNumber: z.string().trim().optional(),
  flightNumber: z.string().trim().optional(),
  containerNumbers: z.array(z.string().trim()).optional(),
  blOrAwbNumber: z.string().trim().min(2, 'BL or AWB number is required'),
  blOrAwbDate: z.string().or(z.date()).optional(),
  freightForwarder: z.string().trim().optional(),
  shippingLine: z.string().trim().optional(),
  portOfLoading: z.string().trim().min(2),
  portOfDischarge: z.string().trim().min(2),
  etd: z.string().or(z.date()),
  eta: z.string().or(z.date()),
  shipmentQuantity: z.number().positive(),
  shipmentValueFC: z.number().positive(),
  currency: z.string().trim().optional(),
  remarks: z.string().trim().optional(),
  commercialInvoice: z
    .object({
      invoiceNumber: z.string().trim(),
      invoiceDate: z.string().or(z.date()),
      totalAmountFC: z.number().positive(),
      currency: z.string().trim(),
      fileUrl: z.string().optional(),
    })
    .optional(),
  packingList: z
    .object({
      packingListNumber: z.string().trim(),
      totalPackages: z.number().min(1),
      grossWeightKg: z.number().min(0),
      netWeightKg: z.number().min(0),
      measurementCbm: z.number().min(0).optional(),
      fileUrl: z.string().optional(),
    })
    .optional(),
});

export const addTrackingEventSchema = z.object({
  location: z.string().trim().min(2, 'Location is required'),
  status: z.string().trim().min(2, 'Status is required'),
  description: z.string().trim().min(2, 'Description is required'),
  source: z.string().trim().optional(),
  timestamp: z.string().or(z.date()).optional(),
});

export const createCustomsClearanceSchema = z.object({
  billOfEntryNumber: z.string().trim().min(2, 'Bill of Entry number is required'),
  billOfEntryDate: z.string().or(z.date()),
  organizationId: z.string().trim(),
  lcId: z.string().trim(),
  shipmentId: z.string().trim().optional(),
  customsHouse: z.string().trim().optional(),
  cfAgentName: z.string().trim().optional(),
  cfAgentPhone: z.string().trim().optional(),
  hsCodes: z.array(z.string().trim()).optional(),
  assessableValueBDT: z.number().positive(),
  customsDutyBDT: z.number().min(0).optional(),
  regulatoryDutyBDT: z.number().min(0).optional(),
  supplementaryDutyBDT: z.number().min(0).optional(),
  vatBDT: z.number().min(0).optional(),
  advanceTaxBDT: z.number().min(0).optional(),
  advanceIncomeTaxBDT: z.number().min(0).optional(),
  otherGovtChargesBDT: z.number().min(0).optional(),
  portChargesBDT: z.number().min(0).optional(),
  cfAgentChargesBDT: z.number().min(0).optional(),
  demurrageChargesBDT: z.number().min(0).optional(),
  detentionChargesBDT: z.number().min(0).optional(),
  notes: z.string().trim().optional(),
});

export const recordImportPaymentSchema = z.object({
  organizationId: z.string().trim(),
  lcId: z.string().trim(),
  supplierId: z.string().trim().optional(),
  bankName: z.string().trim().min(2, 'Bank name is required'),
  paymentType: z.enum([
    'LC_MARGIN',
    'LC_OPENING_COMMISSION',
    'LC_AMENDMENT_FEE',
    'SUPPLIER_ADVANCE',
    'SIGHT_PAYMENT',
    'USANCE_PAYMENT',
    'DEFERRED_PAYMENT',
    'BANK_CHARGES',
    'FREIGHT_PAYMENT',
    'INSURANCE_PAYMENT',
    'CUSTOMS_DUTY_PAYMENT',
    'PORT_CHARGES_PAYMENT',
    'CF_AGENT_PAYMENT',
    'OTHER',
  ]),
  currency: z.string().trim().optional(),
  foreignAmount: z.number().positive(),
  exchangeRate: z.number().positive(),
  paymentDate: z.string().or(z.date()).optional(),
  maturityDate: z.string().or(z.date()).optional(),
  paymentMethod: z.enum(['BANK_TRANSFER', 'PAY_ORDER', 'EFTN', 'RTGS', 'LC_DEBIT']).optional(),
  transactionReference: z.string().trim().min(2, 'Transaction reference is required'),
  bankAccountId: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

export const uploadDocumentSchema = z.object({
  documentNumber: z.string().trim().optional(),
  documentType: z.string().trim(),
  title: z.string().trim().min(2, 'Title is required'),
  organizationId: z.string().trim(),
  lcId: z.string().trim().optional(),
  shipmentId: z.string().trim().optional(),
  supplierId: z.string().trim().optional(),
  fileUrl: z.string().trim().min(1, 'File URL is required'),
  fileName: z.string().trim().min(1, 'File name is required'),
  fileSize: z.number().positive(),
  mimeType: z.string().trim().optional(),
  issueDate: z.string().or(z.date()).optional(),
  expiryDate: z.string().or(z.date()).optional(),
  tags: z.array(z.string().trim()).optional(),
  remarks: z.string().trim().optional(),
});

export const aiQuerySchema = z.object({
  query: z.string().trim().min(1, 'Query is required'),
  organizationId: z.string().trim().optional(),
});

export const aiExtractSchema = z.object({
  textOrFilename: z.string().trim().min(1),
  documentType: z.string().trim().default('PROFORMA_INVOICE'),
});

export const aiCompareSchema = z.object({
  docA: z.object({
    type: z.string(),
    reference: z.string(),
    totalAmount: z.number(),
    currency: z.string(),
    items: z.array(z.any()),
  }),
  docB: z.object({
    type: z.string(),
    reference: z.string(),
    totalAmount: z.number(),
    currency: z.string(),
    items: z.array(z.any()),
  }),
});
