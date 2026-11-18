import { Types } from 'mongoose';
import { SalesInvoiceModel, ISalesInvoice } from '../models/SalesInvoice';
import { PurchaseInvoiceModel, IPurchaseInvoice } from '../models/PurchaseInvoice';
import { SupplierPaymentModel, ISupplierPayment } from '../models/SupplierPayment';
import { CustomerModel } from '../models/Customer';
import { SupplierModel } from '../models/Supplier';
import { CustomerCreditProfileModel } from '../models/CustomerCreditProfile';
import { MoneyReceiptModel } from '../models/MoneyReceipt';
import { JournalEntryModel } from '../models/JournalEntry';
import { AccountingService } from './AccountingService';
import { ValidationError, NotFoundError } from '../errors/AppError';

export interface AgingBucket {
  current: number;
  days1_30: number;
  days31_60: number;
  days61_90: number;
  over90: number;
  total: number;
}

export class ReceivablePayableService {
  /**
   * Accounts Receivable: Aggregated Aging & Customer Overview
   */
  public static async getReceivablesDashboard(organizationId?: string): Promise<{
    totalReceivables: number;
    aging: AgingBucket;
    topCustomers: Array<{
      customerId: string;
      customerName: string;
      mobile: string;
      creditLimit: number;
      outstandingAR: number;
      overdueAmount: number;
    }>;
  }> {
    const invoices = await SalesInvoiceModel.find({
      paymentStatus: { $in: ['UNPAID', 'PARTIALLY_PAID', 'OVERDUE'] },
      status: { $ne: 'VOID' },
    })
      .populate('customerId', 'fullName mobile email')
      .lean();

    const now = Date.now();
    let current = 0;
    let days1_30 = 0;
    let days31_60 = 0;
    let days61_90 = 0;
    let over90 = 0;
    let totalReceivables = 0;

    const customerMap = new Map<string, { name: string; mobile: string; outstanding: number; overdue: number }>();

    for (const inv of invoices) {
      const due = (inv as any).outstandingAmount || (inv as any).dueAmount || inv.grandTotal - (inv.paidAmount || 0);
      if (due <= 0) continue;

      totalReceivables += due;
      const dueDate = new Date(inv.dueDate || inv.invoiceDate).getTime();
      const diffDays = Math.max(0, Math.floor((now - dueDate) / (1000 * 60 * 60 * 24)));

      if (diffDays === 0) current += due;
      else if (diffDays <= 30) days1_30 += due;
      else if (diffDays <= 60) days31_60 += due;
      else if (diffDays <= 90) days61_90 += due;
      else over90 += due;

      const custObj: any = inv.customerId;
      const cId = custObj?._id ? custObj._id.toString() : String(inv.customerId);
      const cName = custObj?.fullName || 'Hospital / Client';
      const cMobile = custObj?.mobile || '';

      const exist = customerMap.get(cId) || { name: cName, mobile: cMobile, outstanding: 0, overdue: 0 };
      exist.outstanding += due;
      if (diffDays > 0) exist.overdue += due;
      customerMap.set(cId, exist);
    }

    const topCustomers: any[] = [];
    for (const [id, data] of customerMap.entries()) {
      topCustomers.push({
        customerId: id,
        customerName: data.name,
        mobile: data.mobile,
        creditLimit: 500000,
        outstandingAR: Number(data.outstanding.toFixed(2)),
        overdueAmount: Number(data.overdue.toFixed(2)),
      });
    }

    topCustomers.sort((a, b) => b.outstandingAR - a.outstandingAR);

    return {
      totalReceivables: Number(totalReceivables.toFixed(2)),
      aging: {
        current: Number(current.toFixed(2)),
        days1_30: Number(days1_30.toFixed(2)),
        days31_60: Number(days31_60.toFixed(2)),
        days61_90: Number(days61_90.toFixed(2)),
        over90: Number(over90.toFixed(2)),
        total: Number(totalReceivables.toFixed(2)),
      },
      topCustomers: topCustomers.slice(0, 10),
    };
  }

