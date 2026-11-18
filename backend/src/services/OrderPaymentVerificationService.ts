import { Types } from 'mongoose';
import { OrderModel, IOrder } from '../models/Order';
import { AuditLogService } from './AuditLogService';
import { ValidationError, NotFoundError } from '../errors/AppError';
import logger from '../config/logger';

export interface RecordPaymentDTO {
  paymentMethod: string;
  amount: number;
  transactionRef?: string;
  paymentDate?: string | Date;
  notes?: string;
  evidenceUrl?: string;
}

export interface RecordCodDTO {
  collectionAmount: number;
  collectionDate?: string | Date;
  depositDate?: string | Date;
  depositAccount?: number;
  notes?: string;
}

export class OrderPaymentVerificationService {
  /**
   * 1. Record Customer Payment against an Order (e.g. Bank Transfer, Mobile Banking, bKash)
   */
  public static async recordOrderPayment(
    orderId: string,
    dto: RecordPaymentDTO,
    userId?: Types.ObjectId,
    orgId?: string
  ): Promise<IOrder> {
    const order = await OrderModel.findById(orderId);
    if (!order) throw new NotFoundError('Order', orderId);

    if (dto.amount <= 0) {
      throw new ValidationError('Payment amount must be greater than zero');
    }

    const year = new Date().getFullYear();
    const paymentNumber = `PAY-${year}-${Math.floor(100000 + Math.random() * 900000)}`;

    if (!order.paymentRecords) order.paymentRecords = [];

    order.paymentRecords.push({
      paymentNumber,
      paymentMethod: dto.paymentMethod,
      amount: dto.amount,
      transactionRef: dto.transactionRef,
      paymentDate: dto.paymentDate ? new Date(dto.paymentDate) : new Date(),
      status: 'PENDING',
      notes: dto.notes,
      evidenceUrl: dto.evidenceUrl,
    });

    if (order.orderStatus === 'SUBMITTED' || order.orderStatus === 'DRAFT') {
      order.orderStatus = 'PENDING_VERIFICATION';
    }

    if (!order.timeline) order.timeline = [];
    order.timeline.push({
      status: order.orderStatus,
      event: 'Payment Submitted',
      timestamp: new Date(),
      userId,
      description: `Payment of ৳${dto.amount.toLocaleString()} submitted via ${dto.paymentMethod} (Ref: ${dto.transactionRef || paymentNumber}) pending verification.`,
    });

    await order.save();

    AuditLogService.record({
      actorId: userId ? new Types.ObjectId(userId) : new Types.ObjectId(),
      action: 'PAYMENT_RECORDED',
      targetCollection: 'orders',
      targetId: order._id,
      module: 'ORDER_PROCESSING',
      diff: { paymentNumber, amount: dto.amount, method: dto.paymentMethod },
    }).catch(() => {});

    logger.info(`[PaymentVerification] Recorded payment ${paymentNumber} (৳${dto.amount}) for order ${order.orderNo}`);
    return order;
  }

  /**
   * 2. Verify Payment by Authorized Accountant/Admin
   */
  public static async verifyOrderPayment(
    orderId: string,
    paymentNumber: string,
    verifiedBy: Types.ObjectId,
    orgId?: string
  ): Promise<IOrder> {
    const order = await OrderModel.findById(orderId);
    if (!order) throw new NotFoundError('Order', orderId);

    if (!order.paymentRecords || order.paymentRecords.length === 0) {
      throw new NotFoundError('PaymentRecord', paymentNumber);
    }

    const payment = order.paymentRecords.find((p) => p.paymentNumber === paymentNumber);
    if (!payment) {
      throw new NotFoundError('PaymentRecord', paymentNumber);
    }

    if (payment.status === 'VERIFIED') {
      return order; // Already verified
    }

    payment.status = 'VERIFIED';
    payment.verifiedBy = verifiedBy;
    payment.verifiedAt = new Date();

    // Recalculate total verified paid amount
    const totalVerified = order.paymentRecords
      .filter((p) => p.status === 'VERIFIED')
      .reduce((sum, p) => sum + p.amount, 0);

    order.paidAmount = totalVerified;
    order.dueAmount = Math.max(0, order.grandTotal - totalVerified);

    if (order.dueAmount === 0) {
      order.paymentStatus = 'PAID';
    } else if (order.paidAmount > 0) {
      order.paymentStatus = 'PARTIAL';
    }

    // Auto confirm if was pending verification
    if (order.orderStatus === 'PENDING_VERIFICATION') {
      order.orderStatus = 'CONFIRMED';
    }

    if (!order.timeline) order.timeline = [];
    order.timeline.push({
      status: order.orderStatus,
      event: 'Payment Verified',
      timestamp: new Date(),
      userId: verifiedBy,
      description: `Payment ${paymentNumber} (৳${payment.amount.toLocaleString()}) verified. Total Paid: ৳${order.paidAmount.toLocaleString()}, Due: ৳${order.dueAmount.toLocaleString()}`,
    });

    await order.save();

    AuditLogService.record({
      actorId: verifiedBy || new Types.ObjectId(),
      action: 'PAYMENT_VERIFIED',
      targetCollection: 'orders',
      targetId: order._id,
      module: 'ORDER_PROCESSING',
      diff: { paymentNumber, totalPaid: order.paidAmount, dueAmount: order.dueAmount },
    }).catch(() => {});

    logger.info(`[PaymentVerification] Verified payment ${paymentNumber} for order ${order.orderNo}`);
    return order;
  }

