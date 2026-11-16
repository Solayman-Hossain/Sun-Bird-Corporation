import { Schema, model, Document, Types } from 'mongoose';

export type OrganizationType =
  | 'PROPRIETORSHIP'
  | 'PARTNERSHIP'
  | 'PRIVATE_LIMITED'
  | 'PUBLIC_LIMITED'
  | 'GOVERNMENT'
  | 'NGO'
  | 'OTHER';

export type OrganizationStatus = 'ACTIVE' | 'INACTIVE';

export interface IBankAccount {
  bankId: string;
  bankName: string;
  branchName: string;
  accountName: string;
  accountNumber: string;
  routingNumber?: string;
  swiftCode?: string;
  accountType: 'CURRENT' | 'SAVINGS' | 'MFS' | 'OTHER';
  mfsProvider?: 'NONE' | 'BKASH' | 'NAGAD' | 'ROCKET' | 'UPAY';
  currency: string;
  paymentInstructions?: string;
  isActive: boolean;
  isDefault: boolean;
}

export interface ISignatory {
  signatoryId: string;
  personName: string;
  designation: string;
  signatureImageUrl: string;
  isActive: boolean;
  applicableDocuments: string[];
}

export interface IStamp {
  stampId: string;
  stampName: string;
  stampType: 'OFFICIAL' | 'APPROVAL' | 'PAID' | 'RECEIVED';
  stampImageUrl: string;
  isActive: boolean;
}

export interface IBrandingConfig {
  logoUrl?: string;
  altLogoUrl?: string;
  faviconUrl?: string;
  letterheadBgUrl?: string;
  primaryColor?: string;
  accentColor?: string;
  documentHeader?: string;
  documentFooter?: string;
  padPrintDefault?: boolean;
}

export interface IDocumentConfig {
  quotationPrefix?: string;
  invoicePrefix?: string;
  challanPrefix?: string;
  receiptPrefix?: string;
  poPrefix?: string;
  showWatermark?: boolean;
  showStampOnInvoice?: boolean;
  showSignatureOnQuotation?: boolean;
  showBankDetailsOnInvoice?: boolean;
  defaultNotes?: string;
  termsAndConditions?: string[];
}

export interface IFinancialSettings {
  vatPercent?: number;
  taxIdentificationType?: string;
  allowNegativeStock?: boolean;
  enableFefo?: boolean;
  defaultCostingMethod?: 'FIFO' | 'FEFO' | 'WEIGHTED_AVERAGE';
  fiscalYearMonths?: number;
  retainedEarningsAccountCode?: string;
}