  /**
   * Customer Ledger: Drill-down statement for a specific customer
   */
  public static async getCustomerLedger(customerId: string): Promise<{
    customer: any;
    openingBalance: number;
    closingBalance: number;
    invoices: ISalesInvoice[];
    receipts: any[];
    entries: Array<{
      date: Date;
      documentType: 'INVOICE' | 'RECEIPT' | 'CREDIT_NOTE';
      reference: string;
      description: string;
      debit: number;
      credit: number;
      balance: number;
    }>;
  }> {
    const custId = new Types.ObjectId(customerId);
    const [customer, invoices, receipts] = await Promise.all([
      CustomerModel.findById(custId).lean(),
      SalesInvoiceModel.find({ customerId: custId }).sort({ invoiceDate: 1 }).lean(),
      MoneyReceiptModel.find({ customerId: custId, status: { $ne: 'CANCELLED' } }).sort({ receiptDate: 1 }).lean(),
    ]);

    if (!customer) throw new NotFoundError('Customer', customerId);

    const entries: any[] = [];
    let runningBalance = 0;

    for (const inv of invoices) {
      runningBalance += inv.grandTotal;
      entries.push({
        date: inv.invoiceDate,
        documentType: 'INVOICE',
        reference: inv.invoiceNo,
        description: `Sales Invoice #${inv.invoiceNo} (Due: ${new Date(inv.dueDate).toLocaleDateString()})`,
        debit: inv.grandTotal,
        credit: 0,
        balance: runningBalance,
      });
    }

    for (const mr of receipts) {
      runningBalance -= mr.amount;
      entries.push({
        date: mr.receiptDate,
        documentType: 'RECEIPT',
        reference: mr.receiptNumber,
        description: `Payment Receipt #${mr.receiptNumber} (${mr.paymentMethod}) - ${mr.forParticulars || 'Collection'}`,
        debit: 0,
        credit: mr.amount,
        balance: runningBalance,
      });
    }

    entries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return {
      customer,
      openingBalance: 0,
      closingBalance: runningBalance,
      invoices: invoices as any,
      receipts,
      entries,
    };
  }

  /**
   * Customer Payment Allocation: Allocates a Money Receipt across outstanding invoices.
   */
  public static async allocateCustomerPayment(
    receiptId: string,
    allocations: Array<{ invoiceId: string; amount: number }>
  ): Promise<{ updatedInvoices: string[]; remainingReceiptAmount: number }> {
    const receipt = await MoneyReceiptModel.findById(receiptId);
    if (!receipt) throw new NotFoundError('Money Receipt', receiptId);

    let totalAllocated = 0;
    const updatedInvoices: string[] = [];

    for (const alloc of allocations) {
      if (alloc.amount <= 0) continue;
      const inv = await SalesInvoiceModel.findById(alloc.invoiceId);
      if (!inv) continue;

      const due = inv.dueAmount || inv.grandTotal - (inv.paidAmount || 0);
      const allocAmount = Math.min(alloc.amount, due);

      inv.paidAmount = (inv.paidAmount || 0) + allocAmount;
      inv.dueAmount = Math.max(0, inv.grandTotal - inv.paidAmount);
      inv.paymentStatus = inv.dueAmount === 0 ? 'PAID' : 'PARTIALLY_PAID';

      await inv.save();
      totalAllocated += allocAmount;
      updatedInvoices.push(inv.invoiceNo);
    }

    return {
      updatedInvoices,
      remainingReceiptAmount: Math.max(0, receipt.amount - totalAllocated),
    };
  }

