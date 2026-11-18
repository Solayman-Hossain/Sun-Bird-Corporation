import { Types, ClientSession } from 'mongoose';
import { SalesQuotationModel, ISalesQuotation, IQuotationItem } from '../models/SalesQuotation';
import { ProformaInvoiceModel, IProformaInvoice, IProformaItem } from '../models/ProformaInvoice';
import { MoneyReceiptModel, IMoneyReceipt } from '../models/MoneyReceipt';
import { CreditNoteModel, ICreditNote, ICreditNoteItem } from '../models/CreditNote';
import { SalesInvoiceModel } from '../models/SalesInvoice';
import { CustomerModel } from '../models/Customer';
import { OrganizationModel } from '../models/Organization';
import { ChartOfAccountsModel } from '../models/ChartOfAccounts';
import { CounterService } from './CounterService';
import { DocumentCalculationService } from './DocumentCalculationService';
import { AccountingService } from './AccountingService';
import { DocumentDataResolver } from './DocumentDataResolver';
import { NotFoundError, ValidationError } from '../errors/AppError';
import logger from '../config/logger';

export class SalesDocumentService {
  // ─── 1. SALES QUOTATION ───────────────────────────────────────────────────
  public static async createQuotation(
    data: {
      organizationId: string | Types.ObjectId;
      customerId: string | Types.ObjectId;
      validityDays?: number;
      subject: string;
      currency?: 'BDT' | 'USD' | 'EUR';
      items: Array<{
        productId?: string | Types.ObjectId;
        sku: string;
        productName: string;
        description?: string;
        brand?: string;
        origin?: string;
        uom?: string;
        quantity: number;
        unitPrice: number;
        discount?: number;
        taxRate?: number;
        notes?: string;
      }>;
      documentDiscount?: number;
      shippingCharge?: number;
      termsAndConditions?: string[];
      notes?: string;
      templateId?: string | Types.ObjectId;
    },
    userId: string | Types.ObjectId,
    session?: ClientSession
  ): Promise<ISalesQuotation> {
    const customer = await CustomerModel.findById(data.customerId);
    if (!customer) throw new NotFoundError(`Customer not found with ID ${data.customerId}`);

    const calc = DocumentCalculationService.calculateDocument({
      items: data.items,
      documentDiscount: data.documentDiscount,
      shippingCharge: data.shippingCharge,
      currency: data.currency || 'BDT',
    });

    const quotationNumber = await CounterService.getNextSequence('QUO', session);

    const now = new Date();
    const validity = data.validityDays || 30;
    const expiryDate = new Date(now.getTime() + validity * 24 * 60 * 60 * 1000);

    const items: IQuotationItem[] = calc.lines.map((l) => ({
      productId: l.productId ? new Types.ObjectId(l.productId) : undefined,
      sku: l.sku.toUpperCase().trim(),
      productName: l.productName.trim(),
      description: l.description,
      brand: l.brand,
      origin: l.origin,
      uom: l.uom || 'PIECE',
      quantity: l.quantity,
      unitPrice: l.unitPrice,
      discount: l.discountAmount,
      taxRate: l.taxRate || 0,
      taxAmount: l.taxAmount,
      lineTotal: l.netLineTotal,
      notes: l.notes,
    }));

    const quotation = new SalesQuotationModel({
      quotationNumber,
      organizationId: new Types.ObjectId(data.organizationId),
      customerId: new Types.ObjectId(data.customerId),
      quotationDate: now,
      validityDays: validity,
      expiryDate,
      subject: data.subject,
      currency: data.currency || 'BDT',
      items,
      subtotal: calc.subtotal,
      discountTotal: calc.totalDiscount,
      taxTotal: calc.totalTax,
      shippingCharge: calc.shippingCharge,
      grandTotal: calc.grandTotal,
      amountInWordsEn: calc.amountInWordsEn,
      amountInWordsBn: calc.amountInWordsBn,
      status: 'DRAFT',
      templateId: data.templateId ? new Types.ObjectId(data.templateId) : undefined,
      termsAndConditions: data.termsAndConditions || [],
      notes: data.notes,
      createdBy: new Types.ObjectId(userId),
    });

    await quotation.save({ session });
    logger.info(`Sales quotation ${quotationNumber} created`);
    return quotation;
  }

