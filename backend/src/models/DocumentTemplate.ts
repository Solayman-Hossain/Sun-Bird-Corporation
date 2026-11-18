import { Schema, model, Document, Types } from 'mongoose';

export type DocumentTypeEnum =
  | 'SALES_QUOTATION'
  | 'PROFORMA_INVOICE'
  | 'SALES_INVOICE'
  | 'DELIVERY_CHALLAN'
  | 'MONEY_RECEIPT'
  | 'CREDIT_NOTE'
  | 'PURCHASE_ORDER'
  | 'PURCHASE_INVOICE';

export interface ITemplateColumn {
  id: string;
  label: string;
  field: string;
  width?: string;
  align?: 'left' | 'center' | 'right';
  format?: 'text' | 'number' | 'currency' | 'date' | 'auto_sl' | 'formula';
  visible: boolean;
  headerBackground?: string;
  fontWeight?: string;
  isDeletable?: boolean;
}

export interface ITemplateRowItem {
  id: string;
  [key: string]: any;
}

export interface ITemplateSignatory {
  id: string;
  title: string;
  personName?: string;
  designation?: string;
  signatureImageUrl?: string;
  alignment: 'left' | 'center' | 'right';
  required: boolean;
}

export interface IDocumentTemplate extends Document {
  _id: Types.ObjectId;
  organizationId: Types.ObjectId;
  name: string;
  documentType: DocumentTypeEnum;
  language: 'EN' | 'BN' | 'BILINGUAL';
  version: number;
  paperSize: 'A4' | 'A5' | 'LETTER';
  orientation: 'PORTRAIT' | 'LANDSCAPE';
  headerSettings: {
    showLogo: boolean;
    logoPosition: 'left' | 'center' | 'right';
    showOrgDetails: boolean;
    showDocNumber: boolean;
    showStatus: boolean;
    docTitle: string;
    docSubtitle?: string;
    customHeaderText?: string;
  };
  recipientSettings: {
    showRecipient: boolean;
    recipientLabel: string;
    showAddress: boolean;
    showContact: boolean;
    showBinVat: boolean;
  };
  introductionText?: string;
  closingText?: string;
  tableDefinition: {
    columns: ITemplateColumn[];
    defaultRows?: ITemplateRowItem[];
    showSubtotal: boolean;
    showDiscount: boolean;
    showTax: boolean;
    showShipping: boolean;
    showGrandTotal: boolean;
    showAmountInWords: boolean;
    amountInWordsLanguage: 'EN' | 'BN' | 'BILINGUAL';
  };
  termsAndConditions: Array<{
    id: string;
    textBn?: string;
    textEn?: string;
    order: number;
    isActive: boolean;
  }>;
  signatureSettings: ITemplateSignatory[];
  sealSettings: {
    showSeal: boolean;
    stampType?: 'OFFICIAL' | 'APPROVAL' | 'PAID' | 'RECEIVED';
    stampImageUrl?: string;
    position: 'left' | 'center' | 'right';
  };
  footerSettings: {
    footerText?: string;
    showPageNumber: boolean;
    pageNumberFormat?: string;
  };
  isDefault: boolean;
  isActive: boolean;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export const DocumentTemplateSchema = new Schema<IDocumentTemplate>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    documentType: {
      type: String,
      enum: [
        'SALES_QUOTATION',
        'PROFORMA_INVOICE',
        'SALES_INVOICE',
        'DELIVERY_CHALLAN',
        'MONEY_RECEIPT',
        'CREDIT_NOTE',
        'PURCHASE_ORDER',
        'PURCHASE_INVOICE',
      ],
      required: true,
      index: true,
    },
    language: {
      type: String,
      enum: ['EN', 'BN', 'BILINGUAL'],
      default: 'EN',
    },
    version: {
      type: Number,
      default: 1,
    },
    paperSize: {
      type: String,
      enum: ['A4', 'A5', 'LETTER'],
      default: 'A4',
    },
    orientation: {
      type: String,
      enum: ['PORTRAIT', 'LANDSCAPE'],
      default: 'PORTRAIT',
    },
    headerSettings: {
      showLogo: { type: Boolean, default: true },
      logoPosition: { type: String, enum: ['left', 'center', 'right'], default: 'left' },
      showOrgDetails: { type: Boolean, default: true },
      showDocNumber: { type: Boolean, default: true },
      showStatus: { type: Boolean, default: true },
      docTitle: { type: String, required: true },
      docSubtitle: { type: String },
      customHeaderText: { type: String },
    },
    recipientSettings: {
      showRecipient: { type: Boolean, default: true },
      recipientLabel: { type: String, default: 'Recipient' },
      showAddress: { type: Boolean, default: true },
      showContact: { type: Boolean, default: true },
      showBinVat: { type: Boolean, default: true },
    },
    introductionText: { type: String },
    closingText: { type: String },
    tableDefinition: {
      columns: [
        {
          id: { type: String, required: true },
          label: { type: String, required: true },
          field: { type: String, required: true },
          width: { type: String, default: 'auto' },
          align: { type: String, enum: ['left', 'center', 'right'], default: 'left' },
          format: {
            type: String,
            enum: ['text', 'number', 'currency', 'date', 'auto_sl', 'formula'],
            default: 'text',
          },
          visible: { type: Boolean, default: true },
          headerBackground: { type: String },
          fontWeight: { type: String },
          isDeletable: { type: Boolean, default: true },
        },
      ],
      defaultRows: { type: [Schema.Types.Mixed], default: [] },
      showSubtotal: { type: Boolean, default: true },
      showDiscount: { type: Boolean, default: true },
      showTax: { type: Boolean, default: true },
      showShipping: { type: Boolean, default: false },
      showGrandTotal: { type: Boolean, default: true },
      showAmountInWords: { type: Boolean, default: true },
      amountInWordsLanguage: { type: String, enum: ['EN', 'BN', 'BILINGUAL'], default: 'EN' },
    },
    termsAndConditions: [
      {
        id: { type: String, required: true },
        textBn: { type: String },
        textEn: { type: String },
        order: { type: Number, default: 0 },
        isActive: { type: Boolean, default: true },
      },
    ],
    signatureSettings: [
      {
        id: { type: String, required: true },
        title: { type: String, required: true },
        personName: { type: String },
        designation: { type: String },
        signatureImageUrl: { type: String },
        alignment: { type: String, enum: ['left', 'center', 'right'], default: 'left' },
        required: { type: Boolean, default: true },
      },
    ],
    sealSettings: {
      showSeal: { type: Boolean, default: true },
      stampType: {
        type: String,
        enum: ['OFFICIAL', 'APPROVAL', 'PAID', 'RECEIVED'],
        default: 'OFFICIAL',
      },
      stampImageUrl: { type: String },
      position: { type: String, enum: ['left', 'center', 'right'], default: 'right' },
    },
    footerSettings: {
      footerText: { type: String },
      showPageNumber: { type: Boolean, default: true },
      pageNumberFormat: { type: String, default: 'Page {page} of {pages}' },
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

DocumentTemplateSchema.index({ organizationId: 1, documentType: 1, isDefault: 1 });

export const DocumentTemplateModel = model<IDocumentTemplate>(
  'DocumentTemplate',
  DocumentTemplateSchema,
  'document_templates'
);

export default DocumentTemplateModel;