  /**
   * Accounts Payable: Aggregated Aging & Supplier Overview
   */
  public static async getPayablesDashboard(organizationId?: string): Promise<{
    totalPayables: number;
    aging: AgingBucket;
    topSuppliers: Array<{
      supplierId: string;
      supplierName: string;
      outstandingAP: number;
      overdueAmount: number;
    }>;
  }> {
    const invoices = await PurchaseInvoiceModel.find({
      status: { $in: ['POSTED', 'PARTIALLY_PAID', 'OVERDUE'] },
    })
      .populate('supplierId', 'companyName supplierCode mobile')
      .lean();

    const now = Date.now();
    let current = 0;
    let days1_30 = 0;
    let days31_60 = 0;
    let days61_90 = 0;
    let over90 = 0;
    let totalPayables = 0;

    const supplierMap = new Map<string, { name: string; outstanding: number; overdue: number }>();

    for (const inv of invoices) {
      const due = (inv as any).outstandingAmount || (inv as any).dueAmount || inv.grandTotal - (inv.paidAmount || 0);
      if (due <= 0) continue;

      totalPayables += due;
      const dueDate = new Date(inv.dueDate || inv.createdAt).getTime();
      const diffDays = Math.max(0, Math.floor((now - dueDate) / (1000 * 60 * 60 * 24)));

      if (diffDays === 0) current += due;
      else if (diffDays <= 30) days1_30 += due;
      else if (diffDays <= 60) days31_60 += due;
      else if (diffDays <= 90) days61_90 += due;
      else over90 += due;

      const suppObj: any = inv.supplierId;
      const sId = suppObj?._id ? suppObj._id.toString() : String(inv.supplierId);
      const sName = suppObj?.companyName || 'Supplier';

      const exist = supplierMap.get(sId) || { name: sName, outstanding: 0, overdue: 0 };
      exist.outstanding += due;
      if (diffDays > 0) exist.overdue += due;
      supplierMap.set(sId, exist);
    }

    const topSuppliers: any[] = [];
    for (const [id, data] of supplierMap.entries()) {
      topSuppliers.push({
        supplierId: id,
        supplierName: data.name,
        outstandingAP: Number(data.outstanding.toFixed(2)),
        overdueAmount: Number(data.overdue.toFixed(2)),
      });
    }

    topSuppliers.sort((a, b) => b.outstandingAP - a.outstandingAP);

    return {
      totalPayables: Number(totalPayables.toFixed(2)),
      aging: {
        current: Number(current.toFixed(2)),
        days1_30: Number(days1_30.toFixed(2)),
        days31_60: Number(days31_60.toFixed(2)),
        days61_90: Number(days61_90.toFixed(2)),
        over90: Number(over90.toFixed(2)),
        total: Number(totalPayables.toFixed(2)),
      },
      topSuppliers: topSuppliers.slice(0, 10),
    };
  }

  /**
   * Supplier Ledger: Drill-down statement for a specific supplier
   */
  public static async getSupplierLedger(supplierId: string): Promise<{
    supplier: any;
    openingBalance: number;
    closingBalance: number;
    invoices: IPurchaseInvoice[];
    payments: ISupplierPayment[];
    entries: Array<{
      date: Date;
      documentType: 'PURCHASE_INVOICE' | 'PAYMENT';
      reference: string;
      description: string;
      debit: number;
      credit: number;
      balance: number;
    }>;
  }> {
    const sId = new Types.ObjectId(supplierId);
    const [supplier, invoices, payments] = await Promise.all([
      SupplierModel.findById(sId).lean(),
      PurchaseInvoiceModel.find({ supplierId: sId }).sort({ createdAt: 1 }).lean(),
      SupplierPaymentModel.find({ supplierId: sId, status: { $ne: 'CANCELLED' } }).sort({ paymentDate: 1 }).lean(),
    ]);

    if (!supplier) throw new NotFoundError('Supplier', supplierId);

    const entries: any[] = [];
    let runningBalance = 0;

    for (const inv of invoices) {
      runningBalance += inv.grandTotal;
      entries.push({
        date: inv.createdAt,
        documentType: 'PURCHASE_INVOICE',
        reference: inv.invoiceNumber,
        description: `Purchase Bill #${inv.invoiceNumber} (Supplier Ref: ${inv.supplierInvoiceNumber})`,
        debit: 0,
        credit: inv.grandTotal, // AP increases with credit
        balance: runningBalance,
      });
    }

    for (const p of payments) {
      runningBalance -= p.paymentAmount;
      entries.push({
        date: p.paymentDate,
        documentType: 'PAYMENT',
        reference: p.paymentNumber,
        description: `Disbursement #${p.paymentNumber} (${p.paymentMethod})`,
        debit: p.paymentAmount, // AP decreases with debit
        credit: 0,
        balance: runningBalance,
      });
    }

    entries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return {
      supplier,
      openingBalance: 0,
      closingBalance: runningBalance,
      invoices: invoices as any,
      payments: payments as any,
      entries,
    };
  }

