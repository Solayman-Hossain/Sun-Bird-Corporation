import mongoose, { Types } from 'mongoose';
import { OrderModel, IOrder } from '../models/Order';
import { ProductBatchModel } from '../models/ProductBatch';
import { JournalEntryModel } from '../models/JournalEntry';
import { DeliveryChallanModel } from '../models/DeliveryChallan';
import { SslcommerzGateway, SslcommerzValidationResponse } from '../integrations/sslcommerzGateway';
import { CounterService } from './CounterService';
import { ValidationError, NotFoundError } from '../errors/AppError';
import logger from '../config/logger';

export interface SslcommerzIpnDTO {
  tran_id: string; // Order number (e.g. ORD-2026-00481)
  val_id: string;
  amount: string | number;
  card_type?: string;
  store_amount?: string | number;
  bank_tran_id?: string;
  status: string; // 'VALID' | 'VALIDATED' | 'FAILED' | 'CANCELLED'
  tran_date?: string;
  currency?: string;
  verify_sign?: string;
}

export class PaymentWebhookService {
  /**
   * Processes incoming SSLCOMMERZ Instant Payment Notification (IPN) webhook.
   * Atomically confirms payment, converts reserved stock, posts double-entry receipt JV,
   * and prepares shipment dispatch.
   */
  public static async processSslcommerzIpn(
    payload: SslcommerzIpnDTO
  ): Promise<{
    success: boolean;
    message: string;
    orderNo: string;
    journalVoucher?: string;
    challanNo?: string;
  }> {
    const { tran_id, val_id, amount, status, verify_sign } = payload;

    if (!tran_id || !tran_id.trim()) {
      throw new ValidationError('tran_id (order number) is required in IPN payload');
    }
    if (!val_id || !val_id.trim()) {
      throw new ValidationError('val_id is required in IPN payload');
    }

    // 1. Verify Status and Signature
    const normalizedStatus = (status || '').toUpperCase();
    if (normalizedStatus !== 'VALID' && normalizedStatus !== 'VALIDATED') {
      logger.warn(`[SSLCOMMERZ IPN] Non-valid status '${status}' received for transaction ${tran_id}`);
      throw new ValidationError(`Payment transaction status '${status}' is not valid for order confirmation`);
    }

    if (verify_sign) {
      const isValidSig = SslcommerzGateway.verifySignature(payload, verify_sign);
      if (!isValidSig) {
        logger.warn(`[SSLCOMMERZ IPN] Signature verification failed for transaction ${tran_id}`);
        throw new ValidationError('Invalid SSLCOMMERZ verify_sign signature');
      }
    }

    // 2. Validate transaction against SSLCOMMERZ server API
    const validationResult = await SslcommerzGateway.validateTransaction(val_id);
    if (validationResult.status !== 'VALID' && validationResult.status !== 'VALIDATED') {
      logger.warn(`[SSLCOMMERZ IPN] Server API verification returned ${validationResult.status} for val_id ${val_id}`);
      throw new ValidationError(`SSLCOMMERZ API rejected transaction validation for val_id ${val_id}`);
    }

    // 3. Atomically update Order and accounting ledger
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const order = await OrderModel.findOne({ orderNo: tran_id.trim() }).session(session);
      if (!order) {
        throw new NotFoundError(`Order with number '${tran_id}' not found`);
      }

      // Idempotency check: If already paid, acknowledge without double posting
      if (order.paymentStatus === 'PAID') {
        logger.info(`[SSLCOMMERZ IPN] Order ${order.orderNo} was already marked PAID. Returning idempotent success.`);
        await session.commitTransaction();
        session.endSession();
        return {
          success: true,
          message: 'Order was already confirmed as paid',
          orderNo: order.orderNo,
        };
      }

      const paidAmount = parseFloat(String(amount || order.grandTotal));

      // 4. Update Order payment & confirmation status
      order.paymentStatus = 'PAID';
      order.orderStatus = 'CONFIRMED';
      order.paymentMethod = 'ONLINE_SSLCOMMERZ';
      (order as any).paidAmount = paidAmount;
      (order as any).paymentGatewayRef = val_id;
      (order as any).paymentDetails = {
        valId: val_id,
        bankTranId: payload.bank_tran_id || validationResult.bank_tran_id,
        cardType: payload.card_type || validationResult.card_type,
        tranDate: payload.tran_date || new Date(),
      };
      await order.save({ session });

      // 5. Commit reserved stock in product_batches
      for (const item of order.items) {
        if (item.batchNumber) {
          const batch = await ProductBatchModel.findOne({
            productId: item.productId,
            batchNumber: item.batchNumber,
          }).session(session);

          if (batch) {
            batch.reservedQty = Math.max(0, (batch.reservedQty || 0) - item.qty);
            await batch.save({ session });
            logger.debug(`[SSLCOMMERZ IPN] Released ${item.qty} reserved units for batch ${batch.batchNumber}`);
          }
        }
      }

      // 6. Generate Automated Sales Receipt Journal Entry (Dr 1030 Bank/MFS, Cr 1100 AR/Sales)
      const voucherNo = await CounterService.getNextSequence('JV');
      const lines = [
        {
          accountCode: 1030,
          accountName: 'Bank & MFS Clearing Account',
          debit: paidAmount,
          credit: 0,
          description: `SSLCOMMERZ payment received for Order ${order.orderNo} [Val: ${val_id}]`,
        },
        {
          accountCode: 1100,
          accountName: 'Accounts Receivable (Trade Debtors)',
          debit: 0,
          credit: paidAmount,
          description: `Settlement of receivables for Order ${order.orderNo}`,
        },
      ];

      const journalVoucher = new JournalEntryModel({
        voucherNo,
        voucherType: 'RECEIPT',
        transactionDate: new Date(),
        sourceDocumentRef: order.orderNo,
        lines,
        totalDebit: paidAmount,
        totalCredit: paidAmount,
        status: 'POSTED',
        createdBy: order.customerId || new Types.ObjectId(),
        requiredQuorumTier: 1,
        approvals: [],
        isFullyApproved: true,
      });
      await journalVoucher.save({ session });

      // 7. Auto-generate Delivery Challan if not already present
      let challanNo: string | undefined;
      const existingChallan = await DeliveryChallanModel.findOne({ orderId: order._id }).session(session);
      if (!existingChallan) {
        challanNo = await CounterService.getNextSequence('CH');
        const challan = new DeliveryChallanModel({
          challanNo,
          orderId: order._id,
          customerId: order.customerId,
          companyBin: '000000000-0201',
          dispatchTime: new Date(),
          transporterType: 'THIRD_PARTY',
          cartonCount: 1,
          status: 'APPROVED',
          preparedBy: order.customerId,
          items: order.items.map((i) => ({
            productId: i.productId,
            sku: i.sku,
            productName: i.sku,
            hsCode: '9018.90.00',
            batchNumber: i.batchNumber || 'DEFAULT-BATCH',
            dispatchedQty: i.qty,
            uom: i.uom || 'PCS',
            dispatchedSerials: [],
            vatRate: 0,
            sdRate: 0,
          })),
        });
        await challan.save({ session });
        logger.info(`[SSLCOMMERZ IPN] Delivery Challan ${challanNo} auto-generated for Order ${order.orderNo}`);
      } else {
        challanNo = existingChallan.challanNo;
      }

      await session.commitTransaction();
      session.endSession();

      logger.info(`[SSLCOMMERZ IPN] Order ${order.orderNo} payment reconciled successfully via JV ${voucherNo}`);

      return {
        success: true,
        message: 'IPN processed and order payment confirmed',
        orderNo: order.orderNo,
        journalVoucher: voucherNo,
        challanNo,
      };
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }
}

export default PaymentWebhookService;