  /**
   * 3. Reject Payment
   */
  public static async rejectOrderPayment(
    orderId: string,
    paymentNumber: string,
    reason: string,
    rejectedBy: Types.ObjectId,
    orgId?: string
  ): Promise<IOrder> {
    const order = await OrderModel.findById(orderId);
    if (!order) throw new NotFoundError('Order', orderId);

    const payment = order.paymentRecords?.find((p) => p.paymentNumber === paymentNumber);
    if (!payment) throw new NotFoundError('PaymentRecord', paymentNumber);

    payment.status = 'REJECTED';
    payment.rejectionReason = reason;
    payment.verifiedBy = rejectedBy;
    payment.verifiedAt = new Date();

    if (!order.timeline) order.timeline = [];
    order.timeline.push({
      status: order.orderStatus,
      event: 'Payment Rejected',
      timestamp: new Date(),
      userId: rejectedBy,
      description: `Payment ${paymentNumber} rejected. Reason: ${reason}`,
    });

    await order.save();

    AuditLogService.record({
      actorId: rejectedBy || new Types.ObjectId(),
      action: 'PAYMENT_REJECTED',
      targetCollection: 'orders',
      targetId: order._id,
      module: 'ORDER_PROCESSING',
      diff: { paymentNumber, reason },
    }).catch(() => {});

    return order;
  }

  /**
   * 4. Record COD Cash Collection & Reconciliation
   */
  public static async recordCodCollection(
    orderId: string,
    dto: RecordCodDTO,
    userId: Types.ObjectId,
    orgId?: string
  ): Promise<IOrder> {
    const order = await OrderModel.findById(orderId);
    if (!order) throw new NotFoundError('Order', orderId);

    order.codStatus = dto.depositDate ? 'DEPOSITED' : 'COLLECTED';
    order.codCollectionAmount = dto.collectionAmount;
    order.codCollectionDate = dto.collectionDate ? new Date(dto.collectionDate) : new Date();
    order.codDepositDate = dto.depositDate ? new Date(dto.depositDate) : undefined;
    order.codDepositAccount = dto.depositAccount;
    order.codCollectionNotes = dto.notes;

    // Update paid amount
    order.paidAmount = (order.paidAmount || 0) + dto.collectionAmount;
    order.dueAmount = Math.max(0, order.grandTotal - order.paidAmount);

    if (order.dueAmount === 0) {
      order.paymentStatus = 'PAID';
    } else {
      order.paymentStatus = 'PARTIAL';
    }

    if (!order.timeline) order.timeline = [];
    order.timeline.push({
      status: order.orderStatus,
      event: 'COD Collected',
      timestamp: new Date(),
      userId,
      description: `COD cash collected: ৳${dto.collectionAmount.toLocaleString()}. Notes: ${dto.notes || 'None'}`,
    });

    await order.save();

    AuditLogService.record({
      actorId: userId ? new Types.ObjectId(userId) : new Types.ObjectId(),
      action: 'COD_COLLECTED',
      targetCollection: 'orders',
      targetId: order._id,
      module: 'ORDER_PROCESSING',
      diff: { collectionAmount: dto.collectionAmount, status: order.paymentStatus },
    }).catch(() => {});

    logger.info(`[PaymentVerification] COD collected ৳${dto.collectionAmount} for order ${order.orderNo}`);
    return order;
  }
}
export default OrderPaymentVerificationService;
