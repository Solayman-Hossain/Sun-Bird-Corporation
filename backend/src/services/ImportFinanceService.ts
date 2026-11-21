import { Types, ClientSession } from 'mongoose';
import {
  ProformaInvoiceModel,
  IProformaInvoice,
} from '../models/ProformaInvoice';
import {
  LCAmendmentModel,
  ILCAmendment,
} from '../models/LCAmendment';
import {
  ImportPaymentModel,
  IImportPayment,
  ImportPaymentType,
} from '../models/ImportPayment';
import { ImportLCModel, IImportLC } from '../models/ImportLC';
import { SupplierModel } from '../models/Supplier';
import { CounterService } from './CounterService';
import { AuditLogService } from './AuditLogService';
import { AccountingService } from './AccountingService';
import { ImportAiService } from './ImportAiService';
import { NotFoundError, ValidationError, DuplicateKeyError } from '../errors/AppError';
import logger from '../config/logger';

export interface CreateProformaInvoiceDTO {
  piNumber: string;
  piDate?: Date | string;
  organizationId: string | Types.ObjectId;
  supplierId: string | Types.ObjectId;
  countryOfOrigin?: string;
  currency: 'USD' | 'EUR' | 'CNY' | 'JPY' | 'GBP';
  items: Array<{
    productId?: string | Types.ObjectId;
    productName: string;
    sku?: string;
    hsCode?: string;
    quantity: number;
    unit: string;
    unitPriceFC: number;
    specification?: string;
  }>;
  freightFC?: number;
  insuranceFC?: number;
  discountFC?: number;
  incoterms?: string;
  paymentTerms?: string;
  portOfLoading?: string;
  portOfDischarge?: string;
  estimatedShipmentDate?: Date | string;
  validityDate?: Date | string;
  purchaseOrderId?: string | Types.ObjectId;
  notes?: string;
}

export interface CreateLCAmendmentDTO {
  lcId: string | Types.ObjectId;
  organizationId: string | Types.ObjectId;
  amendmentDate?: Date | string;
  revisedAmountFC?: number;
  revisedExpiryDate?: Date | string;
  revisedShipmentDate?: Date | string;
  changedClauses: string;
  reason: string;
  amendmentChargesBDT?: number;
  bankConfirmationRef?: string;
  bankConfirmationDate?: Date | string;
}

export interface RecordImportPaymentDTO {
  organizationId: string | Types.ObjectId;
  lcId: string | Types.ObjectId;
  supplierId?: string | Types.ObjectId;
  bankName: string;
  paymentType: ImportPaymentType;
  currency?: string;
  foreignAmount: number;
  exchangeRate: number;
  paymentDate?: Date | string;
  maturityDate?: Date | string;
  paymentMethod?: 'BANK_TRANSFER' | 'PAY_ORDER' | 'EFTN' | 'RTGS' | 'LC_DEBIT';
  transactionReference: string;
  bankAccountId?: string | Types.ObjectId;
  notes?: string;
}