  /**
   * Supplier Payment Management: Records payment, updates invoices, and posts double-entry JV.
   */
  public static async recordSupplierPayment(dto: {
    organizationId: string | Types.ObjectId;
    supplierId: string | Types.ObjectId;
    paymentAmount: number;
    paymentMethod: 'CASH' | 'BANK_TRANSFER' | 'CHEQUE' | 'MOBILE_BANKING';
    sourceAccountCode?: number; // 1005 (Cash) or 1010 (Bank)
    chequeNumber?: string;
    allocations?: Array<{ invoiceId: string; amount: number }>;
    notes?: string;
    userId: string | Types.ObjectId;
  }): Promise<{ payment: ISupplierPayment; journalVoucherNo?: string }> {
    if (dto.paymentAmount <= 0) {
      throw new ValidationError('Supplier payment amount must be positive');
    }

    const orgId = new Types.ObjectId(dto.organizationId.toString());
    const suppId = new Types.ObjectId(dto.supplierId.toString());
    const supplier = await SupplierModel.findById(suppId);
    if (!supplier) throw new NotFoundError('Supplier', dto.supplierId.toString());

    const sourceAccount = dto.sourceAccountCode || (dto.paymentMethod === 'CASH' ? 1005 : 1010);
    const paymentNumber = `SP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    // 1. Post double-entry Journal: DR Accounts Payable (2010), CR Cash/Bank (1005/1010)
    const jvResult = await AccountingService.createJournalVoucher(
      {
        voucherType: 'PAYMENT',
        transactionDate: new Date(),
        sourceDocumentRef: paymentNumber,
        lines: [
          {
            accountCode: 2010, // Accounts Payable
            accountName: 'Accounts Payable (Trade)',
            debit: dto.paymentAmount,
            credit: 0,
            description: `Payment to ${supplier.companyName} (${paymentNumber})`,
          },
          {
            accountCode: sourceAccount,
            accountName: sourceAccount === 1005 ? 'Cash in Hand' : 'Cash at Bank',
            debit: 0,
            credit: dto.paymentAmount,
            description: `Disbursement for ${supplier.companyName} (${dto.paymentMethod})`,
          },
        ],
        notes: dto.notes,
      },
      dto.userId
    );

    // 2. Allocate payment across supplier invoices if specified
    const allocationsFormatted: any[] = [];
    if (dto.allocations && dto.allocations.length > 0) {
      for (const alloc of dto.allocations) {
        const inv = await PurchaseInvoiceModel.findById(alloc.invoiceId);
        if (inv) {
          inv.paidAmount = (inv.paidAmount || 0) + alloc.amount;
          inv.outstandingAmount = Math.max(0, inv.grandTotal - inv.paidAmount);
          inv.dueAmount = inv.outstandingAmount;
          inv.status = inv.outstandingAmount === 0 ? 'PAID' : 'PARTIALLY_PAID';
          await inv.save();
          allocationsFormatted.push({
            invoiceId: inv._id,
            allocatedAmount: alloc.amount,
          });
        }
      }
    }

    // 3. Save SupplierPayment record
    const payment = await SupplierPaymentModel.create({
      paymentNumber,
      organizationId: orgId,
      supplierId: suppId,
      paymentDate: new Date(),
      paymentMethod: dto.paymentMethod,
      chequeNumber: dto.chequeNumber,
      paymentAmount: dto.paymentAmount,
      currency: 'BDT',
      exchangeRate: 1.0,
      allocations: allocationsFormatted,
      notes: dto.notes,
      status: 'POSTED',
      journalEntryId: jvResult.journalEntry._id,
      postedAt: new Date(),
      createdBy: dto.userId ? new Types.ObjectId(dto.userId) : new Types.ObjectId(),
    });

    return {
      payment,
      journalVoucherNo: jvResult.journalEntry.voucherNo,
    };
  }
}