export interface IOrganization extends Document {
  _id: Types.ObjectId;
  organizationCode: string;
  legalName: string;
  displayName: string;
  organizationType: OrganizationType;
  registrationNumber?: string;
  tradeLicenseNumber?: string;
  tinNumber?: string;
  binNumber?: string;
  vatRegistrationNumber?: string;
  email: string;
  phone: string;
  alternatePhone?: string;
  website?: string;
  address: string;
  city: string;
  district: string;
  postalCode?: string;
  country: string;
  logo?: string;
  status: OrganizationStatus;
  isDefault: boolean;
  financialYearStart: string;
  currency: string;
  timezone: string;
  branding: IBrandingConfig;
  bankAccounts: IBankAccount[];
  signatories: ISignatory[];
  stamps: IStamp[];
  documentConfig: IDocumentConfig;
  financialSettings: IFinancialSettings;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const BankAccountSchema = new Schema<IBankAccount>(
  {
    bankId: { type: String, required: true },
    bankName: { type: String, required: true, trim: true },
    branchName: { type: String, required: true, trim: true },
    accountName: { type: String, required: true, trim: true },
    accountNumber: { type: String, required: true, trim: true },
    routingNumber: { type: String, trim: true },
    swiftCode: { type: String, trim: true },
    accountType: {
      type: String,
      enum: ['CURRENT', 'SAVINGS', 'MFS', 'OTHER'],
      default: 'CURRENT',
    },
    mfsProvider: {
      type: String,
      enum: ['NONE', 'BKASH', 'NAGAD', 'ROCKET', 'UPAY'],
      default: 'NONE',
    },
    currency: { type: String, default: 'BDT', trim: true },
    paymentInstructions: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
    isDefault: { type: Boolean, default: false },
  },
  { _id: false }
);

const SignatorySchema = new Schema<ISignatory>(
  {
    signatoryId: { type: String, required: true },
    personName: { type: String, required: true, trim: true },
    designation: { type: String, required: true, trim: true },
    signatureImageUrl: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    applicableDocuments: [{ type: String, trim: true }],
  },
  { _id: false }
);

const StampSchema = new Schema<IStamp>(
  {
    stampId: { type: String, required: true },
    stampName: { type: String, required: true, trim: true },
    stampType: {
      type: String,
      enum: ['OFFICIAL', 'APPROVAL', 'PAID', 'RECEIVED'],
      default: 'OFFICIAL',
    },
    stampImageUrl: { type: String, required: true },
    isActive: { type: Boolean, default: true },
  },
  { _id: false }
);

const BrandingConfigSchema = new Schema<IBrandingConfig>(
  {
    logoUrl: { type: String, trim: true },
    altLogoUrl: { type: String, trim: true },
    faviconUrl: { type: String, trim: true },
    letterheadBgUrl: { type: String, trim: true },
    primaryColor: { type: String, default: '#1e3932', trim: true },
    accentColor: { type: String, default: '#c89348', trim: true },
    documentHeader: { type: String, trim: true },
    documentFooter: { type: String, trim: true },
    padPrintDefault: { type: Boolean, default: false },
  },
  { _id: false }
);

const DocumentConfigSchema = new Schema<IDocumentConfig>(
  {
    quotationPrefix: { type: String, default: 'QT-', trim: true },
    invoicePrefix: { type: String, default: 'INV-', trim: true },
    challanPrefix: { type: String, default: 'DC-', trim: true },
    receiptPrefix: { type: String, default: 'MR-', trim: true },
    poPrefix: { type: String, default: 'PO-', trim: true },
    showWatermark: { type: Boolean, default: false },
    showStampOnInvoice: { type: Boolean, default: true },
    showSignatureOnQuotation: { type: Boolean, default: true },
    showBankDetailsOnInvoice: { type: Boolean, default: true },
    defaultNotes: { type: String, trim: true },
    termsAndConditions: [{ type: String, trim: true }],
  },
  { _id: false }
);

const FinancialSettingsSchema = new Schema<IFinancialSettings>(
  {
    vatPercent: { type: Number, default: 15, min: 0, max: 100 },
    taxIdentificationType: { type: String, default: 'TIN', trim: true },
    allowNegativeStock: { type: Boolean, default: false },
    enableFefo: { type: Boolean, default: true },
    defaultCostingMethod: {
      type: String,
      enum: ['FIFO', 'FEFO', 'WEIGHTED_AVERAGE'],
      default: 'FEFO',
    },
    fiscalYearMonths: { type: Number, default: 12, min: 1, max: 12 },
    retainedEarningsAccountCode: { type: String, default: '3010', trim: true },
  },
  { _id: false }
);

export const OrganizationSchema = new Schema<IOrganization>(
  {
    organizationCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    legalName: {
      type: String,
      required: true,
      trim: true,
    },
    displayName: {
      type: String,
      required: true,
      trim: true,
    },
    organizationType: {
      type: String,
      enum: [
        'PROPRIETORSHIP',
        'PARTNERSHIP',
        'PRIVATE_LIMITED',
        'PUBLIC_LIMITED',
        'GOVERNMENT',
        'NGO',
        'OTHER',
      ],
      default: 'PRIVATE_LIMITED',
      required: true,
    },
    registrationNumber: { type: String, trim: true },
    tradeLicenseNumber: { type: String, trim: true },
    tinNumber: { type: String, trim: true },
    binNumber: { type: String, trim: true },
    vatRegistrationNumber: { type: String, trim: true },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    alternatePhone: { type: String, trim: true },
    website: { type: String, trim: true },
    address: {
      type: String,
      required: true,
      trim: true,
    },
    city: {
      type: String,
      default: 'Dhaka',
      required: true,
      trim: true,
    },
    district: {
      type: String,
      default: 'Dhaka',
      required: true,
      trim: true,
    },
    postalCode: { type: String, trim: true },
    country: {
      type: String,
      default: 'Bangladesh',
      required: true,
      trim: true,
    },
    logo: { type: String, trim: true },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE'],
      default: 'ACTIVE',
      required: true,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    financialYearStart: {
      type: String,
      default: '07-01',
      trim: true,
    },
    currency: {
      type: String,
      default: 'BDT',
      trim: true,
    },
    timezone: {
      type: String,
      default: 'Asia/Dhaka',
      trim: true,
    },
    branding: {
      type: BrandingConfigSchema,
      default: () => ({
        primaryColor: '#1e3932',
        accentColor: '#c89348',
        padPrintDefault: false,
      }),
    },
    bankAccounts: {
      type: [BankAccountSchema],
      default: [],
    },
    signatories: {
      type: [SignatorySchema],
      default: [],
    },
    stamps: {
      type: [StampSchema],
      default: [],
    },
    documentConfig: {
      type: DocumentConfigSchema,
      default: () => ({
        quotationPrefix: 'QT-',
        invoicePrefix: 'INV-',
        challanPrefix: 'DC-',
        receiptPrefix: 'MR-',
        poPrefix: 'PO-',
        showStampOnInvoice: true,
        showSignatureOnQuotation: true,
        showBankDetailsOnInvoice: true,
      }),
    },
    financialSettings: {
      type: FinancialSettingsSchema,
      default: () => ({
        vatPercent: 15,
        taxIdentificationType: 'TIN',
        allowNegativeStock: false,
        enableFefo: true,
        defaultCostingMethod: 'FEFO',
        fiscalYearMonths: 12,
        retainedEarningsAccountCode: '3010',
      }),
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
    collection: 'organizations',
  }
);

// Indexes
OrganizationSchema.index({ status: 1 });
OrganizationSchema.index({ isDefault: 1 });
OrganizationSchema.index({ legalName: 'text', displayName: 'text', organizationCode: 'text' });

export const OrganizationModel = model<IOrganization>('Organization', OrganizationSchema);