export class ImportFinanceService {
  /**
   * 1. Creates a Proforma Invoice with automated line item total calculation
   */
  public static async createProformaInvoice(
    dto: CreateProformaInvoiceDTO,
    actorId?: string | Types.ObjectId,
    session?: ClientSession
  ): Promise<IProformaInvoice> {
    const supplier = await SupplierModel.findById(dto.supplierId).session(session || null);
    if (!supplier) {
      throw new NotFoundError('Supplier', dto.supplierId.toString());
    }

    if (!dto.items || dto.items.length === 0) {
      throw new ValidationError('Proforma Invoice must contain at least 1 product line item');
    }

    const calculatedItems = dto.items.map((item) => ({
      productId: item.productId ? new Types.ObjectId(item.productId) : undefined,
      productName: item.productName.trim(),
      sku: item.sku?.trim().toUpperCase(),
      hsCode: item.hsCode?.trim(),
      quantity: item.quantity,
      unit: item.unit || 'PCS',
      unitPriceFC: item.unitPriceFC,
      totalAmountFC: Number((item.quantity * item.unitPriceFC).toFixed(2)),
      specification: item.specification,
    }));

    const totalAmountFC = Number(
      calculatedItems.reduce((acc, curr) => acc + curr.totalAmountFC, 0).toFixed(2)
    );
    const freightFC = dto.freightFC || 0;
    const insuranceFC = dto.insuranceFC || 0;
    const discountFC = dto.discountFC || 0;
    const grandTotalFC = Number((totalAmountFC + freightFC + insuranceFC - discountFC).toFixed(2));

    const piDocs = await ProformaInvoiceModel.create(
      [
        {
          proformaNumber: dto.piNumber.trim().toUpperCase(),
          piNumber: dto.piNumber.trim().toUpperCase(),
          proformaDate: dto.piDate ? new Date(dto.piDate) : new Date(),
          piDate: dto.piDate ? new Date(dto.piDate) : new Date(),
          organizationId: new Types.ObjectId(dto.organizationId),
          supplierId: supplier._id,
          supplierName: supplier.companyName,
          countryOfOrigin: dto.countryOfOrigin || 'Taiwan',
          currency: dto.currency || 'USD',
          items: calculatedItems,
          totalAmountFC,
          freightFC,
          insuranceFC,
          discountFC,
          grandTotalFC,
          grandTotal: grandTotalFC,
          incoterms: dto.incoterms || 'CFR',
          paymentTerms: dto.paymentTerms || '100% L/C at Sight',
          portOfLoading: dto.portOfLoading || 'Keelung',
          portOfDischarge: dto.portOfDischarge || 'Chittagong Port',
          estimatedShipmentDate: dto.estimatedShipmentDate ? new Date(dto.estimatedShipmentDate) : undefined,
          validityDate: dto.validityDate ? new Date(dto.validityDate) : undefined,
          status: 'VERIFIED',
          purchaseOrderId: dto.purchaseOrderId ? new Types.ObjectId(dto.purchaseOrderId) : undefined,
          notes: dto.notes,
        },
      ],
      { session }
    );

    const pi = piDocs[0];

    if (actorId) {
      await AuditLogService.record({
        action: 'CREATE',
        targetCollection: 'ProformaInvoice',
        targetId: pi._id,
        actorId: new Types.ObjectId(actorId),
        organizationId: pi.organizationId,
        diff: { piNumber: pi.piNumber, grandTotalFC },
        module: 'procurement',
      });
    }

    logger.info(`Proforma Invoice created: ${pi.piNumber} (Grand Total: ${grandTotalFC} ${pi.currency})`);
    return pi;
  }

