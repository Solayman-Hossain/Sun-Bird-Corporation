import { Types, ClientSession } from 'mongoose';
import { CounterService } from './CounterService';
import { AccountingService } from './AccountingService';
import { AuditLogService } from './AuditLogService';
import { PurchaseInvoiceService } from './PurchaseInvoiceService';
import {
  NotFoundError,
  ValidationError,
} from '../errors/AppError';
import logger from '../config/logger';

// Dynamic model import
let SupplierPaymentModel: any;

async function getModel() {
  if (!SupplierPaymentModel) {
    try {
      const mod = await import('../models/SupplierPayment.js');
      SupplierPaymentModel = mod.SupplierPaymentModel;
    } catch {
      throw new Error('SupplierPayment model not yet available.');
    }
  }
  return SupplierPaymentModel;
}

export interface PaymentAllocationDTO {
  invoiceId: string;
  allocatedAmount: number;
}

export interface CreatePaymentDTO {
  supplierId: string;
  paymentDate: Date | string;
  paymentMethod: 'CASH' | 'BANK_TRANSFER' | 'CHEQUE' | 'MOBILE_BANKING' | 'OTHER';
  bankAccountId?: string;
  chequeNumber?: string;
  paymentAmount: number;
  currency?: string;
  exchangeRate?: number;
  allocations: PaymentAllocationDTO[];
  notes?: string;
  attachments?: string[];
  // Account codes for journal
  apAccountCode?: number;
  bankAccountCode?: number;
}

