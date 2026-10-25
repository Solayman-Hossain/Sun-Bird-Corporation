import { z } from 'zod';

// ── Chart of Accounts Validator ──────────────────────────────────────────────
export const createCoaSchema = z.object({
  accountCode: z.number().int().min(1000).max(9999),
  accountName: z.string().min(2).max(150),
  accountType: z.enum(['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE']),
  normalBalance: z.enum(['DEBIT', 'CREDIT']),
  parentCode: z.number().int().optional(),
  isControl: z.boolean().optional().default(false),
});

// ── Journal Entry Line & Voucher Validator ──────────────────────────────────
export const journalLineSchema = z.object({
  accountId: z.string().optional(),
  accountCode: z.number().int(),
  accountName: z.string().optional(),
  debit: z.number().min(0).default(0),
  credit: z.number().min(0).default(0),
  description: z.string().optional(),
});

export const createJournalVoucherSchema = z.object({
  voucherType: z.enum(['SALES', 'PURCHASE', 'PAYMENT', 'RECEIPT', 'CONTRA', 'JOURNAL']),
  transactionDate: z.string().or(z.date()).optional(),
  sourceDocumentRef: z.string().min(1),
  lines: z.array(journalLineSchema).min(2),
  notes: z.string().optional(),
  status: z.enum(['DRAFT', 'SUBMITTED', 'POSTED']).optional(),
});

export const reverseJournalSchema = z.object({
  reason: z.string().min(3),
});

// ── Fixed Assets Validators ──────────────────────────────────────────────────
export const registerAssetSchema = z.object({
  assetCode: z.string().optional(),
  assetName: z.string().min(2),
  category: z.string().min(2),
  serialTagNo: z.string().optional(),
  purchaseDate: z.string().or(z.date()).optional(),
  purchaseCost: z.number().positive().optional(),
  purchasePriceBDT: z.number().positive().optional(),
  residualValue: z.number().min(0).optional(),
  salvageValueBDT: z.number().min(0).optional(),
  usefulLifeYears: z.number().positive().optional(),
  usefulLifeMonths: z.number().positive().optional(),
  depreciationMethod: z.enum(['SLM', 'WDV']).optional().default('SLM'),
  custodian: z.string().optional(),
  warehouseId: z.string().optional(),
  warrantyExpiry: z.string().or(z.date()).optional(),
});

export const runDepreciationSchema = z.object({
  fiscalMonthYear: z.string().regex(/^\d{4}-\d{2}$/, 'Must be in YYYY-MM format (e.g. 2026-10)'),
});

export const disposeAssetSchema = z.object({
  disposalDate: z.string().or(z.date()).optional(),
  disposalValue: z.number().min(0).optional(),
  status: z.enum(['DISPOSED', 'SOLD']).optional().default('DISPOSED'),
  reason: z.string().optional(),
});

// ── Loan Validators ──────────────────────────────────────────────────────────
export const createLoanSchema = z.object({
  loanCode: z.string().optional(),
  loanType: z.enum([
    'BANK_LOAN',
    'PARTNER_DIRECTOR_LOAN',
    'SUPPLIER_CREDIT',
    'EMPLOYEE_LOAN',
    'CUSTOMER_ADVANCE',
  ]),
  borrowerId: z.string().min(1),
  borrowerType: z.enum(['EMPLOYEE', 'PARTNER', 'CUSTOMER', 'COMPANY']),
  lenderId: z.string().optional(),
  principalBDT: z.number().positive(),
  isInterestFree: z.boolean().optional(),
  interestRate: z.number().min(0).optional().default(0),
  interestMethod: z.enum(['FLAT', 'REDUCING_BALANCE']).optional().default('REDUCING_BALANCE'),
  startDate: z.string().or(z.date()).optional(),
  tenureMonths: z.number().int().positive(),
  contractDocUrl: z.string().optional(),
  postDisbursementJv: z.boolean().optional(),
});

export const recordLoanRepaymentSchema = z.object({
  paymentAmount: z.number().positive(),
  paymentAccountCode: z.number().int().optional(),
  transactionDate: z.string().or(z.date()).optional(),
  notes: z.string().optional(),
});

// ── Partner Validators ───────────────────────────────────────────────────────
export const createPartnerSchema = z.object({
  userId: z.string().min(1),
  partnerName: z.string().min(2),
  capitalContribution: z.number().min(0),
  currentAccountBalance: z.number().optional().default(0),
  joinedDate: z.string().or(z.date()).optional(),
  profitShareRatio: z.number().min(0).max(100).optional().default(0),
  drawingsBalance: z.number().optional().default(0),
  isEligibleForAllocation: z.boolean().optional().default(true),
});

export const distributeProfitSchema = z.object({
  fiscalYear: z.string().min(4),
  netProfitBDT: z.number().positive(),
});

export const recordDrawingsSchema = z.object({
  amountBDT: z.number().positive(),
  paymentAccountCode: z.number().int().optional(),
  transactionDate: z.string().or(z.date()).optional(),
  notes: z.string().optional(),
});