  /**
   * 2. Creates an immutable LC Amendment, archiving previous values and updating the parent LC
   */
  public static async createLCAmendment(
    dto: CreateLCAmendmentDTO,
    actorId: string | Types.ObjectId,
    session?: ClientSession
  ): Promise<ILCAmendment> {
    const lc = await ImportLCModel.findById(dto.lcId).session(session || null);
    if (!lc) {
      throw new NotFoundError('ImportLC', dto.lcId.toString());
    }

    const currentAmendments = await LCAmendmentModel.countDocuments({ lcId: lc._id }).session(session || null);
    const nextAmendmentNumber = currentAmendments + 1;
    const amendmentCode = `${lc.lcNumber}-AMD-${nextAmendmentNumber.toString().padStart(2, '0')}`;

    const previousAmountFC = lc.lcValueFC;
    const revisedAmountFC = dto.revisedAmountFC !== undefined && dto.revisedAmountFC > 0 ? dto.revisedAmountFC : lc.lcValueFC;
    const previousExpiryDate = lc.lcExpiryDate;
    const revisedExpiryDate = dto.revisedExpiryDate ? new Date(dto.revisedExpiryDate) : lc.lcExpiryDate;
    const previousShipmentDate = lc.latestShipmentDate;
    const revisedShipmentDate = dto.revisedShipmentDate ? new Date(dto.revisedShipmentDate) : lc.latestShipmentDate;

    // AI Impact Summary
    const aiSummary = `LC Amendment ${amendmentCode} registered: Value updated from ${previousAmountFC} ${lc.foreignCurrency} to ${revisedAmountFC} ${lc.foreignCurrency}. Expiry extended to ${revisedExpiryDate ? revisedExpiryDate.toISOString().split('T')[0] : 'N/A'}. Bank charges: ৳${(dto.amendmentChargesBDT || 0).toLocaleString()}.`;

    const amendmentDocs = await LCAmendmentModel.create(
      [
        {
          lcId: lc._id,
          lcNumber: lc.lcNumber,
          amendmentNumber: nextAmendmentNumber,
          amendmentCode,
          organizationId: new Types.ObjectId(dto.organizationId),
          amendmentDate: dto.amendmentDate ? new Date(dto.amendmentDate) : new Date(),
          previousAmountFC,
          revisedAmountFC,
          previousExpiryDate,
          revisedExpiryDate,
          previousShipmentDate,
          revisedShipmentDate,
          changedClauses: dto.changedClauses.trim(),
          reason: dto.reason.trim(),
          amendmentChargesBDT: dto.amendmentChargesBDT || 0,
          bankConfirmationRef: dto.bankConfirmationRef,
          bankConfirmationDate: dto.bankConfirmationDate ? new Date(dto.bankConfirmationDate) : undefined,
          requestedBy: new Types.ObjectId(actorId),
          status: 'CONFIRMED_BY_BANK',
          aiImpactSummary: aiSummary,
        },
      ],
      { session }
    );

    const amendment = amendmentDocs[0];

    // Increment LC Version and apply revised figures
    lc.version = `V${nextAmendmentNumber + 1}`;
    lc.lcValueFC = revisedAmountFC;
    if (revisedExpiryDate) lc.lcExpiryDate = revisedExpiryDate;
    if (revisedShipmentDate) lc.latestShipmentDate = revisedShipmentDate;
    lc.status = 'AMENDED';
    lc.amendmentsCount = nextAmendmentNumber;
    await lc.save({ session });

    await AuditLogService.record({
      action: 'APPROVE',
      targetCollection: 'LCAmendment',
      targetId: amendment._id,
      actorId: new Types.ObjectId(actorId),
      organizationId: amendment.organizationId,
      diff: {
        amendmentCode,
        previousAmountFC,
        revisedAmountFC,
        revisedExpiryDate,
      },
      module: 'procurement',
    });

    logger.info(`LC Amendment confirmed: ${amendmentCode} for ${lc.lcNumber} (Version: ${lc.version})`);
    return amendment;
  }

