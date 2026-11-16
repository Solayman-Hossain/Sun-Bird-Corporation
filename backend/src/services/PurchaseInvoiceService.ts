import { Types, ClientSession } from 'mongoose';
import { CounterService } from './CounterService';
import { ApprovalService } from './ApprovalService';
import { AccountingService } from './AccountingService';
import { AuditLogService } from './AuditLogService';
import {
  NotFoundError,
  ValidationError,
  DuplicateKeyError,
} from '../errors/AppError';
import logger from '../config/logger';

// Dynamic model imports
let PurchaseInvoiceModel: any;

async function getModel() {
  if (!PurchaseInvoiceModel) {
    try {
      const mod = await import('../models/PurchaseInvoice.js');
      PurchaseInvoiceModel = mod.PurchaseInvoiceModel;
    } catch {
      throw new Error('PurchaseInvoice model not yet available.');
    }
  }
  return PurchaseInvoiceModel;
}

export interface CreateInvoiceDTO {
  supplierInvoiceNumber: string;
  supplierId: string;
  purchaseOrderId?: string;
  grnIds?: string[];
  invoiceDate: Date | string;
  dueDate: Date | string;
  currency?: 'BDT' | 'USD' | 'EUR' | 'CNY' | 'JPY';
  exchangeRate?: number;
  items: Array<{
    productId: string;
    sku: string;
    productName: string;
    qty: number;
    uom: string;
    unitPrice: number;
    discount?: number;
    taxRate?: number;
  }>;
  subtotal: number;
  totalDiscount?: number;
  totalTax?: number;
  freightCharges?: number;
  otherCharges?: number;
  grandTotal: number;
  paidAmount?: number;
  paymentTerms?: string;
  attachments?: string[];
  notes?: string;
  // Org's AP account code for the journal entry
  apAccountCode?: number;
  inventoryAccountCode?: number;
}

