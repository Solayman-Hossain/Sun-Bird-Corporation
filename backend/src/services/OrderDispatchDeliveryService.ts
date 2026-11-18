import { Types } from 'mongoose';
import { OrderModel, IOrder } from '../models/Order';
import { OrderReservationModel } from '../models/OrderReservation';
import { ProductBatchModel } from '../models/ProductBatch';
import { DeliveryChallanModel, IDeliveryChallan } from '../models/DeliveryChallan';
import { SalesInvoiceModel, ISalesInvoice } from '../models/SalesInvoice';
import { CourierConsignmentModel } from '../models/CourierConsignment';
import { StockLedgerModel } from '../models/StockLedger';
import { CounterModel } from '../models/Counter';
import { OrderSettingsModel } from '../models/OrderSettings';
import { AuditLogService } from './AuditLogService';
import { ValidationError, NotFoundError } from '../errors/AppError';
import logger from '../config/logger';

export interface CreateDispatchDTO {
  deliveryMethod: 'COURIER' | 'OWN_FLEET' | 'THIRD_PARTY' | 'PICKUP';
  courierPartner?: 'PATHAO' | 'STEADFAST';
  trackingNumber?: string;
  deliveryPerson?: string;
  deliveryPersonPhone?: string;
  vehicleNumber?: string;
  dispatchNotes?: string;
}

export interface ConfirmDeliveryDTO {
  receiverName: string;
  receiverContact?: string;
  deliveredItems?: Array<{ sku: string; qty: number }>;
  notes?: string;
  signatureUrl?: string;
  photoEvidenceUrl?: string;
}

export interface PartialDeliveryDTO {
  deliveredItems: Array<{ sku: string; qty: number }>;
  receiverName: string;
  receiverContact?: string;
  notes?: string;
}

export class OrderDispatchDeliveryService {
  /**
   * 1. Dispatch Order to Courier or Own Fleet
   */
  public static async createDispatch(
    orderId: string,
    dto: CreateDispatchDTO,
    userId?: Types.ObjectId,
    orgId?: string
  ): Promise<IOrder> {
    const order = await OrderModel.findById(orderId).populate('customerId');
    if (!order) throw new NotFoundError('Order', orderId);

    if (order.orderStatus === 'CANCELLED' || order.orderStatus === 'DELIVERED') {
      throw new ValidationError(`Cannot dispatch order with status ${order.orderStatus}`);
    }

    const year = new Date().getFullYear();
    const tracking = dto.trackingNumber || `AWB-${year}-${Math.floor(100000 + Math.random() * 900000)}`;

    // If courier partner specified, create CourierConsignment
    if (dto.courierPartner) {
      const customer = order.customerId as any;
      await CourierConsignmentModel.create({
        orderId: order._id,
        courierPartner: dto.courierPartner,
        consignmentId: `CONS-${year}-${Math.floor(10000 + Math.random() * 90000)}`,
        trackingCode: tracking,
        recipientName: customer?.name || order.shippingAddress,
        recipientPhone: order.contactPhone || customer?.phone || '01700000000',
        recipientAddress: order.shippingAddress,
        weightKg: 2.0,
        codAmount: order.paymentMethod === 'COD' ? order.dueAmount || order.grandTotal : 0,
        courierFee: 120,
        deliveryStatus: 'IN_TRANSIT',
      });
    }

    // Update item dispatched quantities
    for (const line of order.items) {
      line.dispatchedQty = line.qty;
    }

    order.orderStatus = 'DISPATCHED';
    order.dispatchStatus = 'DISPATCHED';
    order.deliveryStatus = 'IN_TRANSIT';

    if (!order.timeline) order.timeline = [];
    order.timeline.push({
      status: 'DISPATCHED',
      event: 'Order Dispatched',
      timestamp: new Date(),
      userId,
      description: `Dispatched via ${dto.deliveryMethod}${dto.courierPartner ? ` (${dto.courierPartner})` : ''}. Tracking: ${tracking}`,
      metadata: { trackingNumber: tracking, method: dto.deliveryMethod },
    });

    await order.save();

    AuditLogService.record({
      actorId: userId ? new Types.ObjectId(userId) : new Types.ObjectId(),
      action: 'ORDER_DISPATCHED',
      targetCollection: 'orders',
      targetId: order._id,
      module: 'ORDER_PROCESSING',
      diff: { method: dto.deliveryMethod, trackingNumber: tracking },
    }).catch(() => {});

    logger.info(`[DispatchDelivery] Order ${order.orderNo} dispatched. Tracking: ${tracking}`);
    return order;
  }