  /**
   * 3. Records an Import Payment / LC Margin / Bank Charge with balanced Double-Entry Posting
   */
  public static async recordImportPayment(
    dto: RecordImportPaymentDTO,
    actorId: string | Types.ObjectId,
    session?: ClientSession
  ): Promise<IImportPayment> {
    const lc = await ImportLCModel.findById(dto.lcId).session(session || null);
    if (!lc) {
      throw new NotFoundError('ImportLC', dto.lcId.toString());
    }

    const year = new Date().getFullYear();
    const seq = await CounterService.getNextSequence(`IMP_PAY_${year}`, session);
    const paymentReference = `PAY-IMP-${year}-${seq.toString().padStart(4, '0')}`;

    const localAmountBDT = Number((dto.foreignAmount * dto.exchangeRate).toFixed(2));

    let journalEntryId: Types.ObjectId | undefined;

    // Post Double-Entry Journal Entry if Accounts module is available
    try {
      let debitAccount = 1160; // LC Margin Deposit default
      let creditAccount = 1020; // Cash and Bank

      if (dto.paymentType === 'CUSTOMS_DUTY_PAYMENT' || dto.paymentType === 'PORT_CHARGES_PAYMENT') {
        debitAccount = 1200; // Merchandise Inventory / In-Transit Assets
      } else if (dto.paymentType === 'SIGHT_PAYMENT' || dto.paymentType === 'USANCE_PAYMENT') {
        debitAccount = 2010; // Accounts Payable - Foreign Suppliers
      } else if (dto.paymentType === 'BANK_CHARGES' || dto.paymentType === 'LC_OPENING_COMMISSION') {
        debitAccount = 6140; // Bank Charges & Commissions Expense
      }

      const voucherResult = await AccountingService.createJournalVoucher(
        {
          voucherType: 'PAYMENT',
          sourceDocumentRef: paymentReference,
          idempotencyKey: `IMP_PAY_${paymentReference}`,
          lines: [
            {
              accountCode: debitAccount,
              description: `Import Payment (${dto.paymentType}) for LC ${lc.lcNumber}`,
              debit: localAmountBDT,
              credit: 0,
            },
            {
              accountCode: creditAccount,
              description: `Disbursement from ${dto.bankName} for LC ${lc.lcNumber}`,
              debit: 0,
              credit: localAmountBDT,
            },
          ],
        },
        actorId,
        session
      );
      if (voucherResult && voucherResult.journalEntry) {
        journalEntryId = voucherResult.journalEntry._id;
      }
    } catch (err: any) {
      logger.warn(`Accounting journal posting bypassed or deferred for import payment: ${err.message}`);
    }

    const paymentDocs = await ImportPaymentModel.create(
      [
        {
          paymentReference,
          organizationId: new Types.ObjectId(dto.organizationId),
          lcId: lc._id,
          lcNumber: lc.lcNumber,
          supplierId: dto.supplierId ? new Types.ObjectId(dto.supplierId) : lc.supplierId,
          bankName: dto.bankName.trim(),
          paymentType: dto.paymentType,
          currency: dto.currency || lc.foreignCurrency,
          foreignAmount: dto.foreignAmount,
          exchangeRate: dto.exchangeRate,
          localAmountBDT,
          paymentDate: dto.paymentDate ? new Date(dto.paymentDate) : new Date(),
          maturityDate: dto.maturityDate ? new Date(dto.maturityDate) : undefined,
          paymentMethod: dto.paymentMethod || 'BANK_TRANSFER',
          bankAccountId: dto.bankAccountId ? new Types.ObjectId(dto.bankAccountId) : undefined,
          transactionReference: dto.transactionReference.trim(),
          journalEntryId,
          approvalStatus: 'PAID',
          paidBy: new Types.ObjectId(actorId),
          notes: dto.notes,
          aiPaymentSummary: `Disbursed ৳${localAmountBDT.toLocaleString()} (${dto.foreignAmount} ${dto.currency || lc.foreignCurrency} @ ${dto.exchangeRate}) via ${dto.bankName}.`,
        },
      ],
      { session }
    );

    const payment = paymentDocs[0];

    // If paymentType is LC_MARGIN, update the lcMarginAmountBDT in ImportLC
    if (dto.paymentType === 'LC_MARGIN') {
      lc.lcMarginAmountBDT = (lc.lcMarginAmountBDT || 0) + localAmountBDT;
      await lc.save({ session });
    }

    await AuditLogService.record({
      action: 'CREATE',
      targetCollection: 'ImportPayment',
      targetId: payment._id,
      actorId: new Types.ObjectId(actorId),
      organizationId: payment.organizationId,
      diff: { paymentReference, paymentType: dto.paymentType, localAmountBDT },
      module: 'procurement',
    });

    logger.info(`Import Payment recorded: ${paymentReference} - ৳${localAmountBDT} for ${lc.lcNumber}`);
    return payment;
  }
}