export interface PaymentFilterDTO {
  status?: string;
  supplierId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export class SupplierPaymentService {
  /**
   * Create a supplier payment in DRAFT status
   */
  public static async createPayment(dto: CreatePaymentDTO, userId: string, orgId: string) {
    if (!Types.ObjectId.isValid(userId)) throw new ValidationError('Invalid userId');
    if (!Types.ObjectId.isValid(orgId)) throw new ValidationError('Invalid orgId');
    if (!Types.ObjectId.isValid(dto.supplierId)) throw new ValidationError('Invalid supplierId');
    if (!dto.allocations || dto.allocations.length === 0) {
      throw new ValidationError('At least one invoice allocation is required.');
    }

    // Validate total allocated <= paymentAmount
    const totalAllocated = dto.allocations.reduce((s, a) => s + a.allocatedAmount, 0);
    if (totalAllocated > dto.paymentAmount) {
      throw new ValidationError(
        `Total allocated (${totalAllocated}) exceeds payment amount (${dto.paymentAmount}).`
      );
    }

    const Model = await getModel();
    const paymentNumber = await CounterService.getNextSequence('SPAY');

    // Validate all invoices belong to same supplier and org
    for (const alloc of dto.allocations) {
      if (!Types.ObjectId.isValid(alloc.invoiceId)) {
        throw new ValidationError(`Invalid invoiceId: ${alloc.invoiceId}`);
      }
      const inv = await PurchaseInvoiceService.getInvoiceById(alloc.invoiceId, orgId);
      if (!inv) throw new NotFoundError('PurchaseInvoice', alloc.invoiceId);
      if (inv.supplierId._id?.toString() !== dto.supplierId &&
          inv.supplierId?.toString() !== dto.supplierId) {
        throw new ValidationError(
          `Invoice ${alloc.invoiceId} does not belong to supplier ${dto.supplierId}.`
        );
      }
      if (alloc.allocatedAmount <= 0) {
        throw new ValidationError(`Allocation amount must be positive for invoice ${alloc.invoiceId}.`);
      }
    }

    const payment = await Model.create({
      paymentNumber,
      organizationId: new Types.ObjectId(orgId),
      supplierId: new Types.ObjectId(dto.supplierId),
      paymentDate: new Date(dto.paymentDate as string),
      paymentMethod: dto.paymentMethod,
      bankAccountId: dto.bankAccountId ? new Types.ObjectId(dto.bankAccountId) : undefined,
      chequeNumber: dto.chequeNumber,
      paymentAmount: dto.paymentAmount,
      currency: dto.currency || 'BDT',
      exchangeRate: dto.exchangeRate || 1,
      allocations: dto.allocations.map((a) => ({
        invoiceId: new Types.ObjectId(a.invoiceId),
        allocatedAmount: a.allocatedAmount,
      })),
      notes: dto.notes,
      attachments: dto.attachments || [],
      status: 'DRAFT',
      createdBy: new Types.ObjectId(userId),
    });

    logger.info(`Supplier Payment created: ${paymentNumber}`);
    return payment;
  }

  /**
   * Post a supplier payment: allocate invoices, create JV, update status
   */
  public static async postPayment(id: string, userId: string, session: ClientSession) {
    const Model = await getModel();
    const payment = await Model.findById(id).session(session);
    if (!payment) throw new NotFoundError('SupplierPayment', id);

    // IDEMPOTENCY CHECK
    if (payment.status === 'POSTED') {
      logger.warn(`Payment ${payment.paymentNumber} already posted — returning existing.`);
      return payment;
    }
    if (payment.status !== 'DRAFT') {
      throw new ValidationError(`Payment cannot be posted in status '${payment.status}'.`);
    }

    // Allocate each invoice
    for (const alloc of payment.allocations) {
      await PurchaseInvoiceService.allocatePayment(
        alloc.invoiceId.toString(),
        alloc.allocatedAmount,
        session
      );
    }

    // Journal Entry:
    // DR: Accounts Payable (supplier liability reduced) — code 2100
    // CR: Cash/Bank account — code 1100 (cash) or based on bankAccountId
    const apAccountCode = 2100;
    const cashBankAccountCode = 1100; // Default cash/bank, can be extended per bankAccountId

    const journalResult = await AccountingService.createJournalVoucher(
      {
        voucherType: 'PAYMENT',
        transactionDate: payment.paymentDate,
        sourceDocumentRef: payment.paymentNumber,
        idempotencyKey: `SPAY-POST-${payment._id.toString()}`,
        notes: `Supplier Payment: ${payment.paymentNumber}`,
        lines: [
          {
            accountCode: apAccountCode,
            accountName: 'Accounts Payable',
            debit: payment.paymentAmount,
            credit: 0,
            description: `Settlement of supplier payables (${payment.paymentNumber})`,
          },
          {
            accountCode: cashBankAccountCode,
            accountName: 'Cash / Bank',
            debit: 0,
            credit: payment.paymentAmount,
            description: `Payment via ${payment.paymentMethod} (${payment.paymentNumber})`,
          },
        ],
      },
      userId,
      session
    );

    payment.status = 'POSTED';
    payment.journalEntryId = journalResult.journalEntry._id;
    payment.postedAt = new Date();
    await payment.save({ session });

    await AuditLogService.record({
      action: 'POST_PAYMENT',
      targetCollection: 'supplierpayments',
      targetId: payment._id,
      actorId: userId,
      module: 'PURCHASE',
      organizationId: payment.organizationId?.toString(),
    });

    logger.info(`Supplier Payment posted: ${payment.paymentNumber}`);
    return payment;
  }

  /**
   * Reverse a posted supplier payment: create reversal JV, reverse invoice allocations
   */
  public static async reversePayment(
    id: string,
    userId: string,
    reason: string,
    session: ClientSession
  ) {
    const Model = await getModel();
    const payment = await Model.findById(id).session(session);
    if (!payment) throw new NotFoundError('SupplierPayment', id);
    if (payment.status !== 'POSTED') {
      throw new ValidationError(`Only POSTED payments can be reversed. Current: '${payment.status}'.`);
    }
    if (!reason || reason.trim().length === 0) throw new ValidationError('Reversal reason is required.');

    // Reverse each invoice allocation (add back outstanding)
    for (const alloc of payment.allocations) {
      // Re-open the invoice by decrementing paidAmount and incrementing outstandingAmount
      let PurchaseInvoiceModel: any;
      try {
        const mod = await import('../models/PurchaseInvoice.js');
        PurchaseInvoiceModel = mod.PurchaseInvoiceModel;
      } catch {
        throw new Error('PurchaseInvoice model not available for reversal.');
      }

      const invoice = await PurchaseInvoiceModel.findById(alloc.invoiceId).session(session);
      if (invoice) {
        invoice.paidAmount = Math.max(0, (invoice.paidAmount || 0) - alloc.allocatedAmount);
        invoice.outstandingAmount = invoice.grandTotal - invoice.paidAmount;
        invoice.status = invoice.outstandingAmount <= 0 ? 'PAID' : 'PARTIALLY_PAID';
        if (invoice.outstandingAmount >= invoice.grandTotal) invoice.status = 'POSTED';
        await invoice.save({ session });
      }
    }

    // Reversal Journal Entry (mirror/negate the original)
    const apAccountCode = 2100;
    const cashBankAccountCode = 1100;

    await AccountingService.createJournalVoucher(
      {
        voucherType: 'PAYMENT',
        transactionDate: new Date(),
        sourceDocumentRef: `REV-${payment.paymentNumber}`,
        idempotencyKey: `SPAY-REV-${payment._id.toString()}`,
        notes: `Reversal of Payment: ${payment.paymentNumber} | Reason: ${reason}`,
        lines: [
          {
            accountCode: cashBankAccountCode,
            accountName: 'Cash / Bank',
            debit: payment.paymentAmount,
            credit: 0,
            description: `Reversal: payment returned (${payment.paymentNumber})`,
          },
          {
            accountCode: apAccountCode,
            accountName: 'Accounts Payable',
            debit: 0,
            credit: payment.paymentAmount,
            description: `Reversal: AP re-opened (${payment.paymentNumber})`,
          },
        ],
      },
      userId,
      session
    );

    payment.status = 'REVERSED';
    payment.reversalReason = reason;
    payment.reversedAt = new Date();
    await payment.save({ session });

    await AuditLogService.record({
      action: 'REVERSE_PAYMENT',
      targetCollection: 'supplierpayments',
      targetId: payment._id,
      actorId: userId,
      module: 'PURCHASE',
      diff: { reason },
      organizationId: payment.organizationId?.toString(),
    });

    return payment;
  }

  /**
   * List payments with filters (org-scoped)
   */
  public static async listPayments(filters: PaymentFilterDTO, orgId: string) {
    const Model = await getModel();
    if (!Types.ObjectId.isValid(orgId)) throw new ValidationError('Invalid orgId');

    const query: Record<string, any> = { organizationId: new Types.ObjectId(orgId) };
    if (filters.status) query.status = filters.status.toUpperCase();
    if (filters.supplierId && Types.ObjectId.isValid(filters.supplierId)) {
      query.supplierId = new Types.ObjectId(filters.supplierId);
    }
    if (filters.startDate || filters.endDate) {
      query.paymentDate = {};
      if (filters.startDate) query.paymentDate.$gte = new Date(filters.startDate);
      if (filters.endDate) query.paymentDate.$lte = new Date(filters.endDate);
    }
    if (filters.search) query.paymentNumber = new RegExp(filters.search, 'i');

    const page = Math.max(1, filters.page || 1);
    const limit = Math.min(100, Math.max(1, filters.limit || 20));
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      Model.find(query)
        .populate('supplierId', 'companyName supplierCode')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Model.countDocuments(query),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  /**
   * Get single payment by ID (org-scoped)
   */
  public static async getPaymentById(id: string, orgId: string) {
    const Model = await getModel();
    if (!Types.ObjectId.isValid(id)) throw new NotFoundError('SupplierPayment', id);

    const payment = await Model.findOne({
      _id: new Types.ObjectId(id),
      organizationId: new Types.ObjectId(orgId),
    })
      .populate('supplierId', 'companyName supplierCode email phone')
      .populate('allocations.invoiceId', 'invoiceNumber supplierInvoiceNumber grandTotal outstandingAmount')
      .lean();

    if (!payment) throw new NotFoundError('SupplierPayment', id);
    return payment;
  }
}