  /**
   * 2. Confirm Delivery & Deduct Physical Stock from Batches/Ledger
   */
  public static async confirmDelivery(
    orderId: string,
    dto: ConfirmDeliveryDTO,
    userId?: Types.ObjectId,
    orgId?: string
  ): Promise<IOrder> {
    const order = await OrderModel.findById(orderId);
    if (!order) throw new NotFoundError('Order', orderId);

    if (order.orderStatus === 'DELIVERED') {
      return order; // Already delivered
    }

    // 1. Permanently deduct stock from batches & fulfill reservations
    const reservations = await OrderReservationModel.find({
      orderId: order._id,
      status: { $in: ['RESERVED', 'PARTIALLY_RESERVED'] },
    });

    for (const res of reservations) {
      for (const item of res.items) {
        if (item.batchId && item.reservedQty > 0) {
          // Deduct from both currentQty and reservedQty
          await ProductBatchModel.findByIdAndUpdate(item.batchId, {
            $inc: {
              currentQty: -item.reservedQty,
              reservedQty: -item.reservedQty,
            },
          });

          // Record in StockLedger
          await StockLedgerModel.create({
            organizationId: order.organizationId,
            warehouseId: item.warehouseId || order.warehouseId,
            sku: item.sku,
            batchId: item.batchId,
            movementType: 'DISPATCH',
            referenceType: 'ORDER',
            referenceNo: order.orderNo,
            qtyChange: -item.reservedQty,
            createdBy: userId || new Types.ObjectId(),
          });
        }
      }
      res.status = 'FULFILLED';
      await res.save();
    }

    // Update items delivered quantity
    for (const line of order.items) {
      line.deliveredQty = line.qty;
    }

    order.orderStatus = 'DELIVERED';
    order.deliveryStatus = 'DELIVERED';
    order.deliveryDate = new Date();

    if (!order.timeline) order.timeline = [];
    order.timeline.push({
      status: 'DELIVERED',
      event: 'Order Delivered',
      timestamp: new Date(),
      userId,
      description: `Delivery confirmed by ${dto.receiverName}. Notes: ${dto.notes || 'None'}`,
      metadata: { receiverName: dto.receiverName, contact: dto.receiverContact },
    });

    await order.save();

    AuditLogService.record({
      actorId: userId ? new Types.ObjectId(userId) : new Types.ObjectId(),
      action: 'ORDER_DELIVERED',
      targetCollection: 'orders',
      targetId: order._id,
      module: 'ORDER_PROCESSING',
      diff: { receiverName: dto.receiverName },
    }).catch(() => {});

    logger.info(`[DispatchDelivery] Order ${order.orderNo} confirmed DELIVERED`);
    return order;
  }

  /**
   * 3. Record Partial Delivery
   */
  public static async recordPartialDelivery(
    orderId: string,
    dto: PartialDeliveryDTO,
    userId?: Types.ObjectId,
    orgId?: string
  ): Promise<IOrder> {
    const order = await OrderModel.findById(orderId);
    if (!order) throw new NotFoundError('Order', orderId);

    let allDelivered = true;

    for (const dItem of dto.deliveredItems) {
      const line = order.items.find((i) => i.sku.toUpperCase() === dItem.sku.toUpperCase());
      if (line) {
        line.deliveredQty = (line.deliveredQty || 0) + dItem.qty;
        if (line.deliveredQty < line.qty) {
          allDelivered = false;
        }
      }
    }

    const nextStatus = allDelivered ? 'DELIVERED' : 'PARTIALLY_DELIVERED';
    order.orderStatus = nextStatus;
    order.deliveryStatus = nextStatus;

    if (!order.timeline) order.timeline = [];
    order.timeline.push({
      status: nextStatus,
      event: allDelivered ? 'Delivery Fully Completed' : 'Partial Delivery Recorded',
      timestamp: new Date(),
      userId,
      description: `Receiver: ${dto.receiverName}. Items delivered partially. Notes: ${dto.notes || 'None'}`,
    });

    await order.save();

    AuditLogService.record({
      actorId: userId ? new Types.ObjectId(userId) : new Types.ObjectId(),
      action: 'PARTIAL_DELIVERY',
      targetCollection: 'orders',
      targetId: order._id,
      module: 'ORDER_PROCESSING',
      diff: { receiver: dto.receiverName, status: nextStatus },
    }).catch(() => {});

    logger.info(`[DispatchDelivery] Order ${order.orderNo} updated to ${nextStatus}`);
    return order;
  }