  public static async getQuotations(filters: {
    organizationId?: string | Types.ObjectId;
    customerId?: string | Types.ObjectId;
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, Number(filters.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(filters.limit) || 20));
    const skip = (page - 1) * limit;

    const query: any = {};
    if (filters.organizationId) query.organizationId = filters.organizationId;
    if (filters.customerId) query.customerId = filters.customerId;
    if (filters.status && filters.status !== 'ALL') query.status = filters.status;
    if (filters.search) {
      const regex = new RegExp(filters.search.trim(), 'i');
      query.$or = [{ quotationNumber: regex }, { subject: regex }];
    }

    const [items, total] = await Promise.all([
      SalesQuotationModel.find(query)
        .populate('customerId', 'name companyName phone email address')
        .populate('createdBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      SalesQuotationModel.countDocuments(query),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) || 1 };
  }

  public static async getQuotationById(id: string | Types.ObjectId): Promise<ISalesQuotation> {
    const quotation = await SalesQuotationModel.findById(id)
      .populate('customerId')
      .populate('organizationId')
      .populate('createdBy', 'name email');
    if (!quotation) throw new NotFoundError(`Sales quotation not found with ID ${id}`);
    return quotation;
  }

  public static async approveQuotation(
    id: string | Types.ObjectId,
    userId: string | Types.ObjectId
  ): Promise<ISalesQuotation> {
    const quotation = await SalesQuotationModel.findById(id);
    if (!quotation) throw new NotFoundError('Sales quotation not found');

    quotation.status = 'APPROVED';
    quotation.approvedBy = new Types.ObjectId(userId);
    quotation.approvedAt = new Date();

    // Freeze historical snapshot on approval
    const snapshot = await DocumentDataResolver.resolveDocument(
      'SALES_QUOTATION',
      quotation._id,
      quotation.templateId
    );
    quotation.snapshot = snapshot;

    await quotation.save();
    return quotation;
  }

  // ─── 2. PROFORMA INVOICE ──────────────────────────────────────────────────
  public static async createProforma(
    data: {
      organizationId: string | Types.ObjectId;
      customerId: string | Types.ObjectId;
      quotationId?: string | Types.ObjectId;
      paymentTerms?: string;
      deliveryTerms?: string;
      currency?: 'BDT' | 'USD' | 'EUR';
      items: Array<{
        productId?: string | Types.ObjectId;
        sku: string;
        productName: string;
        uom?: string;
        quantity: number;
        unitPrice: number;
        discount?: number;
        taxRate?: number;
      }>;
      documentDiscount?: number;
      shippingCharge?: number;
      bankAccountId?: string;
      termsAndConditions?: string[];
      notes?: string;
      templateId?: string | Types.ObjectId;
    },
    userId: string | Types.ObjectId
  ): Promise<IProformaInvoice> {
    const calc = DocumentCalculationService.calculateDocument({
      items: data.items,
      documentDiscount: data.documentDiscount,
      shippingCharge: data.shippingCharge,
      currency: data.currency || 'BDT',
    });

    const proformaNumber = await CounterService.getNextSequence('PI');

    const items: IProformaItem[] = calc.lines.map((l) => ({
      productId: l.productId ? new Types.ObjectId(l.productId) : undefined,
      sku: l.sku.toUpperCase().trim(),
      productName: l.productName.trim(),
      uom: l.uom || 'PIECE',
      quantity: l.quantity,
      unitPrice: l.unitPrice,
      discount: l.discountAmount,
      taxRate: l.taxRate || 0,
      taxAmount: l.taxAmount,
      lineTotal: l.netLineTotal,
    }));

    const proforma = new ProformaInvoiceModel({
      proformaNumber,
      organizationId: new Types.ObjectId(data.organizationId),
      customerId: new Types.ObjectId(data.customerId),
      quotationId: data.quotationId ? new Types.ObjectId(data.quotationId) : undefined,
      proformaDate: new Date(),
      paymentTerms: data.paymentTerms || '100% Advance Payment / LC',
      deliveryTerms: data.deliveryTerms,
      currency: data.currency || 'BDT',
      items,
      subtotal: calc.subtotal,
      discountTotal: calc.totalDiscount,
      taxTotal: calc.totalTax,
      shippingCharge: calc.shippingCharge,
      grandTotal: calc.grandTotal,
      amountInWordsEn: calc.amountInWordsEn,
      amountInWordsBn: calc.amountInWordsBn,
      bankAccountId: data.bankAccountId,
      status: 'DRAFT',
      templateId: data.templateId ? new Types.ObjectId(data.templateId) : undefined,
      termsAndConditions: data.termsAndConditions || [],
      notes: data.notes,
      createdBy: new Types.ObjectId(userId),
    });

    await proforma.save();

    if (data.quotationId) {
      await SalesQuotationModel.findByIdAndUpdate(data.quotationId, {
        convertedToProformaId: proforma._id,
        status: 'CONVERTED',
      });
    }

    return proforma;
  }

  public static async getProformas(filters: {
    organizationId?: string | Types.ObjectId;
    customerId?: string | Types.ObjectId;
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, Number(filters.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(filters.limit) || 20));
    const skip = (page - 1) * limit;

    const query: any = {};
    if (filters.organizationId) query.organizationId = filters.organizationId;
    if (filters.customerId) query.customerId = filters.customerId;
    if (filters.status && filters.status !== 'ALL') query.status = filters.status;
    if (filters.search) {
      query.proformaNumber = new RegExp(filters.search.trim(), 'i');
    }

    const [items, total] = await Promise.all([
      ProformaInvoiceModel.find(query)
        .populate('customerId', 'name companyName phone address')
        .populate('quotationId', 'quotationNumber')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      ProformaInvoiceModel.countDocuments(query),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) || 1 };
  }

  public static async getProformaById(id: string | Types.ObjectId): Promise<IProformaInvoice> {
    const proforma = await ProformaInvoiceModel.findById(id)
      .populate('customerId')
      .populate('organizationId')
      .populate('quotationId');
    if (!proforma) throw new NotFoundError('Proforma invoice not found');
    return proforma;
  }

  // ─── 3. MONEY RECEIPT ─────────────────────────────────────────────────────
  public static async createMoneyReceipt(
    data: {
      organizationId: string | Types.ObjectId;
      customerId: string | Types.ObjectId;
      salesInvoiceId?: string | Types.ObjectId;
      paymentMethod?: any;
      transactionRef?: string;
      bankName?: string;
      chequeNumber?: string;
      chequeDate?: Date;
      amount: number;
      forParticulars?: string;
      notes?: string;
      templateId?: string | Types.ObjectId;
    },
    userId: string | Types.ObjectId
  ): Promise<IMoneyReceipt> {
    const customer = await CustomerModel.findById(data.customerId);
    if (!customer) throw new NotFoundError('Customer not found');

    const amt = Number(data.amount);
    if (isNaN(amt) || amt <= 0) {
      throw new ValidationError('Receipt amount must be greater than zero');
    }

    const receiptNumber = await CounterService.getNextSequence('MR');

    const wordsEn = DocumentCalculationService.calculateDocument({
      items: [{ quantity: 1, unitPrice: amt }],
    }).amountInWordsEn;

    const wordsBn = DocumentCalculationService.calculateDocument({
      items: [{ quantity: 1, unitPrice: amt }],
    }).amountInWordsBn;

    const receipt = new MoneyReceiptModel({
      receiptNumber,
      organizationId: new Types.ObjectId(data.organizationId),
      customerId: new Types.ObjectId(data.customerId),
      salesInvoiceId: data.salesInvoiceId ? new Types.ObjectId(data.salesInvoiceId) : undefined,
      receiptDate: new Date(),
      paymentMethod: data.paymentMethod || 'CASH',
      transactionRef: data.transactionRef,
      bankName: data.bankName,
      chequeNumber: data.chequeNumber,
      chequeDate: data.chequeDate,
      amount: amt,
      amountInWordsEn: wordsEn,
      amountInWordsBn: wordsBn,
      forParticulars: data.forParticulars || 'Payment received against sales invoice',
      status: 'DRAFT',
      templateId: data.templateId ? new Types.ObjectId(data.templateId) : undefined,
      receivedBy: new Types.ObjectId(userId),
      notes: data.notes,
    });

    await receipt.save();
    return receipt;
  }

  public static async postMoneyReceipt(
    id: string | Types.ObjectId,
    userId: string | Types.ObjectId
  ): Promise<IMoneyReceipt> {
    const receipt = await MoneyReceiptModel.findById(id);
    if (!receipt) throw new NotFoundError('Money receipt not found');

    if (receipt.status === 'POSTED') {
      throw new ValidationError('Money receipt is already posted');
    }

    // Double-entry accounting GL Posting:
    // Debit Cash/Bank 1100, Credit Accounts Receivable 1200
    try {
      let cashBankAcc = await ChartOfAccountsModel.findOne({ accountCode: 1100 });
      if (!cashBankAcc) {
        cashBankAcc = await ChartOfAccountsModel.create({
          accountCode: 1100,
          accountName: 'Cash & Cash Equivalents',
          accountType: 'ASSET',
          normalBalance: 'DEBIT',
          isControl: true,
          isActive: true,
        });
      }

      let arAcc = await ChartOfAccountsModel.findOne({ accountCode: 1200 });
      if (!arAcc) {
        arAcc = await ChartOfAccountsModel.create({
          accountCode: 1200,
          accountName: 'Accounts Receivable',
          accountType: 'ASSET',
          normalBalance: 'DEBIT',
          isControl: true,
          isActive: true,
        });
      }

      const jvResult = await AccountingService.createJournalVoucher(
        {
          voucherType: 'RECEIPT',
          sourceDocumentRef: receipt.receiptNumber,
          lines: [
            {
              accountId: cashBankAcc._id,
              accountCode: 1100,
              accountName: 'Cash & Cash Equivalents',
              debit: receipt.amount,
              credit: 0,
              description: `Receipt: ${receipt.receiptNumber} - ${receipt.forParticulars}`,
            },
            {
              accountId: arAcc._id,
              accountCode: 1200,
              accountName: 'Accounts Receivable',
              debit: 0,
              credit: receipt.amount,
              description: `A/R Credit from ${receipt.receiptNumber}`,
            },
          ],
          status: 'POSTED',
          notes: `Official money receipt ${receipt.receiptNumber}`,
        },
        userId
      );

      receipt.journalEntryId = jvResult.journalEntry._id;
    } catch (err: any) {
      logger.error(`Failed to post GL entry for receipt ${receipt.receiptNumber}: ${err.message}`);
    }

    // If attached to a SalesInvoice, update invoice paid amount
    if (receipt.salesInvoiceId) {
      const invoice = await SalesInvoiceModel.findById(receipt.salesInvoiceId);
      if (invoice) {
        invoice.paidAmount = (invoice.paidAmount || 0) + receipt.amount;
        invoice.dueAmount = Math.max(0, invoice.grandTotal - invoice.paidAmount);
        if (invoice.dueAmount === 0) {
          invoice.paymentStatus = 'PAID';
        } else if (invoice.paidAmount > 0) {
          invoice.paymentStatus = 'PARTIALLY_PAID';
        }
        await invoice.save();
      }
    }

    receipt.status = 'POSTED';
    receipt.approvedBy = new Types.ObjectId(userId);

    // Save snapshot
    receipt.snapshot = await DocumentDataResolver.resolveDocument(
      'MONEY_RECEIPT',
      receipt._id,
      receipt.templateId
    );

    await receipt.save();
    return receipt;
  }

  public static async getMoneyReceipts(filters: {
    organizationId?: string | Types.ObjectId;
    customerId?: string | Types.ObjectId;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, Number(filters.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(filters.limit) || 20));
    const skip = (page - 1) * limit;

    const query: any = {};
    if (filters.organizationId) query.organizationId = filters.organizationId;
    if (filters.customerId) query.customerId = filters.customerId;
    if (filters.status && filters.status !== 'ALL') query.status = filters.status;

    const [items, total] = await Promise.all([
      MoneyReceiptModel.find(query)
        .populate('customerId', 'name companyName phone')
        .populate('salesInvoiceId', 'invoiceNo grandTotal')
        .sort({ receiptDate: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      MoneyReceiptModel.countDocuments(query),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) || 1 };
  }

  public static async getMoneyReceiptById(id: string | Types.ObjectId): Promise<IMoneyReceipt> {
    const receipt = await MoneyReceiptModel.findById(id)
      .populate('customerId')
      .populate('organizationId')
      .populate('salesInvoiceId');
    if (!receipt) throw new NotFoundError('Money receipt not found');
    return receipt;
  }

  // ─── 4. CREDIT NOTE ───────────────────────────────────────────────────────
  public static async createCreditNote(
    data: {
      organizationId: string | Types.ObjectId;
      customerId: string | Types.ObjectId;
      salesInvoiceId?: string | Types.ObjectId;
      reason: any;
      items: Array<{
        productId?: string | Types.ObjectId;
        sku: string;
        productName: string;
        quantity: number;
        unitPrice: number;
        taxAmount?: number;
        reason?: string;
      }>;
      notes?: string;
      templateId?: string | Types.ObjectId;
    },
    userId: string | Types.ObjectId
  ): Promise<ICreditNote> {
    const creditNoteNumber = await CounterService.getNextSequence('CN');

    let subtotal = 0;
    let taxTotal = 0;

    const items: ICreditNoteItem[] = data.items.map((it) => {
      const lineTax = it.taxAmount || 0;
      const lineTot = Number((it.quantity * it.unitPrice + lineTax).toFixed(2));
      subtotal += it.quantity * it.unitPrice;
      taxTotal += lineTax;
      return {
        productId: it.productId ? new Types.ObjectId(it.productId) : undefined,
        sku: it.sku.toUpperCase().trim(),
        productName: it.productName.trim(),
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        taxAmount: lineTax,
        totalAmount: lineTot,
        reason: it.reason,
      };
    });

    const totalAmount = Number((subtotal + taxTotal).toFixed(2));

    const words = DocumentCalculationService.calculateDocument({
      items: [{ quantity: 1, unitPrice: totalAmount }],
    });

    const creditNote = new CreditNoteModel({
      creditNoteNumber,
      organizationId: new Types.ObjectId(data.organizationId),
      customerId: new Types.ObjectId(data.customerId),
      salesInvoiceId: data.salesInvoiceId ? new Types.ObjectId(data.salesInvoiceId) : undefined,
      creditDate: new Date(),
      reason: data.reason,
      items,
      subtotal,
      taxTotal,
      totalAmount,
      amountInWordsEn: words.amountInWordsEn,
      amountInWordsBn: words.amountInWordsBn,
      status: 'DRAFT',
      templateId: data.templateId ? new Types.ObjectId(data.templateId) : undefined,
      issuedBy: new Types.ObjectId(userId),
      notes: data.notes,
    });

    await creditNote.save();
    return creditNote;
  }

  public static async postCreditNote(
    id: string | Types.ObjectId,
    userId: string | Types.ObjectId
  ): Promise<ICreditNote> {
    const cn = await CreditNoteModel.findById(id);
    if (!cn) throw new NotFoundError('Credit note not found');

    if (cn.status === 'POSTED') {
      throw new ValidationError('Credit note is already posted');
    }

    // Double-entry accounting: Debit Sales Returns 4100, Credit Accounts Receivable 1200
    try {
      let salesRetAcc = await ChartOfAccountsModel.findOne({ accountCode: 4100 });
      if (!salesRetAcc) {
        salesRetAcc = await ChartOfAccountsModel.create({
          accountCode: 4100,
          accountName: 'Sales Returns & Allowances',
          accountType: 'EXPENSE',
          normalBalance: 'DEBIT',
          isControl: false,
          isActive: true,
        });
      }

      let arAcc = await ChartOfAccountsModel.findOne({ accountCode: 1200 });
      if (!arAcc) {
        arAcc = await ChartOfAccountsModel.create({
          accountCode: 1200,
          accountName: 'Accounts Receivable',
          accountType: 'ASSET',
          normalBalance: 'DEBIT',
          isControl: true,
          isActive: true,
        });
      }

      const jvResult = await AccountingService.createJournalVoucher(
        {
          voucherType: 'JOURNAL',
          sourceDocumentRef: cn.creditNoteNumber,
          lines: [
            {
              accountId: salesRetAcc._id,
              accountCode: 4100,
              accountName: 'Sales Returns & Allowances',
              debit: cn.totalAmount,
              credit: 0,
              description: `Credit Note: ${cn.creditNoteNumber} (${cn.reason})`,
            },
            {
              accountId: arAcc._id,
              accountCode: 1200,
              accountName: 'Accounts Receivable',
              debit: 0,
              credit: cn.totalAmount,
              description: `A/R Credit reduction: ${cn.creditNoteNumber}`,
            },
          ],
          status: 'POSTED',
          notes: `Credit Note ${cn.creditNoteNumber}`,
        },
        userId
      );

      cn.journalEntryId = jvResult.journalEntry._id;
    } catch (err: any) {
      logger.error(`Failed to post GL entry for credit note ${cn.creditNoteNumber}: ${err.message}`);
    }

    cn.status = 'POSTED';
    cn.approvedBy = new Types.ObjectId(userId);
    cn.approvedAt = new Date();

    cn.snapshot = await DocumentDataResolver.resolveDocument('CREDIT_NOTE', cn._id, cn.templateId);
    await cn.save();
    return cn;
  }

  public static async getCreditNotes(filters: {
    organizationId?: string | Types.ObjectId;
    customerId?: string | Types.ObjectId;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, Number(filters.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(filters.limit) || 20));
    const skip = (page - 1) * limit;

    const query: any = {};
    if (filters.organizationId) query.organizationId = filters.organizationId;
    if (filters.customerId) query.customerId = filters.customerId;
    if (filters.status && filters.status !== 'ALL') query.status = filters.status;

    const [items, total] = await Promise.all([
      CreditNoteModel.find(query)
        .populate('customerId', 'name companyName phone')
        .populate('salesInvoiceId', 'invoiceNo')
        .sort({ creditDate: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      CreditNoteModel.countDocuments(query),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) || 1 };
  }

  public static async getCreditNoteById(id: string | Types.ObjectId): Promise<ICreditNote> {
    const cn = await CreditNoteModel.findById(id)
      .populate('customerId')
      .populate('organizationId')
      .populate('salesInvoiceId');
    if (!cn) throw new NotFoundError('Credit note not found');
    return cn;
  }
}

export default SalesDocumentService;
