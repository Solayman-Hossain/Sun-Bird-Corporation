import { Schema, model, Document, Types } from 'mongoose';

export type ProformaStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'APPROVED'
  | 'SENT'
  | 'CONVERTED'
  | 'CANCELLED'
  | 'VERIFIED'
  | 'LINKED_TO_LC';

export interface IProformaItem {
  productId?: Types.ObjectId;
  sku?: string;
  productName: string;
  uom?: string;
  quantity: number;
  unitPrice?: number;
  discount?: number;
  taxRate?: number;
  taxAmount?: number;
  lineTotal?: number;
  // Import extensions
  hsCode?: string;
  unit?: string;
  unitPriceFC?: number;
  totalAmountFC?: number;
  specification?: string;
}

export type IProformaInvoiceItem = IProformaItem;

export interface IProformaInvoice extends Document {
  _id: Types.ObjectId;
  proformaNumber: string;
  piNumber?: string;
  organizationId: Types.ObjectId;
  customerId?: Types.ObjectId;
  supplierId?: Types.ObjectId;
  supplierName?: string;
  supplierAddress?: string;
  countryOfOrigin?: string;
  buyerOrganizationName?: string;
  quotationId?: Types.ObjectId;
  proformaDate: Date;
  piDate?: Date;
  paymentTerms: string;
  deliveryTerms?: string;
  shipmentTerms?: string;
  incoterms?: string;
  portOfLoading?: string;
  portOfDischarge?: string;
  estimatedShipmentDate?: Date;
  validityDate?: Date;
  currency: 'BDT' | 'USD' | 'EUR' | 'CNY' | 'JPY' | 'GBP';
  items: IProformaItem[];
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  shippingCharge: number;
  grandTotal: number;
  totalAmountFC?: number;
  freightFC?: number;
  insuranceFC?: number;
  discountFC?: number;
  grandTotalFC?: number;
  amountInWordsEn?: string;
  amountInWordsBn?: string;
  bankAccountId?: string;
  status: ProformaStatus;
  convertedToInvoiceId?: Types.ObjectId;
  purchaseOrderId?: Types.ObjectId;
  linkedLcId?: Types.ObjectId;
  linkedLcNumber?: string;
  templateId?: Types.ObjectId;
  termsAndConditions?: string[];
  notes?: string;
  createdBy?: Types.ObjectId;
  approvedBy?: Types.ObjectId;
  approvedAt?: Date;
  snapshot?: Record<string, any>;
  attachments?: Array<{
    fileUrl: string;
    fileName: string;
    uploadedAt: Date;
  }>;
  aiExtractedData?: {
    extractedAt?: Date;
    rawTextSnippet?: string;
    confidenceScore?: number;
    discrepancies?: Array<{
      field: string;
      expected: any;
      found: any;
      notes: string;
    }>;
  };
  createdAt: Date;
  updatedAt: Date;
}

const ProformaItemSchema = new Schema<IProformaItem>(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product' },
    sku: { type: String, trim: true, uppercase: true },
    productName: { type: String, required: true, trim: true },
    uom: { type: String, default: 'PIECE' },
    quantity: { type: Number, required: true, min: 0.001 },
    unitPrice: { type: Number, default: 0, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    taxRate: { type: Number, default: 0, min: 0 },
    taxAmount: { type: Number, default: 0, min: 0 },
    lineTotal: { type: Number, default: 0, min: 0 },
    hsCode: { type: String, trim: true },
    unit: { type: String, trim: true },
    unitPriceFC: { type: Number, min: 0 },
    totalAmountFC: { type: Number, min: 0 },
    specification: { type: String, trim: true },
  },
  { _id: false }
);

export const ProformaInvoiceSchema = new Schema<IProformaInvoice>(
  {
    proformaNumber: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    piNumber: {
      type: String,
      trim: true,
      uppercase: true,
      index: true,
    },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    customerId: {
      type: Schema.Types.ObjectId,
      ref: 'Customer',
    },
    supplierId: {
      type: Schema.Types.ObjectId,
      ref: 'Supplier',
      index: true,
    },
    supplierName: { type: String, trim: true },
    supplierAddress: { type: String, trim: true },
    countryOfOrigin: { type: String, trim: true },
    buyerOrganizationName: { type: String, trim: true },
    quotationId: {
      type: Schema.Types.ObjectId,
      ref: 'SalesQuotation',
    },
    proformaDate: {
      type: Date,
      default: Date.now,
      required: true,
    },
    piDate: {
      type: Date,
    },
    paymentTerms: {
      type: String,
      default: '100% Advance Payment / LC',
    },
    deliveryTerms: {
      type: String,
      default: 'Ex-Warehouse Dhaka',
    },
    shipmentTerms: { type: String, trim: true },
    incoterms: { type: String, default: 'CFR', trim: true },
    portOfLoading: { type: String, trim: true },
    portOfDischarge: { type: String, trim: true },
    estimatedShipmentDate: { type: Date },
    validityDate: { type: Date },
    currency: {
      type: String,
      enum: ['BDT', 'USD', 'EUR', 'CNY', 'JPY', 'GBP'],
      default: 'BDT',
    },
    items: [ProformaItemSchema],
    subtotal: { type: Number, default: 0 },
    discountTotal: { type: Number, default: 0 },
    taxTotal: { type: Number, default: 0 },
    shippingCharge: { type: Number, default: 0 },
    grandTotal: { type: Number, default: 0 },
    totalAmountFC: { type: Number, default: 0 },
    freightFC: { type: Number, default: 0 },
    insuranceFC: { type: Number, default: 0 },
    discountFC: { type: Number, default: 0 },
    grandTotalFC: { type: Number, default: 0 },
    amountInWordsEn: { type: String, default: '' },
    amountInWordsBn: { type: String, default: '' },
    bankAccountId: { type: String },
    status: {
      type: String,
      enum: ['DRAFT', 'SUBMITTED', 'APPROVED', 'SENT', 'CONVERTED', 'CANCELLED', 'VERIFIED', 'LINKED_TO_LC'],
      default: 'DRAFT',
      required: true,
      index: true,
    },
    convertedToInvoiceId: {
      type: Schema.Types.ObjectId,
      ref: 'SalesInvoice',
    },
    purchaseOrderId: { type: Schema.Types.ObjectId, ref: 'PurchaseOrder' },
    linkedLcId: { type: Schema.Types.ObjectId, ref: 'ImportLC' },
    linkedLcNumber: { type: String, trim: true, uppercase: true },
    templateId: {
      type: Schema.Types.ObjectId,
      ref: 'DocumentTemplate',
    },
    termsAndConditions: [{ type: String }],
    notes: { type: String },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    approvedAt: { type: Date },
    snapshot: { type: Schema.Types.Mixed },
    attachments: [
      {
        fileUrl: { type: String, required: true },
        fileName: { type: String, required: true },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    aiExtractedData: {
      extractedAt: { type: Date },
      rawTextSnippet: { type: String },
      confidenceScore: { type: Number },
      discrepancies: [
        {
          field: { type: String },
          expected: { type: Schema.Types.Mixed },
          found: { type: Schema.Types.Mixed },
          notes: { type: String },
        },
      ],
    },
  },
  {
    timestamps: true,
  }
);

ProformaInvoiceSchema.index({ organizationId: 1, status: 1 });

export const ProformaInvoiceModel = model<IProformaInvoice>(
  'ProformaInvoice',
  ProformaInvoiceSchema,
  'proforma_invoices'
);

export default ProformaInvoiceModel;
