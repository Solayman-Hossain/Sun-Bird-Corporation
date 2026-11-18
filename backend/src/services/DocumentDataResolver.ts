import { Types } from 'mongoose';
import { OrganizationModel } from '../models/Organization';
import { CustomerModel } from '../models/Customer';
import { SupplierModel } from '../models/Supplier';
import { ProductModel } from '../models/Product';
import { PurchaseOrderModel } from '../models/PurchaseOrder';
import { PurchaseInvoiceModel } from '../models/PurchaseInvoice';
import { SalesInvoiceModel } from '../models/SalesInvoice';
import { DeliveryChallanModel } from '../models/DeliveryChallan';
import { SalesQuotationModel } from '../models/SalesQuotation';
import { ProformaInvoiceModel } from '../models/ProformaInvoice';
import { MoneyReceiptModel } from '../models/MoneyReceipt';
import { CreditNoteModel } from '../models/CreditNote';
import { DocumentTemplateModel, IDocumentTemplate, DocumentTypeEnum } from '../models/DocumentTemplate';
import { NotFoundError } from '../errors/AppError';

export interface ResolvedDocumentPayload {
  documentType: DocumentTypeEnum;
  documentNumber: string;
  documentDate: Date | string;
  status: string;
  organization: {
    id: string;
    code: string;
    name: string;
    legalName: string;
    tagline?: string;
    address: string;
    phone: string;
    email: string;
    website?: string;
    bin?: string;
    tin?: string;
    vatRegistration?: string;
    tradeLicense?: string;
    logoUrl?: string;
    stampUrl?: string;
    signatureUrl?: string;
    signatoryName?: string;
    signatoryDesignation?: string;
    bankAccount?: {
      bankName: string;
      accountName: string;
      accountNumber: string;
      branchName: string;
      routingNumber?: string;
    };
  };
  recipient: {
    id?: string;
    type: 'CUSTOMER' | 'SUPPLIER';
    name: string;
    companyName?: string;
    contactPerson?: string;
    phone?: string;
    email?: string;
    address: string;
    billingAddress?: string;
    shippingAddress?: string;
    bin?: string;
    tin?: string;
  };
  items: Array<{
    sl: number;
    productId?: string;
    sku: string;
    productName: string;
    description?: string;
    brand?: string;
    origin?: string;
    uom: string;
    quantity: number;
    unitPrice: number;
    discount?: number;
    taxRate?: number;
    taxAmount?: number;
    lineTotal: number;
    [key: string]: any;
  }>;
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  shippingCharge: number;
  grandTotal: number;
  amountInWordsEn: string;
  amountInWordsBn: string;
  termsAndConditions: string[];
  notes?: string;
  template?: IDocumentTemplate;
  rawDocument: any;
}

export class DocumentDataResolver {
  public static async resolveOrganization(orgId?: string | Types.ObjectId) {
    let org = null;
    if (orgId) {
      org = await OrganizationModel.findById(orgId).lean();
    }
    if (!org) {
      org = await OrganizationModel.findOne({ isDefault: true }).lean();
    }
    if (!org) {
      org = await OrganizationModel.findOne().lean();
    }

    if (!org) {
      return {
        id: '',
        code: 'SBC',
        name: 'SUN BIRD CORPORATION',
        legalName: 'Sun Bird Corporation Ltd.',
        address: 'House: 14, Road: 7, Block-C, Niketon, Gulshan-1, Dhaka-1212',
        phone: '+880 1751-195752',
        email: 'info@sunbirdbd.com',
        website: 'www.sunbirdbd.com',
        bin: '002391029-0101',
        tin: '592817291029',
        vatRegistration: '002391029-0101',
        tradeLicense: 'TRAD/DNCC/092182/2024',
        logoUrl: '',
        stampUrl: '',
        signatureUrl: '',
      };
    }

    const defaultBank = org.bankAccounts?.find((b: any) => b.isDefault && b.isActive) || org.bankAccounts?.[0];
    const defaultSignatory = org.signatories?.find((s: any) => s.isActive) || org.signatories?.[0];
    const defaultStamp = org.stamps?.find((s: any) => s.isActive) || org.stamps?.[0];

    return {
      id: org._id.toString(),
      code: org.organizationCode,
      name: org.displayName || org.legalName,
      legalName: org.legalName,
      address: `${org.address}, ${org.city || ''}, ${org.district || ''}`.trim(),
      phone: org.phone,
      email: org.email,
      website: org.website,
      bin: org.binNumber,
      tin: org.tinNumber,
      vatRegistration: org.vatRegistrationNumber || org.binNumber,
      tradeLicense: org.tradeLicenseNumber,
      logoUrl: org.branding?.logoUrl || '',
      stampUrl: defaultStamp?.stampImageUrl || '',
      signatureUrl: defaultSignatory?.signatureImageUrl || '',
      signatoryName: defaultSignatory?.personName || '',
      signatoryDesignation: defaultSignatory?.designation || '',
      bankAccount: defaultBank
        ? {
            bankName: defaultBank.bankName,
            accountName: defaultBank.accountName,
            accountNumber: defaultBank.accountNumber,
            branchName: defaultBank.branchName,
            routingNumber: defaultBank.routingNumber,
          }
        : undefined,
    };
  }