export interface InvoiceFilterDTO {
  status?: string;
  supplierId?: string;
  purchaseOrderId?: string;
  startDate?: string;
  endDate?: string;
  overdue?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export class PurchaseInvoiceService {
  /**
   * Create a new Purchase Invoice in DRAFT status
   */
  public static async createInvoice(dto: CreateInvoiceDTO, userId: string, orgId: string) {
    if (!Types.ObjectId.isValid(userId)) throw new ValidationError('Invalid userId');
    if (!Types.ObjectId.isValid(orgId)) throw new ValidationError('Invalid orgId');
    if (!Types.ObjectId.isValid(dto.supplierId)) throw new ValidationError('Invalid supplierId');

    const Model = await getModel();

    // Check duplicate supplierInvoiceNumber for same supplier
    const duplicate = await Model.findOne({
      supplierInvoiceNumber: dto.supplierInvoiceNumber.trim(),
      supplierId: new Types.ObjectId(dto.supplierId),
      organizationId: new Types.ObjectId(orgId),
    });
    if (duplicate) {
      throw new DuplicateKeyError(
        `Invoice '${dto.supplierInvoiceNumber}' already exists for this supplier.`
      );
    }

    const invoiceNumber = await CounterService.getNextSequence('PINV');
    const paidAmount = dto.paidAmount || 0;
    const outstandingAmount = dto.grandTotal - paidAmount;

    const lineItems = dto.items.map((item) => {
      const taxAmount = ((item.taxRate || 0) / 100) * (item.qty * item.unitPrice - (item.discount || 0));
      const lineTotal = item.qty * item.unitPrice - (item.discount || 0) + taxAmount;
      return {
        productId: new Types.ObjectId(item.productId),
        sku: item.sku,
        productName: item.productName,
        qty: item.qty,
        uom: item.uom,
        unitPrice: item.unitPrice,
        discount: item.discount || 0,
        taxRate: item.taxRate || 0,
        taxAmount,
        lineTotal,
      };
    });

    const invoice = await Model.create({
      invoiceNumber,
      supplierInvoiceNumber: dto.supplierInvoiceNumber.trim(),
      organizationId: new Types.ObjectId(orgId),
      supplierId: new Types.ObjectId(dto.supplierId),
      purchaseOrderId: dto.purchaseOrderId ? new Types.ObjectId(dto.purchaseOrderId) : undefined,
      grnIds: dto.grnIds?.map((g) => new Types.ObjectId(g)) || [],
      invoiceDate: new Date(dto.invoiceDate as string),
      dueDate: new Date(dto.dueDate as string),
      currency: dto.currency || 'BDT',
      exchangeRate: dto.exchangeRate || 1,
      items: lineItems,
      subtotal: dto.subtotal,
      totalDiscount: dto.totalDiscount || 0,
      totalTax: dto.totalTax || 0,
      freightCharges: dto.freightCharges || 0,
      otherCharges: dto.otherCharges || 0,
      grandTotal: dto.grandTotal,
      paidAmount,
      outstandingAmount,
      paymentTerms: dto.paymentTerms,
      attachments: dto.attachments || [],
      notes: dto.notes,
      status: 'DRAFT',
      matchingStatus: 'UNMATCHED',
      createdBy: new Types.ObjectId(userId),
    });

    logger.info(`Purchase Invoice created: ${invoiceNumber}`);
    return invoice;
  }

  /**
   * Submit invoice for approval
   */
  public static async submitInvoice(id: string, userId: string) {
    const Model = await getModel();
    const invoice = await Model.findById(id);
    if (!invoice) throw new NotFoundError('PurchaseInvoice', id);
    if (invoice.status !== 'DRAFT') {
      throw new ValidationError(`Cannot submit invoice in status '${invoice.status}'.`);
    }

    const approvalRequest = await ApprovalService.createApprovalRequest(
      {
        documentType: 'PurchaseInvoice',
        documentId: id,
        documentRef: invoice.invoiceNumber,
        organizationId: invoice.organizationId?.toString(),
        module: 'PURCHASE',
        transactionType: 'PURCHASE_INVOICE',
        transactionAmount: invoice.grandTotal,
        transactionSnapshot: invoice.toObject(),
      },
      userId
    );

    invoice.status = 'SUBMITTED';
    invoice.approvalRequestId = approvalRequest._id;
    await invoice.save();

    await AuditLogService.record({
      action: 'SUBMIT',
      targetCollection: 'purchaseinvoices',
      targetId: invoice._id,
      actorId: userId,
      module: 'PURCHASE',
      organizationId: invoice.organizationId?.toString(),
    });

    return invoice;
  }

  /**
   * Post a purchase invoice: create Journal Entry (DR Inventory, CR AP)
   */
  public static async postInvoice(id: string, userId: string, session: ClientSession) {
    const Model = await getModel();
    const invoice = await Model.findById(id).session(session);
    if (!invoice) throw new NotFoundError('PurchaseInvoice', id);

    // IDEMPOTENCY CHECK
    if (invoice.status === 'POSTED') {
      logger.warn(`Invoice ${invoice.invoiceNumber} already posted — returning existing.`);
      return invoice;
    }
    if (!['DRAFT', 'SUBMITTED', 'APPROVED'].includes(invoice.status)) {
      throw new ValidationError(`Invoice cannot be posted in status '${invoice.status}'.`);
    }

    // Create Journal Entry:
    // DR: Inventory/Expense account (code 1300 default inventory, configurable)
    // CR: Accounts Payable (code 2100 default AP)
    const inventoryAccountCode = 1300; // Inventory asset
    const apAccountCode = 2100;        // Accounts Payable

    const journalResult = await AccountingService.createJournalVoucher(
      {
        voucherType: 'PURCHASE',
        transactionDate: invoice.invoiceDate,
        sourceDocumentRef: invoice.invoiceNumber,
        idempotencyKey: `PINV-POST-${invoice._id.toString()}`,
        notes: `Purchase Invoice: ${invoice.invoiceNumber} | Supplier Invoice: ${invoice.supplierInvoiceNumber}`,
        lines: [
          {
            accountCode: inventoryAccountCode,
            accountName: 'Inventory / Purchases',
            debit: invoice.grandTotal,
            credit: 0,
            description: `Purchase from supplier (${invoice.invoiceNumber})`,
          },
          {
            accountCode: apAccountCode,
            accountName: 'Accounts Payable',
            debit: 0,
            credit: invoice.grandTotal,
            description: `Payable to supplier (${invoice.supplierInvoiceNumber})`,
          },
        ],
      },
      userId,
      session
    );

    invoice.status = 'POSTED';
    invoice.journalEntryId = journalResult.journalEntry._id;
    invoice.outstandingAmount = invoice.grandTotal - (invoice.paidAmount || 0);
    invoice.postedAt = new Date();
    await invoice.save({ session });

    await AuditLogService.record({
      action: 'POST_INVOICE',
      targetCollection: 'purchaseinvoices',
      targetId: invoice._id,
      actorId: userId,
      module: 'PURCHASE',
      organizationId: invoice.organizationId?.toString(),
    });

    logger.info(`Purchase Invoice posted: ${invoice.invoiceNumber}`);
    return invoice;
  }

  /**
   * Allocate a payment to reduce outstandingAmount and update status
   */
  public static async allocatePayment(
    invoiceId: string,
    amount: number,
    session?: ClientSession
  ) {
    const Model = await getModel();
    if (!Types.ObjectId.isValid(invoiceId)) throw new ValidationError('Invalid invoiceId');
    if (amount <= 0) throw new ValidationError('Allocation amount must be positive.');

    const opts = session ? { session } : {};
    const invoice = await Model.findById(invoiceId, null, opts);
    if (!invoice) throw new NotFoundError('PurchaseInvoice', invoiceId);
    if (!['POSTED', 'PARTIALLY_PAID', 'OVERDUE'].includes(invoice.status)) {
      throw new ValidationError(`Cannot allocate payment to invoice in status '${invoice.status}'.`);
    }
    if (amount > invoice.outstandingAmount) {
      throw new ValidationError(
        `Allocation amount (${amount}) exceeds outstanding amount (${invoice.outstandingAmount}).`
      );
    }

    invoice.paidAmount = (invoice.paidAmount || 0) + amount;
    invoice.outstandingAmount = invoice.grandTotal - invoice.paidAmount;

    if (invoice.outstandingAmount <= 0) {
      invoice.status = 'PAID';
      invoice.outstandingAmount = 0;
    } else {
      invoice.status = 'PARTIALLY_PAID';
    }

    await invoice.save(opts);
    return invoice;
  }

  /**
   * List invoices with filters (org-scoped)
   */
  public static async listInvoices(filters: InvoiceFilterDTO, orgId: string) {
    const Model = await getModel();
    if (!Types.ObjectId.isValid(orgId)) throw new ValidationError('Invalid orgId');

    const query: Record<string, any> = { organizationId: new Types.ObjectId(orgId) };
    if (filters.status) query.status = filters.status.toUpperCase();
    if (filters.supplierId && Types.ObjectId.isValid(filters.supplierId)) {
      query.supplierId = new Types.ObjectId(filters.supplierId);
    }
    if (filters.purchaseOrderId && Types.ObjectId.isValid(filters.purchaseOrderId)) {
      query.purchaseOrderId = new Types.ObjectId(filters.purchaseOrderId);
    }
    if (filters.overdue) {
      query.dueDate = { $lt: new Date() };
      query.status = { $nin: ['PAID', 'CANCELLED'] };
    }
    if (filters.startDate || filters.endDate) {
      query.invoiceDate = {};
      if (filters.startDate) query.invoiceDate.$gte = new Date(filters.startDate);
      if (filters.endDate) query.invoiceDate.$lte = new Date(filters.endDate);
    }
    if (filters.search) {
      query.$or = [
        { invoiceNumber: new RegExp(filters.search, 'i') },
        { supplierInvoiceNumber: new RegExp(filters.search, 'i') },
      ];
    }

    const page = Math.max(1, filters.page || 1);
    const limit = Math.min(100, Math.max(1, filters.limit || 20));
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      Model.find(query)
        .populate('supplierId', 'companyName supplierCode')
        .populate('purchaseOrderId', 'poNumber')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Model.countDocuments(query),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  /**
   * Get single invoice by ID (org-scoped)
   */
  public static async getInvoiceById(id: string, orgId: string) {
    const Model = await getModel();
    if (!Types.ObjectId.isValid(id)) throw new NotFoundError('PurchaseInvoice', id);

    const invoice = await Model.findOne({
      _id: new Types.ObjectId(id),
      organizationId: new Types.ObjectId(orgId),
    })
      .populate('supplierId', 'companyName supplierCode email phone address')
      .populate('purchaseOrderId', 'poNumber status')
      .populate('grnIds', 'grnNumber receivingDate')
      .populate('journalEntryId')
      .lean();

    if (!invoice) throw new NotFoundError('PurchaseInvoice', id);
    return invoice;
  }

  /**
   * Accounts payable summary with aging buckets: Current, 1-30, 31-60, 61-90, 90+
   */
  public static async getPayablesSummary(
    orgId: string,
    filters?: { supplierId?: string; startDate?: string; endDate?: string }
  ) {
    const Model = await getModel();
    if (!Types.ObjectId.isValid(orgId)) throw new ValidationError('Invalid orgId');

    const today = new Date();

    const matchStage: Record<string, any> = {
      organizationId: new Types.ObjectId(orgId),
      status: { $nin: ['PAID', 'CANCELLED', 'DRAFT'] },
      outstandingAmount: { $gt: 0 },
    };
    if (filters?.supplierId && Types.ObjectId.isValid(filters.supplierId)) {
      matchStage.supplierId = new Types.ObjectId(filters.supplierId);
    }
    if (filters?.startDate || filters?.endDate) {
      matchStage.invoiceDate = {};
      if (filters?.startDate) matchStage.invoiceDate.$gte = new Date(filters.startDate!);
      if (filters?.endDate) matchStage.invoiceDate.$lte = new Date(filters.endDate!);
    }

    const pipeline = [
      { $match: matchStage },
      {
        $addFields: {
          daysPastDue: {
            $divide: [
              { $subtract: [today, '$dueDate'] },
              1000 * 60 * 60 * 24,
            ],
          },
        },
      },
      {
        $group: {
          _id: '$supplierId',
          totalOutstanding: { $sum: '$outstandingAmount' },
          current: {
            $sum: {
              $cond: [{ $lte: ['$daysPastDue', 0] }, '$outstandingAmount', 0],
            },
          },
          bucket_1_30: {
            $sum: {
              $cond: [
                { $and: [{ $gt: ['$daysPastDue', 0] }, { $lte: ['$daysPastDue', 30] }] },
                '$outstandingAmount',
                0,
              ],
            },
          },
          bucket_31_60: {
            $sum: {
              $cond: [
                { $and: [{ $gt: ['$daysPastDue', 30] }, { $lte: ['$daysPastDue', 60] }] },
                '$outstandingAmount',
                0,
              ],
            },
          },
          bucket_61_90: {
            $sum: {
              $cond: [
                { $and: [{ $gt: ['$daysPastDue', 60] }, { $lte: ['$daysPastDue', 90] }] },
                '$outstandingAmount',
                0,
              ],
            },
          },
          bucket_90_plus: {
            $sum: {
              $cond: [{ $gt: ['$daysPastDue', 90] }, '$outstandingAmount', 0],
            },
          },
          invoiceCount: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: 'suppliers',
          localField: '_id',
          foreignField: '_id',
          as: 'supplier',
        },
      },
      { $unwind: { path: '$supplier', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          supplierId: '$_id',
          supplierName: { $ifNull: ['$supplier.companyName', 'Unknown'] },
          supplierCode: '$supplier.supplierCode',
          totalOutstanding: 1,
          current: 1,
          bucket_1_30: 1,
          bucket_31_60: 1,
          bucket_61_90: 1,
          bucket_90_plus: 1,
          invoiceCount: 1,
          _id: 0,
        },
      },
      { $sort: { totalOutstanding: -1 } },
    ];

    const rows = await Model.aggregate(pipeline);

    // Totals
    const totals = rows.reduce(
      (acc: any, r: any) => {
        acc.totalOutstanding += r.totalOutstanding;
        acc.current += r.current;
        acc.bucket_1_30 += r.bucket_1_30;
        acc.bucket_31_60 += r.bucket_31_60;
        acc.bucket_61_90 += r.bucket_61_90;
        acc.bucket_90_plus += r.bucket_90_plus;
        return acc;
      },
      { totalOutstanding: 0, current: 0, bucket_1_30: 0, bucket_31_60: 0, bucket_61_90: 0, bucket_90_plus: 0 }
    );

    return { suppliers: rows, totals };
  }
}
