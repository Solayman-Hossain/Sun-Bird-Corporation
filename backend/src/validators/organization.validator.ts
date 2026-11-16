import { z } from 'zod';

export const createOrganizationSchema = z.object({
  organizationCode: z
    .string()
    .trim()
    .min(2, 'Organization code must be at least 2 characters')
    .max(20, 'Organization code maximum 20 characters')
    .toUpperCase(),
  legalName: z.string().trim().min(2, 'Legal name must be at least 2 characters'),
  displayName: z.string().trim().min(2, 'Display name must be at least 2 characters'),
  organizationType: z
    .enum([
      'PROPRIETORSHIP',
      'PARTNERSHIP',
      'PRIVATE_LIMITED',
      'PUBLIC_LIMITED',
      'GOVERNMENT',
      'NGO',
      'OTHER',
    ])
    .default('PRIVATE_LIMITED'),
  registrationNumber: z.string().trim().optional(),
  tradeLicenseNumber: z.string().trim().optional(),
  tinNumber: z.string().trim().optional(),
  binNumber: z.string().trim().optional(),
  vatRegistrationNumber: z.string().trim().optional(),
  email: z.string().trim().toLowerCase().email('Valid email is required'),
  phone: z.string().trim().min(5, 'Valid phone number is required'),
  alternatePhone: z.string().trim().optional(),
  website: z.string().trim().optional(),
  address: z.string().trim().min(3, 'Address is required'),
  city: z.string().trim().default('Dhaka'),
  district: z.string().trim().default('Dhaka'),
  postalCode: z.string().trim().optional(),
  country: z.string().trim().default('Bangladesh'),
  logo: z.string().trim().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
  isDefault: z.boolean().default(false),
  financialYearStart: z.string().trim().default('07-01'),
  currency: z.string().trim().default('BDT'),
  timezone: z.string().trim().default('Asia/Dhaka'),
});

export const updateOrganizationSchema = createOrganizationSchema.partial();

export const updateBrandingSchema = z.object({
  logoUrl: z.string().trim().optional(),
  altLogoUrl: z.string().trim().optional(),
  faviconUrl: z.string().trim().optional(),
  letterheadBgUrl: z.string().trim().optional(),
  primaryColor: z.string().trim().optional(),
  accentColor: z.string().trim().optional(),
  documentHeader: z.string().trim().optional(),
  documentFooter: z.string().trim().optional(),
  padPrintDefault: z.boolean().optional(),
});

export const bankAccountSchema = z.object({
  bankName: z.string().trim().min(2, 'Bank name is required'),
  branchName: z.string().trim().min(2, 'Branch name is required'),
  accountName: z.string().trim().min(2, 'Account name is required'),
  accountNumber: z.string().trim().min(4, 'Account number is required'),
  routingNumber: z.string().trim().optional(),
  swiftCode: z.string().trim().optional(),
  accountType: z.enum(['CURRENT', 'SAVINGS', 'MFS', 'OTHER']).default('CURRENT'),
  mfsProvider: z.enum(['NONE', 'BKASH', 'NAGAD', 'ROCKET', 'UPAY']).default('NONE'),
  currency: z.string().trim().default('BDT'),
  paymentInstructions: z.string().trim().optional(),
  isActive: z.boolean().default(true),
  isDefault: z.boolean().default(false),
});

export const signatorySchema = z.object({
  personName: z.string().trim().min(2, 'Signatory name is required'),
  designation: z.string().trim().min(2, 'Designation is required'),
  signatureImageUrl: z.string().trim().min(1, 'Signature image URL is required'),
  isActive: z.boolean().default(true),
  applicableDocuments: z.array(z.string().trim()).default([]),
});

export const stampSchema = z.object({
  stampName: z.string().trim().min(2, 'Stamp name is required'),
  stampType: z.enum(['OFFICIAL', 'APPROVAL', 'PAID', 'RECEIVED']).default('OFFICIAL'),
  stampImageUrl: z.string().trim().min(1, 'Stamp image URL is required'),
  isActive: z.boolean().default(true),
});

export const documentConfigSchema = z.object({
  quotationPrefix: z.string().trim().optional(),
  invoicePrefix: z.string().trim().optional(),
  challanPrefix: z.string().trim().optional(),
  receiptPrefix: z.string().trim().optional(),
  poPrefix: z.string().trim().optional(),
  showWatermark: z.boolean().optional(),
  showStampOnInvoice: z.boolean().optional(),
  showSignatureOnQuotation: z.boolean().optional(),
  showBankDetailsOnInvoice: z.boolean().optional(),
  defaultNotes: z.string().trim().optional(),
  termsAndConditions: z.array(z.string().trim()).optional(),
});

export const financialSettingsSchema = z.object({
  vatPercent: z.number().min(0).max(100).optional(),
  taxIdentificationType: z.string().trim().optional(),
  allowNegativeStock: z.boolean().optional(),
  enableFefo: z.boolean().optional(),
  defaultCostingMethod: z.enum(['FIFO', 'FEFO', 'WEIGHTED_AVERAGE']).optional(),
  fiscalYearMonths: z.number().min(1).max(12).optional(),
  retainedEarningsAccountCode: z.string().trim().optional(),
});

