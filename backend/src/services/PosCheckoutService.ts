import { ClientSession, Types } from 'mongoose';
import { runInTransaction } from '../config/database';
import { UserModel } from '../models/User';
import { WarehouseModel } from '../models/Warehouse';
import { ProductModel } from '../models/Product';
import { ProductBatchModel, IProductBatch } from '../models/ProductBatch';
import { StockLedgerModel } from '../models/StockLedger';
import { OrderModel, IOrderItem } from '../models/Order';
import { DeliveryChallanModel, IChallanItem } from '../models/DeliveryChallan';
import { SalesInvoiceModel } from '../models/SalesInvoice';
import { JournalEntryModel, IJournalLine } from '../models/JournalEntry';
import { CustomerModel } from '../models/Customer';
import { CounterService } from './CounterService';
import {
  ForbiddenError,
  InsufficientStockError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from '../errors/AppError';
import { normalizeMobileNumber } from '../integrations/smsGateway';
import logger from '../config/logger';

export type PosPaymentMethod =
  | 'CASH'
  | 'MFS_BKASH'
  | 'MFS_NAGAD'
  | 'CARD'
  | 'MIXED_SPLIT';

export interface PosItemDTO {
  productId?: string | Types.ObjectId;
  sku: string;
  batchId?: string | Types.ObjectId;
  quantity?: number;
  qty?: number;
  unitPrice: number;
  vatRate?: number;
  sdRate?: number;
  lineTotal?: number;
  uom?: string;
  productName?: string;
}

export interface PosCheckoutDTO {
  showroomWarehouseId: string | Types.ObjectId;
  customerMobile?: string;
  customerName?: string;
  customerId?: string | Types.ObjectId;
  paymentMethod: PosPaymentMethod;
  items: PosItemDTO[];
  paidAmount: number;
  discountAmount?: number;
  notes?: string;
}

export interface PosThermalInvoice {
  company: {
    name: string;
    bin: string;
    showroomAddress: string;
    phone: string;
  };
  invoiceNo: string;
  mushakInvoiceNo: string;
  challanNo: string;
  orderNo: string;
  dateTime: string;
  cashier: {
    id: string;
    name: string;
  };
  customer: {
    name: string;
    mobile: string;
  };
  items: {
    sku: string;
    productName: string;
    batchNumber: string;
    qty: number;
    unitPrice: number;
    lineTotal: number;
    vatRate: number;
    vatAmount: number;
  }[];
  subtotal: number;
  vatTotal: number;
  discountAmount: number;
  grandTotal: number;
  paidAmount: number;
  changeAmount: number;
  paymentMethod: string;
  qrData: string;
}

export interface PosCheckoutResult {
  orderId: string;
  orderNo: string;
  challanId: string;
  challanNo: string;
  invoiceId: string;
  invoiceNo: string;
  mushakInvoiceNo: string;
  journalVoucherNo: string;
  subtotal: number;
  vatTotal: number;
  discountAmount: number;
  grandTotal: number;
  paidAmount: number;
  changeAmount: number;
  paymentMethod: PosPaymentMethod;
  thermalInvoice: PosThermalInvoice;
}

/**
 * Showroom POS Terminal Direct Checkout Service
 * Executes high-velocity showroom point-of-sale transactions with single-step atomic billing:
 * - Cashier warehouse assignment validation
 * - Direct batch stock deduction & stock ledger journaling (movementType: 'POS_BATCH')
 * - Delivery Challan (Mushak-6.3) & Sales Invoice creation
 * - Balanced double-entry accounting journal in journal_entries
 * - Change amount & printable POS thermal invoice payload generation
 */
export class PosCheckoutService {
  /**
   * Executes atomic POS showroom checkout inside a Mongoose transaction.
   *
   * @param posData Showroom, line items, customer, and payment information
   * @param cashierId User ID of cashier operating POS terminal
   * @param externalSession Optional session if called inside an existing transaction
   * @returns PosCheckoutResult with invoice IDs, change, and printable thermal receipt
   */
  public static async processPosCheckout(
    posData: PosCheckoutDTO,
    cashierId?: string | Types.ObjectId,
    externalSession?: ClientSession
  ): Promise<PosCheckoutResult> {
    const effectiveCashierId = cashierId || (posData as any).cashierId;
    if (externalSession) {
      return await PosCheckoutService.executeCheckout(posData, effectiveCashierId, externalSession);
    }

    return await runInTransaction(async (session: ClientSession) => {
      return await PosCheckoutService.executeCheckout(posData, effectiveCashierId, session);
    });
  }

  private static async executeCheckout(
    posData: PosCheckoutDTO,
    cashierId: string | Types.ObjectId,
    session: ClientSession
  ): Promise<PosCheckoutResult> {
    // 1. Basic validation
    if (!posData.items || posData.items.length === 0) {
      throw new ValidationError([
        { field: 'items', issue: 'POS checkout requires at least one line item' },
      ]);
    }

    if (!posData.showroomWarehouseId) {
      throw new ValidationError([
        { field: 'showroomWarehouseId', issue: 'Showroom warehouse ID is required' },
      ]);
    }

    const effectiveCashierId = cashierId || (posData as any).cashierId;
    if (!effectiveCashierId) {
      throw new ValidationError([
        { field: 'cashierId', issue: 'Cashier user ID is required for checkout' },
      ]);
    }

    const warehouseId = new Types.ObjectId(posData.showroomWarehouseId);
    const cId = new Types.ObjectId(effectiveCashierId);

    // 2. Validate Cashier & Showroom Warehouse Assignment
    const cashier = await UserModel.findById(cId).session(session);
    if (!cashier) {
      throw new NotFoundError('User', effectiveCashierId.toString());
    }

    if (!cashier.isActive) {
      throw new UnauthorizedError('Cashier user account is inactive or disabled');
    }

    if (!cashier.warehouseId || cashier.warehouseId.toString() !== warehouseId.toString()) {
      logger.warn(
        `[POS] Cashier ${cashier.fullName} (${cId}) not authorized for showroom warehouse ${warehouseId}. Assigned: ${cashier.warehouseId}`
      );
      throw new ForbiddenError(
        `Cashier is not assigned to the specified showroom warehouse (${posData.showroomWarehouseId})`
      );
    }

    const warehouse = await WarehouseModel.findById(warehouseId).session(session);
    if (!warehouse) {
      throw new NotFoundError('Warehouse', posData.showroomWarehouseId.toString());
    }

    // 3. Resolve Customer (Default to Walk-in Retail Customer if not provided)
    let customerDoc: any = null;
    if (posData.customerId) {
      customerDoc = await CustomerModel.findById(posData.customerId).session(session);
    }

    if (!customerDoc) {
      const mobileRaw = posData.customerMobile || '+8801700000000';
      const normMobile = normalizeMobileNumber(mobileRaw);
      const custName = posData.customerName?.trim() || 'Walk-in Retail Customer';

      customerDoc = await CustomerModel.findOne({
        mobile: { $in: [normMobile.local, normMobile.international, `+${normMobile.international}`] },
      }).session(session);

      if (!customerDoc) {
        const createdCusts = await CustomerModel.create(
          [
            {
              fullName: custName,
              mobile: normMobile.local,
              customerType: 'RETAIL',
              isGuest: true,
              registeredVia: 'WALK_IN',
            },
          ],
          { session }
        );
        customerDoc = createdCusts[0];
      }
    }

    // 4. Generate Sequential Identifiers via CounterService
    const orderNo = await CounterService.getNextSequence('ORD', session);
    const challanNo = await CounterService.getNextSequence('CH', session);
    const invoiceNo = await CounterService.getNextSequence('INV', session);
    const voucherNo = await CounterService.getNextSequence('JV', session);

    // 5. Deduct Stock directly from ProductBatch.currentQty and log StockLedger movements
    let subtotal = 0;
    let vatTotal = 0;
    let totalCogs = 0;

    const orderItems: IOrderItem[] = [];
    const challanItems: IChallanItem[] = [];
    const thermalItems: PosThermalInvoice['items'] = [];

    for (const item of posData.items) {
      const sku = item.sku.trim().toUpperCase();
      const rawQty = (item as any).qty ?? item.quantity ?? 1;
      const qty = Math.max(1, Math.floor(rawQty));

      // Locate specific batch or FEFO batch on-hand in this showroom warehouse
      let batchQuery: any = {
        sku,
        warehouseId,
        locationStatus: 'ON_HAND',
      };

      if (item.batchId) {
        batchQuery._id = new Types.ObjectId(item.batchId);
      }

      const batches = await ProductBatchModel.find(batchQuery)
        .sort({ expiryDate: 1, createdAt: 1 })
        .session(session);

      const availableInWarehouse = batches.reduce(
        (sum, b) => sum + Math.max(0, b.currentQty),
        0
      );

      if (availableInWarehouse < qty) {
        logger.warn(
          `[POS] Shortage for SKU ${sku} in showroom ${warehouse.name}. Needed: ${qty}, Available: ${availableInWarehouse}`
        );
        throw new InsufficientStockError(sku, qty, availableInWarehouse);
      }

      // Deduct stock directly across batch(es)
      let remainingToDeduct = qty;
      for (const batch of batches) {
        if (remainingToDeduct <= 0) break;
        if (batch.currentQty <= 0) continue;

        const deductQty = Math.min(batch.currentQty, remainingToDeduct);

        await ProductBatchModel.updateOne(
          { _id: batch._id },
          { $inc: { currentQty: -deductQty } },
          { session }
        );

        // Log movement directly in stock_ledger
        await StockLedgerModel.create(
          [
            {
              sku,
              batchId: batch._id,
              warehouseId,
              movementType: 'POS_BATCH',
              qtyChange: -deductQty,
              unitCost: batch.unitCost || 0,
              referenceNo: invoiceNo,
              referenceType: 'POS_BATCH',
              createdBy: cId,
            },
          ],
          { session }
        );

        const batchCogs = Math.round((batch.unitCost || 0) * deductQty * 100) / 100;
        totalCogs += batchCogs;

        remainingToDeduct -= deductQty;
      }

      // Fetch Product master record for descriptions and HS Code
      let productDoc: any = null;
      if (item.productId) {
        productDoc = await ProductModel.findById(item.productId).session(session);
      } else {
        productDoc = await ProductModel.findOne({ sku }).session(session);
      }

      const productName =
        item.productName || productDoc?.nameEn || `Product ${sku}`;
      const hsCode = productDoc?.hsCode || '9018.90.00';
      const uom = item.uom || productDoc?.baseUom || 'UNIT';

      const lineTotal = Math.round(item.unitPrice * qty * 100) / 100;
      const vatRate = item.vatRate !== undefined ? item.vatRate : 15.0;
      const vatAmount = Math.round(lineTotal * (vatRate / 100) * 100) / 100;

      subtotal += lineTotal;
      vatTotal += vatAmount;

      const pId = productDoc?._id || new Types.ObjectId();
      const primaryBatchNumber = batches[0]?.batchNumber || 'BATCH-POS';

      orderItems.push({
        productId: pId,
        sku,
        batchNumber: primaryBatchNumber,
        qty,
        uom,
        unitPrice: item.unitPrice,
        lineTotal,
        vatAmount,
      });

      challanItems.push({
        productId: pId,
        sku,
        productName,
        hsCode,
        batchNumber: primaryBatchNumber,
        dispatchedQty: qty,
        uom,
        dispatchedSerials: [],
        vatRate,
        sdRate: 0.0,
      });

      thermalItems.push({
        sku,
        productName,
        batchNumber: primaryBatchNumber,
        qty,
        unitPrice: item.unitPrice,
        lineTotal,
        vatRate,
        vatAmount,
      });
    }

    subtotal = Math.round(subtotal * 100) / 100;
    vatTotal = Math.round(vatTotal * 100) / 100;
    totalCogs = Math.round(totalCogs * 100) / 100;

    const discountAmount = Math.max(0, posData.discountAmount ?? 0);
    const grandTotal = Math.round((subtotal + vatTotal - discountAmount) * 100) / 100;

    if (posData.paidAmount < grandTotal) {
      throw new ValidationError([
        {
          field: 'paidAmount',
          issue: `Paid amount (${posData.paidAmount.toFixed(2)} BDT) is less than grand total (${grandTotal.toFixed(2)} BDT)`,
        },
      ]);
    }

    const changeAmount = Math.round((posData.paidAmount - grandTotal) * 100) / 100;

    // 6. Generate Order Document
    const createdOrders = await OrderModel.create(
      [
        {
          orderNo,
          customerId: customerDoc._id,
          orderChannel: 'POS_SHOWROOM',
          items: orderItems,
          subtotal,
          vatTotal,
          grandTotal,
          paymentMethod: posData.paymentMethod === 'CASH' ? 'COD' : 'ONLINE',
          paymentStatus: 'PAID',
          orderStatus: 'DELIVERED',
          shippingAddress: `${warehouse.name} Showroom Counter Pickup`,
        },
      ],
      { session }
    );
    const order = createdOrders[0];

    // 7. Generate Delivery Challan (NBR Mushak-6.3)
    const createdChallans = await DeliveryChallanModel.create(
      [
        {
          challanNo,
          orderId: order._id,
          customerId: customerDoc._id,
          companyBin: '0012345670101', // Sun Bird Corporation statutory 13-digit BIN
          buyerBin: customerDoc.buyerBin,
          vehicleNumber: 'SHOWROOM-OVER-COUNTER',
          dispatchTime: new Date(),
          transporterType: 'OWN_FLEET',
          cartonCount: 1,
          items: challanItems,
          status: 'DELIVERED',
          preparedBy: cId,
          approvedBy: cId,
        },
      ],
      { session }
    );
    const challan = createdChallans[0];

    // 8. Generate Sales Tax Invoice
    const mushakInvoiceNo = `MUS-6.3-${invoiceNo}`;
    const createdInvoices = await SalesInvoiceModel.create(
      [
        {
          invoiceNo,
          challanId: challan._id,
          orderId: order._id,
          customerId: customerDoc._id,
          branchId: warehouseId,
          invoiceDate: new Date(),
          dueDate: new Date(),
          mushakInvoiceNo,
          subtotal,
          discountAmount,
          vatRate: 15.0,
          vatTotal,
          grandTotal,
          paidAmount: grandTotal,
          dueAmount: 0.0,
          paymentStatus: 'PAID',
          status: 'PAID',
          preparedBy: cId,
        },
      ],
      { session }
    );
    const invoice = createdInvoices[0];

    // 9. Create Balanced Double-Entry Accounting Journal Entry in journal_entries
    // Determine payment receipt account (1010 Cash on Hand vs 1030 MFS Clearing)
    const isMfs =
      posData.paymentMethod === 'MFS_BKASH' ||
      posData.paymentMethod === 'MFS_NAGAD';

    const cashAccountCode = isMfs ? 1030 : 1010;
    const cashAccountName = isMfs
      ? `1030 MFS Clearing (${posData.paymentMethod})`
      : '1010 Cash on Hand (Till)';

    const netRevenue = Math.round((subtotal - discountAmount) * 100) / 100;

    const journalLines: IJournalLine[] = [
      // 1. Debit Cash/MFS on Hand: grandTotal
      {
        accountCode: cashAccountCode,
        accountName: cashAccountName,
        debit: grandTotal,
        credit: 0.0,
        description: `POS Receipt #${invoiceNo} (${posData.paymentMethod})`,
      },
      // 2. Credit Sales Revenue: netRevenue
      {
        accountCode: 4010,
        accountName: '4010 Sales Revenue',
        debit: 0.0,
        credit: netRevenue,
        description: `POS Showroom Sales Revenue #${invoiceNo}`,
      },
      // 3. Credit VAT Payable (15% Mushak-6.3): vatTotal
      {
        accountCode: 2050,
        accountName: '2050 VAT Payable (Mushak-6.3)',
        debit: 0.0,
        credit: vatTotal,
        description: `15% VAT on POS Sales #${invoiceNo}`,
      },
      // 4. Debit COGS: totalCogs
      {
        accountCode: 5010,
        accountName: '5010 Cost of Goods Sold (COGS)',
        debit: totalCogs,
        credit: 0.0,
        description: `COGS recognition for POS Sales #${invoiceNo}`,
      },
      // 5. Credit Inventory Merchandise: totalCogs
      {
        accountCode: 1200,
        accountName: '1200 Inventory Merchandise',
        debit: 0.0,
        credit: totalCogs,
        description: `Inventory reduction at WAC cost for POS Sales #${invoiceNo}`,
      },
    ];

    const totalDebit = Number((grandTotal + totalCogs).toFixed(2));
    const totalCredit = Number((netRevenue + vatTotal + totalCogs).toFixed(2));

    const createdJvs = await JournalEntryModel.create(
      [
        {
          voucherNo,
          voucherType: 'SALES',
          transactionDate: new Date(),
          sourceDocumentRef: invoiceNo,
          lines: journalLines,
          totalDebit,
          totalCredit,
          status: 'POSTED',
          createdBy: cId,
          requiredQuorumTier: 1,
          isFullyApproved: true,
        },
      ],
      { session }
    );
    const journalEntry = createdJvs[0];

    logger.info(
      `[POS] Showroom checkout completed: Order ${orderNo}, Invoice ${invoiceNo}, Challan ${challanNo}, JV ${voucherNo}. Grand Total: ${grandTotal} BDT`
    );

    // 10. Printable POS Thermal Invoice Payload
    const nowIso = new Date().toISOString();
    const qrData = `INV:${invoiceNo}|BIN:0012345670101|AMT:${grandTotal}|VAT:${vatTotal}|DATE:${nowIso.split('T')[0]}`;

    const thermalInvoice: PosThermalInvoice = {
      company: {
        name: 'Sun Bird Corporation',
        bin: '0012345670101',
        showroomAddress: `${warehouse.name}, ${warehouse.address}, ${warehouse.district}`,
        phone: warehouse.mobile || '+8801700000000',
      },
      invoiceNo,
      mushakInvoiceNo,
      challanNo,
      orderNo,
      dateTime: nowIso,
      cashier: {
        id: cashier._id.toString(),
        name: cashier.fullName,
      },
      customer: {
        name: customerDoc.fullName,
        mobile: customerDoc.mobile,
      },
      items: thermalItems,
      subtotal,
      vatTotal,
      discountAmount,
      grandTotal,
      paidAmount: posData.paidAmount,
      changeAmount,
      paymentMethod: posData.paymentMethod,
      qrData,
    };

    return {
      orderId: order._id.toString(),
      orderNo,
      challanId: challan._id.toString(),
      challanNo,
      invoiceId: invoice._id.toString(),
      invoiceNo,
      mushakInvoiceNo,
      journalVoucherNo: journalEntry.voucherNo,
      subtotal,
      vatTotal,
      discountAmount,
      grandTotal,
      paidAmount: posData.paidAmount,
      changeAmount,
      paymentMethod: posData.paymentMethod,
      thermalInvoice,
    };
  }
}

export default PosCheckoutService;