  public static async resolveDocument(
    documentType: DocumentTypeEnum,
    documentId: string | Types.ObjectId,
    customTemplateId?: string | Types.ObjectId
  ): Promise<ResolvedDocumentPayload> {
    const id = new Types.ObjectId(documentId);

    let doc: any = null;
    let recipient: any = null;
    let items: any[] = [];
    let subtotal = 0;
    let discountTotal = 0;
    let taxTotal = 0;
    let shippingCharge = 0;
    let grandTotal = 0;
    let docNumber = '';
    let docDate = new Date();
    let status = 'DRAFT';
    let notes = '';
    let terms: string[] = [];
    let orgId: any = null;

    if (documentType === 'PURCHASE_ORDER') {
      doc = await PurchaseOrderModel.findById(id).populate('supplierId').populate('items.productId').lean();
      if (!doc) throw new NotFoundError(`Purchase order not found with ID ${id}`);

      docNumber = doc.poNumber;
      docDate = doc.poDate || doc.createdAt;
      status = doc.status;
      orgId = doc.organizationId;
      subtotal = doc.subtotal || 0;
      taxTotal = doc.taxAmount || 0;
      grandTotal = doc.grandTotal || 0;
      notes = doc.paymentTerms || '';

      const supplier = doc.supplierId as any;
      recipient = {
        id: supplier?._id?.toString(),
        type: 'SUPPLIER',
        name: supplier?.name || supplier?.companyName || 'Unknown Supplier',
        companyName: supplier?.companyName,
        contactPerson: supplier?.contactPerson,
        phone: supplier?.phone || supplier?.mobile,
        email: supplier?.email,
        address: supplier?.address || '',
        bin: supplier?.binNumber,
        tin: supplier?.tinNumber,
      };

      items = (doc.items || []).map((it: any, idx: number) => ({
        sl: idx + 1,
        productId: it.productId?._id?.toString(),
        sku: it.sku,
        productName: it.productName || it.productId?.nameEn || it.sku,
        brand: it.productId?.brand || 'Standard',
        origin: (it as any).origin || it.productId?.manufacturer || (it.productId as any)?.countryOfOrigin || 'International',
        uom: it.uom || 'PIECE',
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        lineTotal: it.lineTotal,
      }));
    } else if (documentType === 'SALES_QUOTATION') {
      doc = await SalesQuotationModel.findById(id).populate('customerId').lean();
      if (!doc) throw new NotFoundError(`Sales quotation not found with ID ${id}`);

      docNumber = doc.quotationNumber;
      docDate = doc.quotationDate;
      status = doc.status;
      orgId = doc.organizationId;
      subtotal = doc.subtotal;
      discountTotal = doc.discountTotal || 0;
      taxTotal = doc.taxTotal || 0;
      shippingCharge = doc.shippingCharge || 0;
      grandTotal = doc.grandTotal;
      notes = doc.notes || '';
      terms = doc.termsAndConditions || [];

      const customer = doc.customerId as any;
      recipient = {
        id: customer?._id?.toString(),
        type: 'CUSTOMER',
        name: customer?.fullName || customer?.name || customer?.companyName || 'Valued Customer',
        companyName: customer?.companyName,
        contactPerson: customer?.contactPerson,
        phone: customer?.phone || customer?.mobile,
        email: customer?.email,
        address: customer?.billingAddress || customer?.address || '',
        bin: customer?.binNumber,
      };

      items = (doc.items || []).map((it: any, idx: number) => ({
        sl: idx + 1,
        sku: it.sku,
        productName: it.productName,
        description: it.description,
        brand: it.brand,
        origin: it.origin,
        uom: it.uom,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        discount: it.discount,
        taxAmount: it.taxAmount,
        lineTotal: it.lineTotal,
      }));
    } else if (documentType === 'PROFORMA_INVOICE') {
      doc = await ProformaInvoiceModel.findById(id).populate('customerId').lean();
      if (!doc) throw new NotFoundError(`Proforma invoice not found with ID ${id}`);

      docNumber = doc.proformaNumber;
      docDate = doc.proformaDate;
      status = doc.status;
      orgId = doc.organizationId;
      subtotal = doc.subtotal;
      discountTotal = doc.discountTotal || 0;
      taxTotal = doc.taxTotal || 0;
      shippingCharge = doc.shippingCharge || 0;
      grandTotal = doc.grandTotal;
      notes = doc.paymentTerms || '';
      terms = doc.termsAndConditions || [];

      const customer = doc.customerId as any;
      recipient = {
        id: customer?._id?.toString(),
        type: 'CUSTOMER',
        name: customer?.fullName || customer?.name || customer?.companyName || 'Valued Customer',
        companyName: customer?.companyName,
        phone: customer?.phone || customer?.mobile,
        email: customer?.email,
        address: customer?.billingAddress || customer?.address || '',
        bin: customer?.binNumber,
      };

      items = (doc.items || []).map((it: any, idx: number) => ({
        sl: idx + 1,
        sku: it.sku,
        productName: it.productName,
        uom: it.uom,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        discount: it.discount,
        taxAmount: it.taxAmount,
        lineTotal: it.lineTotal,
      }));
    } else if (documentType === 'SALES_INVOICE') {
      doc = await SalesInvoiceModel.findById(id).populate('customerId').lean();
      if (!doc) throw new NotFoundError(`Sales invoice not found with ID ${id}`);

      docNumber = doc.invoiceNo;
      docDate = doc.invoiceDate;
      status = doc.status;
      orgId = (doc as any).organizationId || (doc.branchId as any);
      subtotal = doc.subtotal;
      discountTotal = doc.discountAmount || 0;
      taxTotal = doc.vatTotal || 0;
      grandTotal = doc.grandTotal;

      const customer = doc.customerId as any;
      recipient = {
        id: customer?._id?.toString(),
        type: 'CUSTOMER',
        name: customer?.fullName || customer?.name || customer?.companyName || 'Valued Customer',
        phone: customer?.phone || customer?.mobile,
        email: customer?.email,
        address: customer?.billingAddress || customer?.address || '',
        bin: customer?.bin,
      };

      // Order items lookup if available
      items = [
        {
          sl: 1,
          sku: 'INVOICE-ITEMS',
          productName: `Sales Delivery Mushak-6.3 (${doc.invoiceNo})`,
          uom: 'LOT',
          quantity: 1,
          unitPrice: doc.subtotal,
          lineTotal: doc.subtotal,
        },
      ];
    } else if (documentType === 'DELIVERY_CHALLAN') {
      doc = await DeliveryChallanModel.findById(id).populate('customerId').lean();
      if (!doc) throw new NotFoundError(`Delivery challan not found with ID ${id}`);

      docNumber = doc.challanNo;
      docDate = doc.dispatchTime || doc.createdAt;
      status = doc.status;
      orgId = (doc as any).organizationId;

      const customer = doc.customerId as any;
      recipient = {
        id: customer?._id?.toString(),
        type: 'CUSTOMER',
        name: customer?.name || 'Valued Customer',
        phone: customer?.phone,
        address: customer?.address || '',
        bin: doc.buyerBin || customer?.bin,
      };

      items = (doc.items || []).map((it: any, idx: number) => ({
        sl: idx + 1,
        sku: it.sku,
        productName: it.productName,
        hsCode: it.hsCode,
        batchNumber: it.batchNumber,
        uom: it.uom,
        quantity: it.dispatchedQty,
        unitPrice: 0,
        lineTotal: 0,
      }));
    } else if (documentType === 'MONEY_RECEIPT') {
      doc = await MoneyReceiptModel.findById(id).populate('customerId').lean();
      if (!doc) throw new NotFoundError(`Money receipt not found with ID ${id}`);

      docNumber = doc.receiptNumber;
      docDate = doc.receiptDate;
      status = doc.status;
      orgId = doc.organizationId;
      grandTotal = doc.amount;
      subtotal = doc.amount;
      notes = doc.forParticulars || '';

      const customer = doc.customerId as any;
      recipient = {
        id: customer?._id?.toString(),
        type: 'CUSTOMER',
        name: customer?.fullName || customer?.name || customer?.companyName || 'Valued Customer',
        phone: customer?.phone || customer?.mobile,
        address: customer?.billingAddress || customer?.address || '',
      };

      items = [
        {
          sl: 1,
          sku: 'PAYMENT',
          productName: doc.forParticulars,
          uom: 'TXN',
          quantity: 1,
          unitPrice: doc.amount,
          lineTotal: doc.amount,
        },
      ];
    } else if (documentType === 'CREDIT_NOTE') {
      doc = await CreditNoteModel.findById(id).populate('customerId').lean();
      if (!doc) throw new NotFoundError(`Credit note not found with ID ${id}`);

      docNumber = doc.creditNoteNumber;
      docDate = doc.creditDate;
      status = doc.status;
      orgId = doc.organizationId;
      subtotal = doc.subtotal;
      taxTotal = doc.taxTotal || 0;
      grandTotal = doc.totalAmount;
      notes = doc.notes || `Credit adjustment (${doc.reason})`;

      const customer = doc.customerId as any;
      recipient = {
        id: customer?._id?.toString(),
        type: 'CUSTOMER',
        name: customer?.fullName || customer?.name || customer?.companyName || 'Valued Customer',
        phone: customer?.phone || customer?.mobile,
        address: customer?.billingAddress || customer?.address || '',
      };

      items = (doc.items || []).map((it: any, idx: number) => ({
        sl: idx + 1,
        sku: it.sku,
        productName: it.productName,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        taxAmount: it.taxAmount,
        lineTotal: it.totalAmount,
      }));
    } else if (documentType === 'PURCHASE_INVOICE') {
      doc = await PurchaseInvoiceModel.findById(id).populate('supplierId').lean();
      if (!doc) throw new NotFoundError(`Purchase invoice not found with ID ${id}`);

      docNumber = doc.invoiceNumber;
      docDate = doc.invoiceDate;
      status = doc.status;
      orgId = doc.organizationId;
      subtotal = doc.subtotal;
      discountTotal = doc.totalDiscount || 0;
      taxTotal = doc.totalTax || 0;
      grandTotal = doc.grandTotal;
      notes = doc.notes || '';

      const supplier = doc.supplierId as any;
      recipient = {
        id: supplier?._id?.toString(),
        type: 'SUPPLIER',
        name: supplier?.name || supplier?.companyName || 'Vendor',
        companyName: supplier?.companyName,
        phone: supplier?.phone,
        email: supplier?.email,
        address: supplier?.address || '',
      };

      items = (doc.items || []).map((it: any, idx: number) => ({
        sl: idx + 1,
        sku: it.sku,
        productName: it.productName,
        uom: it.uom,
        quantity: it.qty,
        unitPrice: it.unitPrice,
        discount: it.discount,
        taxAmount: it.taxAmount,
        lineTotal: it.lineTotal,
      }));
    }

    const organization = await this.resolveOrganization(orgId);

    // Resolve template
    let template: any = null;
    if (customTemplateId) {
      template = await DocumentTemplateModel.findById(customTemplateId).lean();
    }
    if (!template && doc?.templateId) {
      template = await DocumentTemplateModel.findById(doc.templateId).lean();
    }
    if (!template && orgId) {
      template = await DocumentTemplateModel.findOne({
        organizationId: orgId,
        documentType,
        isDefault: true,
        isActive: true,
      }).lean();
    }
    if (!template) {
      template = await DocumentTemplateModel.findOne({
        documentType,
        isDefault: true,
        isActive: true,
      }).lean();
    }

    // Default terms from template if empty
    if ((!terms || terms.length === 0) && template?.termsAndConditions) {
      terms = template.termsAndConditions
        .filter((t: any) => t.isActive)
        .sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
        .map((t: any) => t.textBn || t.textEn || '');
    }

    return {
      documentType,
      documentNumber: docNumber,
      documentDate: docDate,
      status,
      organization,
      recipient,
      items,
      subtotal,
      discountTotal,
      taxTotal,
      shippingCharge,
      grandTotal,
      amountInWordsEn: doc?.amountInWordsEn || '',
      amountInWordsBn: doc?.amountInWordsBn || '',
      termsAndConditions: terms,
      notes,
      template,
      rawDocument: doc,
    };
  }
}

export default DocumentDataResolver;