  /**
   * 4. Generate Delivery Challan (NBR Mushak-6.3) from Order
   */
  public static async createDeliveryChallanForOrder(
    orderId: string,
    userId?: Types.ObjectId,
    orgId?: string
  ): Promise<IDeliveryChallan> {
    const order = await OrderModel.findById(orderId).populate('customerId');
    if (!order) throw new NotFoundError('Order', orderId);

    const year = new Date().getFullYear();
    const challanNo = `CH-${year}-${Math.floor(10000 + Math.random() * 90000)}`;

    const challanItems = order.items.map((i) => ({
      productId: i.productId,
      sku: i.sku,
      productName: i.productName || i.sku,
      hsCode: '9018.90.00',
      batchNumber: i.batchNumber || 'BATCH-STD',
      dispatchedQty: i.qty,
      uom: i.uom || 'PCS',
      dispatchedSerials: [],
      vatRate: i.taxRate || 15,
      sdRate: 0,
    }));

    const challan = await DeliveryChallanModel.create({
      challanNo,
      orderId: order._id,
      customerId: order.customerId,
      companyBin: '001234567-0101',
      buyerBin: '009876543-0202',
      dispatchTime: new Date(),
      transporterType: 'THIRD_PARTY',
      cartonCount: 1,
      items: challanItems,
      status: 'APPROVED',
      preparedBy: userId || new Types.ObjectId(),
    });

    if (!order.timeline) order.timeline = [];
    order.timeline.push({
      status: order.orderStatus,
      event: 'Delivery Challan Created',
      timestamp: new Date(),
      userId,
      description: `Generated official NBR Mushak-6.3 Delivery Challan: ${challanNo}`,
    });
    await order.save();

    logger.info(`[DispatchDelivery] Created Challan ${challanNo} for order ${order.orderNo}`);
    return challan;
  }

  /**
   * 5. Generate Sales Invoice from Order
   */
  public static async createSalesInvoiceForOrder(
    orderId: string,
    userId?: Types.ObjectId,
    orgId?: string
  ): Promise<ISalesInvoice> {
    const order = await OrderModel.findById(orderId);
    if (!order) throw new NotFoundError('Order', orderId);

    const year = new Date().getFullYear();
    const invoiceNo = `INV-${year}-${Math.floor(10000 + Math.random() * 90000)}`;

    const invoice = await SalesInvoiceModel.create({
      invoiceNo,
      orderId: order._id,
      customerId: order.customerId,
      branchId: order.warehouseId,
      invoiceDate: new Date(),
      dueDate: new Date(Date.now() + 30 * 86400000),
      mushakInvoiceNo: `MUSHAK-${invoiceNo}`,
      subtotal: order.subtotal,
      discountAmount: order.discountTotal || 0,
      vatRate: 15,
      vatTotal: order.vatTotal,
      grandTotal: order.grandTotal,
      paidAmount: order.paidAmount || 0,
      dueAmount: order.dueAmount || order.grandTotal,
      paymentStatus: order.dueAmount === 0 ? 'PAID' : 'UNPAID',
      status: 'ISSUED',
      preparedBy: userId || new Types.ObjectId(),
    });

    if (!order.timeline) order.timeline = [];
    order.timeline.push({
      status: order.orderStatus,
      event: 'Sales Invoice Created',
      timestamp: new Date(),
      userId,
      description: `Generated Sales Invoice: ${invoiceNo} (৳${order.grandTotal.toLocaleString()})`,
    });
    await order.save();

    logger.info(`[DispatchDelivery] Created Sales Invoice ${invoiceNo} for order ${order.orderNo}`);
    return invoice;
  }
}
export default OrderDispatchDeliveryService;
