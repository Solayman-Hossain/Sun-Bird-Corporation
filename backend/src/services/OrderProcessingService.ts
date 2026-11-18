import { Types } from 'mongoose';
import { OrderModel, IOrder, OrderStatus, IOrderItem } from '../models/Order';
import { OrderReservationModel } from '../models/OrderReservation';
import { CustomerModel } from '../models/Customer';
import { ProductModel } from '../models/Product';
import { ProductBatchModel } from '../models/ProductBatch';
import { CounterModel } from '../models/Counter';
import { OrderSettingsModel } from '../models/OrderSettings';
import { AuditLogService } from './AuditLogService';
import { ValidationError, NotFoundError } from '../errors/AppError';
import logger from '../config/logger';

export interface OrderDashboardFilters {
  organizationId?: string | Types.ObjectId;
  warehouseId?: string | Types.ObjectId;
  startDate?: string | Date;
  endDate?: string | Date;
  orderChannel?: string;
  orderSource?: string;
  orderStatus?: string;
  paymentStatus?: string;
}

export interface ManualOrderLineDTO {
  productId: string;
  sku: string;
  productName?: string;
  barcode?: string;
  batchNumber?: string;
  batchId?: string;
  warehouseId?: string;
  locationBin?: string;
  qty: number;
  uom: string;
  unitPrice: number;
  discountAmount?: number;
  taxRate?: number;
  taxAmount?: number;
  itemNotes?: string;
}

export interface CreateManualOrderDTO {
  organizationId?: string;
  warehouseId?: string;
  customerId: string;
  orderSource?: string;
  orderChannel?: string;
  salesRepId?: string;
  externalReference?: string;
  items: ManualOrderLineDTO[];
  shippingAddress: string;
  billingAddress?: string;
  contactPhone?: string;
  contactEmail?: string;
  deliveryInstructions?: string;
  notes?: string;
  paymentMethod: string;
  paymentStatus?: string;
  requiredDeliveryDate?: string | Date;
  discountTotal?: number;
  shippingCharge?: number;
  idempotencyKey?: string;
}

// Allowed order status transitions
const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ['SUBMITTED', 'CANCELLED'],
  SUBMITTED: ['PENDING_VERIFICATION', 'PENDING_APPROVAL', 'CONFIRMED', 'ON_HOLD', 'CANCELLED'],
  PENDING_VERIFICATION: ['CONFIRMED', 'REJECTED', 'ON_HOLD', 'CANCELLED'],
  PENDING_APPROVAL: ['CONFIRMED', 'REJECTED', 'ON_HOLD', 'CANCELLED'],
  CONFIRMED: ['PROCESSING', 'PARTIALLY_RESERVED', 'RESERVED', 'ON_HOLD', 'CANCELLED'],
  PROCESSING: ['PARTIALLY_RESERVED', 'RESERVED', 'PICKING', 'ON_HOLD', 'CANCELLED'],
  PARTIALLY_RESERVED: ['RESERVED', 'PICKING', 'ON_HOLD', 'CANCELLED'],
  RESERVED: ['PICKING', 'PACKING', 'ON_HOLD', 'CANCELLED'],
  PICKING: ['PICKED', 'ON_HOLD', 'CANCELLED'],
  PICKED: ['PACKING', 'READY_FOR_DISPATCH', 'ON_HOLD', 'CANCELLED'],
  PACKING: ['PACKED', 'ON_HOLD', 'CANCELLED'],
  PACKED: ['READY_FOR_DISPATCH', 'DISPATCHED', 'ON_HOLD', 'CANCELLED'],
  READY_FOR_DISPATCH: ['DISPATCHED', 'ON_HOLD', 'CANCELLED'],
  DISPATCHED: ['IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'PARTIALLY_DELIVERED', 'RETURNED', 'RTO_IN_TRANSIT'],
  IN_TRANSIT: ['OUT_FOR_DELIVERY', 'DELIVERED', 'PARTIALLY_DELIVERED', 'RETURNED', 'RTO_IN_TRANSIT'],
  OUT_FOR_DELIVERY: ['DELIVERED', 'PARTIALLY_DELIVERED', 'RETURNED', 'RTO_IN_TRANSIT'],
  PARTIALLY_DELIVERED: ['DELIVERED', 'RETURNED'],
  DELIVERED: ['COMPLETED', 'RETURNED'],
  COMPLETED: ['RETURNED'],
  ON_HOLD: ['SUBMITTED', 'PENDING_VERIFICATION', 'CONFIRMED', 'PROCESSING', 'RESERVED', 'PICKING', 'PACKING', 'CANCELLED'],
  PENDING: ['CONFIRMED', 'PROCESSING', 'RESERVED', 'ON_HOLD', 'CANCELLED'],
  ALLOCATED: ['PICKING', 'PACKING', 'DISPATCHED', 'CANCELLED'],
};

export class OrderProcessingService {
  /**
   * 1. Get Real-Time Order Processing Dashboard Metrics & Aggregations
   */
  public static async getOrderDashboard(filters: OrderDashboardFilters = {}): Promise<any> {
    const matchQuery: Record<string, any> = {};

    if (filters.organizationId) {
      matchQuery.organizationId = new Types.ObjectId(filters.organizationId);
    }
    if (filters.warehouseId) {
      matchQuery.warehouseId = new Types.ObjectId(filters.warehouseId);
    }
    if (filters.orderChannel) {
      matchQuery.orderChannel = filters.orderChannel;
    }
    if (filters.orderSource) {
      matchQuery.orderSource = filters.orderSource;
    }
    if (filters.orderStatus) {
      matchQuery.orderStatus = filters.orderStatus;
    }
    if (filters.paymentStatus) {
      matchQuery.paymentStatus = filters.paymentStatus;
    }

    if (filters.startDate || filters.endDate) {
      matchQuery.createdAt = {};
      if (filters.startDate) matchQuery.createdAt.$gte = new Date(filters.startDate);
      if (filters.endDate) matchQuery.createdAt.$lte = new Date(filters.endDate);
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [kpiAgg, todayAgg, statusAgg, paymentAgg, channelAgg, trendsAgg, topProductsAgg] = await Promise.all([
      // Overall KPIs
      OrderModel.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            totalValue: { $sum: '$grandTotal' },
            totalPaid: { $sum: { $ifNull: ['$paidAmount', 0] } },
            totalDue: { $sum: { $ifNull: ['$dueAmount', 0] } },
            pendingOrders: {
              $sum: {
                $cond: [{ $in: ['$orderStatus', ['PENDING', 'SUBMITTED', 'PENDING_VERIFICATION', 'DRAFT']] }, 1, 0],
              },
            },
            confirmedOrders: { $sum: { $cond: [{ $eq: ['$orderStatus', 'CONFIRMED'] }, 1, 0] } },
            processingOrders: { $sum: { $cond: [{ $eq: ['$orderStatus', 'PROCESSING'] }, 1, 0] } },
            reservedOrders: {
              $sum: { $cond: [{ $in: ['$orderStatus', ['RESERVED', 'PARTIALLY_RESERVED', 'ALLOCATED']] }, 1, 0] },
            },
            packingOrders: {
              $sum: { $cond: [{ $in: ['$orderStatus', ['PICKING', 'PICKED', 'PACKING', 'PACKED']] }, 1, 0] },
            },
            readyForDispatchOrders: { $sum: { $cond: [{ $eq: ['$orderStatus', 'READY_FOR_DISPATCH'] }, 1, 0] } },
            dispatchedOrders: {
              $sum: { $cond: [{ $in: ['$orderStatus', ['DISPATCHED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY']] }, 1, 0] },
            },
            deliveredOrders: { $sum: { $cond: [{ $eq: ['$orderStatus', 'DELIVERED'] }, 1, 0] } },
            partialDeliveredOrders: { $sum: { $cond: [{ $eq: ['$orderStatus', 'PARTIALLY_DELIVERED'] }, 1, 0] } },
            cancelledOrders: { $sum: { $cond: [{ $eq: ['$orderStatus', 'CANCELLED'] }, 1, 0] } },
            pendingPaymentOrders: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'UNPAID'] }, 1, 0] } },
            paidOrders: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'PAID'] }, 1, 0] } },
            codOrders: { $sum: { $cond: [{ $eq: ['$paymentMethod', 'COD'] }, 1, 0] } },
            deliveredValue: {
              $sum: { $cond: [{ $eq: ['$orderStatus', 'DELIVERED'] }, '$grandTotal', 0] },
            },
          },
        },
      ]),

      // Today's Orders
      OrderModel.countDocuments({
        ...matchQuery,
        createdAt: { $gte: todayStart },
      }),

      // Orders by Status
      OrderModel.aggregate([
        { $match: matchQuery },
        { $group: { _id: '$orderStatus', count: { $sum: 1 }, value: { $sum: '$grandTotal' } } },
        { $sort: { count: -1 } },
      ]),

      // Orders by Payment Status
      OrderModel.aggregate([
        { $match: matchQuery },
        { $group: { _id: '$paymentStatus', count: { $sum: 1 }, value: { $sum: '$grandTotal' } } },
      ]),

      // Orders by Channel / Source
      OrderModel.aggregate([
        { $match: matchQuery },
        { $group: { _id: { $ifNull: ['$orderSource', '$orderChannel'] }, count: { $sum: 1 }, value: { $sum: '$grandTotal' } } },
        { $sort: { count: -1 } },
      ]),

      // Daily Trends (last 14 days)
      OrderModel.aggregate([
        {
          $match: {
            ...matchQuery,
            createdAt: { $gte: new Date(Date.now() - 14 * 86400000) },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 },
            value: { $sum: '$grandTotal' },
          },
        },
        { $sort: { _id: 1 } },
      ]),

      // Top Selling Products
      OrderModel.aggregate([
        { $match: matchQuery },
        { $unwind: '$items' },
        {
          $group: {
            _id: '$items.sku',
            productName: { $first: '$items.productName' },
            totalQty: { $sum: '$items.qty' },
            totalAmount: { $sum: '$items.lineTotal' },
          },
        },
        { $sort: { totalQty: -1 } },
        { $limit: 5 },
      ]),
    ]);

    const kpi = kpiAgg[0] || {
      totalOrders: 0,
      totalValue: 0,
      totalPaid: 0,
      totalDue: 0,
      pendingOrders: 0,
      confirmedOrders: 0,
      processingOrders: 0,
      reservedOrders: 0,
      packingOrders: 0,
      readyForDispatchOrders: 0,
      dispatchedOrders: 0,
      deliveredOrders: 0,
      partialDeliveredOrders: 0,
      cancelledOrders: 0,
      pendingPaymentOrders: 0,
      paidOrders: 0,
      codOrders: 0,
      deliveredValue: 0,
    };

    return {
      kpiCards: {
        ...kpi,
        todaysOrders: todayAgg,
        outstandingValue: Math.max(0, kpi.totalValue - kpi.totalPaid),
      },
      charts: {
        ordersByStatus: statusAgg.map((s) => ({ status: s._id, count: s.count, value: s.value })),
        ordersByPaymentStatus: paymentAgg.map((p) => ({ status: p._id, count: p.count, value: p.value })),
        ordersByChannel: channelAgg.map((c) => ({ channel: c._id, count: c.count, value: c.value })),
        dailyTrends: trendsAgg.map((t) => ({ date: t._id, count: t.count, value: t.value })),
        topProducts: topProductsAgg.map((p) => ({
          sku: p._id,
          name: p.productName || p._id,
          qty: p.totalQty,
          amount: p.totalAmount,
        })),
      },
    };
  }

  /**
   * 2. List Orders with pagination and filters
   */
  public static async listOrders(
    filters: Record<string, any> = {},
    page: number = 1,
    limit: number = 20
  ): Promise<{ items: any[]; total: number; page: number; totalPages: number }> {
    const query: Record<string, any> = {};

    if (filters.organizationId) query.organizationId = new Types.ObjectId(filters.organizationId);
    if (filters.warehouseId) query.warehouseId = new Types.ObjectId(filters.warehouseId);
    if (filters.orderStatus) query.orderStatus = filters.orderStatus;
    if (filters.paymentStatus) query.paymentStatus = filters.paymentStatus;
    if (filters.paymentMethod) query.paymentMethod = filters.paymentMethod;
    if (filters.orderChannel) query.orderChannel = filters.orderChannel;
    if (filters.orderSource) query.orderSource = filters.orderSource;
    if (filters.customerId) query.customerId = new Types.ObjectId(filters.customerId);

    if (filters.search) {
      const s = String(filters.search).trim();
      query.$or = [
        { orderNo: { $regex: s, $options: 'i' } },
        { shippingAddress: { $regex: s, $options: 'i' } },
        { contactPhone: { $regex: s, $options: 'i' } },
        { externalReference: { $regex: s, $options: 'i' } },
      ];
    }

    const skip = (Math.max(1, page) - 1) * limit;

    const [items, total] = await Promise.all([
      OrderModel.find(query)
        .populate('customerId', 'name customerCode phone email address type')
        .populate('salesRepId', 'name email')
        .populate('warehouseId', 'name code location')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      OrderModel.countDocuments(query),
    ]);

    return {
      items,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * 3. Get Single Order by ID with Full Relations
   */
  public static async getOrderById(orderId: string, orgId?: string): Promise<any> {
    const query: Record<string, any> = { _id: new Types.ObjectId(orderId) };
    if (orgId) query.organizationId = new Types.ObjectId(orgId);

    const order = await OrderModel.findOne(query)
      .populate('customerId')
      .populate('salesRepId', 'name email role')
      .populate('warehouseId')
      .populate('organizationId', 'displayName legalName organizationCode')
      .populate('approvalRequestId')
      .lean();

    if (!order) {
      throw new NotFoundError('Order', orderId);
    }

    // Load linked reservations
    const reservations = await OrderReservationModel.find({ orderId: order._id }).lean();

    return {
      ...order,
      reservations,
    };
  }

  /**
   * 4. Create Manual Sales Order Inside ERP
   */
  public static async createManualSalesOrder(
    dto: CreateManualOrderDTO,
    userId: Types.ObjectId,
    orgId?: Types.ObjectId
  ): Promise<IOrder> {
    if (!dto.items || dto.items.length === 0) {
      throw new ValidationError('Order must contain at least one item');
    }

    // Verify Customer exists
    const customer = (await CustomerModel.findById(dto.customerId).lean()) as any;
    if (!customer) {
      throw new NotFoundError('Customer', dto.customerId);
    }

    const targetOrgId = orgId || (dto.organizationId ? new Types.ObjectId(dto.organizationId) : customer.organizationId);

    // Get order prefix
    const settings = await OrderSettingsModel.findOne({ organizationId: targetOrgId }).lean();
    const prefix = settings?.orderPrefix || 'SBC-ORD';

    // Generate unique order number
    const year = new Date().getFullYear();
    const counterKey = `ORDER_${year}`;
    const counterDoc = await CounterModel.findByIdAndUpdate(
      counterKey,
      { $inc: { seq: 1 } },
      { upsert: true, new: true }
    );
    const seqPadded = String(counterDoc?.seq || 1).padStart(5, '0');
    const orderNo = `${prefix}-${year}-${seqPadded}`;

    // Validate products & calculate totals
    let subtotal = 0;
    let itemsDiscount = 0;
    let vatTotal = 0;
    const processedItems: IOrderItem[] = [];

    for (const item of dto.items) {
      const product = (await ProductModel.findById(item.productId).lean()) as any;
      if (!product) {
        throw new NotFoundError('Product', item.productId);
      }

      const unitPrice = item.unitPrice !== undefined ? item.unitPrice : product.retailPrice || product.mrp || 0;
      const discount = item.discountAmount || 0;
      const grossLine = item.qty * unitPrice;
      const lineNet = Math.max(0, grossLine - discount);
      const taxRate = item.taxRate || 0;
      const taxAmount = (lineNet * taxRate) / 100;

      subtotal += grossLine;
      itemsDiscount += discount;
      vatTotal += taxAmount;

      processedItems.push({
        productId: new Types.ObjectId(item.productId),
        sku: item.sku || product.sku,
        productName: item.productName || product.nameEn || product.sku,
        barcode: item.barcode,
        batchNumber: item.batchNumber,
        batchId: item.batchId ? new Types.ObjectId(item.batchId) : undefined,
        warehouseId: item.warehouseId ? new Types.ObjectId(item.warehouseId) : (dto.warehouseId ? new Types.ObjectId(dto.warehouseId) : undefined),
        locationBin: item.locationBin,
        qty: item.qty,
        reservedQty: 0,
        pickedQty: 0,
        packedQty: 0,
        dispatchedQty: 0,
        deliveredQty: 0,
        uom: item.uom || product.baseUom || 'PCS',
        unitPrice,
        discountAmount: discount,
        taxRate,
        taxAmount,
        lineTotal: lineNet,
        vatAmount: taxAmount,
        itemNotes: item.itemNotes,
      });
    }

    const discountTotal = (dto.discountTotal || 0) + itemsDiscount;
    const shippingCharge = dto.shippingCharge || 0;
    const grandTotal = Math.max(0, subtotal - discountTotal + vatTotal + shippingCharge);

    // Initial timeline
    const timeline = [
      {
        status: 'SUBMITTED',
        event: 'Order Created',
        timestamp: new Date(),
        userId,
        description: `Manual Sales Order created by user. Order Total: ৳${grandTotal.toLocaleString()}`,
      },
    ];

    const order = await OrderModel.create({
      orderNo,
      organizationId: targetOrgId,
      warehouseId: dto.warehouseId ? new Types.ObjectId(dto.warehouseId) : undefined,
      customerId: new Types.ObjectId(dto.customerId),
      salesRepId: dto.salesRepId ? new Types.ObjectId(dto.salesRepId) : userId,
      orderSource: dto.orderSource || 'ERP_MANUAL',
      orderChannel: dto.orderChannel || 'B2B_DIRECT',
      externalReference: dto.externalReference,
      items: processedItems,
      subtotal,
      discountTotal,
      vatTotal,
      shippingCharge,
      grandTotal,
      paidAmount: 0,
      dueAmount: grandTotal,
      paymentMethod: dto.paymentMethod,
      paymentStatus: dto.paymentStatus || 'UNPAID',
      orderStatus: 'SUBMITTED',
      shippingAddress: dto.shippingAddress || customer.shippingAddress || customer.billingAddress || 'Dhaka',
      billingAddress: dto.billingAddress || customer.billingAddress || 'Dhaka',
      contactPhone: dto.contactPhone || customer.phone,
      contactEmail: dto.contactEmail || customer.email,
      deliveryInstructions: dto.deliveryInstructions,
      notes: dto.notes,
      requiredDeliveryDate: dto.requiredDeliveryDate ? new Date(dto.requiredDeliveryDate) : undefined,
      idempotencyKey: dto.idempotencyKey,
      timeline,
    });

    // Audit Log
    AuditLogService.record({
      actorId: userId ? new Types.ObjectId(userId) : new Types.ObjectId(),
      action: 'ORDER_CREATED',
      targetCollection: 'orders',
      targetId: order._id,
      module: 'ORDER_PROCESSING',
      diff: { orderNo, grandTotal, status: 'SUBMITTED' },
    }).catch(() => {});

    logger.info(`[OrderProcessingService] Created manual sales order ${orderNo} (Total: ৳${grandTotal})`);
    return order;
  }

  /**
   * 5. Update Order Status with Strict Transition Validation
   */
  public static async updateOrderStatus(
    orderId: string,
    newStatus: OrderStatus,
    reason?: string,
    userId?: Types.ObjectId,
    orgId?: string
  ): Promise<IOrder> {
    const order = await OrderModel.findById(orderId);
    if (!order) throw new NotFoundError('Order', orderId);

    if (orgId && order.organizationId && order.organizationId.toString() !== orgId) {
      throw new ValidationError('Unauthorized cross-organization order modification');
    }

    const currentStatus = order.orderStatus || 'PENDING';
    const allowed = ALLOWED_TRANSITIONS[currentStatus] || [];

    if (!allowed.includes(newStatus) && currentStatus !== newStatus) {
      throw new ValidationError(
        `Invalid status transition from ${currentStatus} to ${newStatus}. Allowed next statuses: ${allowed.join(', ')}`
      );
    }

    const oldStatus = order.orderStatus;
    order.orderStatus = newStatus;

    if (!order.timeline) order.timeline = [];
    order.timeline.push({
      status: newStatus,
      event: `Status Transition: ${oldStatus} -> ${newStatus}`,
      timestamp: new Date(),
      userId,
      description: reason || `Order status updated to ${newStatus}`,
    });

    await order.save();

    AuditLogService.record({
      actorId: userId ? new Types.ObjectId(userId) : new Types.ObjectId(),
      action: 'STATUS_UPDATED',
      targetCollection: 'orders',
      targetId: order._id,
      module: 'ORDER_PROCESSING',
      diff: { before: oldStatus, after: newStatus, reason },
    }).catch(() => {});

    return order;
  }

  /**
   * 6. Place Order on Hold
   */
  public static async holdOrder(
    orderId: string,
    reason: string,
    userId: Types.ObjectId,
    orgId?: string
  ): Promise<IOrder> {
    const order = await OrderModel.findById(orderId);
    if (!order) throw new NotFoundError('Order', orderId);

    if (order.orderStatus === 'DELIVERED' || order.orderStatus === 'CANCELLED') {
      throw new ValidationError(`Cannot place order on hold when status is ${order.orderStatus}`);
    }

    order.isHold = true;
    order.holdReason = reason;
    order.holdBy = userId;
    order.holdAt = new Date();
    order.orderStatus = 'ON_HOLD';

    if (!order.timeline) order.timeline = [];
    order.timeline.push({
      status: 'ON_HOLD',
      event: 'Order Placed on Hold',
      timestamp: new Date(),
      userId,
      description: `Order placed on hold. Reason: ${reason}`,
    });

    await order.save();

    AuditLogService.record({
      actorId: userId ? new Types.ObjectId(userId) : new Types.ObjectId(),
      action: 'ORDER_HELD',
      targetCollection: 'orders',
      targetId: order._id,
      module: 'ORDER_PROCESSING',
      diff: { reason },
    }).catch(() => {});

    return order;
  }

  /**
   * 7. Release Order from Hold
   */
  public static async releaseHoldOrder(
    orderId: string,
    reason: string,
    userId: Types.ObjectId,
    orgId?: string
  ): Promise<IOrder> {
    const order = await OrderModel.findById(orderId);
    if (!order) throw new NotFoundError('Order', orderId);

    if (!order.isHold && order.orderStatus !== 'ON_HOLD') {
      throw new ValidationError('Order is not currently on hold');
    }

    order.isHold = false;
    order.releaseHoldReason = reason;
    order.orderStatus = 'CONFIRMED';

    if (!order.timeline) order.timeline = [];
    order.timeline.push({
      status: 'CONFIRMED',
      event: 'Hold Released',
      timestamp: new Date(),
      userId,
      description: `Hold released. Reason: ${reason}. Status returned to CONFIRMED.`,
    });

    await order.save();

    AuditLogService.record({
      actorId: userId ? new Types.ObjectId(userId) : new Types.ObjectId(),
      action: 'HOLD_RELEASED',
      targetCollection: 'orders',
      targetId: order._id,
      module: 'ORDER_PROCESSING',
      diff: { reason },
    }).catch(() => {});

    return order;
  }

  /**
   * 8. Safe Order Cancellation
   */
  public static async cancelOrder(
    orderId: string,
    reason: string,
    userId: Types.ObjectId,
    orgId?: string
  ): Promise<IOrder> {
    const order = await OrderModel.findById(orderId);
    if (!order) throw new NotFoundError('Order', orderId);

    if (order.orderStatus === 'DELIVERED' || order.orderStatus === 'COMPLETED') {
      throw new ValidationError('Cannot cancel an order that has already been delivered. Please use Sales Return workflow.');
    }

    if (order.orderStatus === 'CANCELLED') {
      return order; // Already cancelled
    }

    // 1. Release any reserved stock
    const reservations = await OrderReservationModel.find({
      orderId: order._id,
      status: { $in: ['RESERVED', 'PARTIALLY_RESERVED'] },
    });

    for (const res of reservations) {
      for (const item of res.items) {
        if (item.batchId && item.reservedQty > 0) {
          await ProductBatchModel.findByIdAndUpdate(item.batchId, {
            $inc: { reservedQty: -item.reservedQty },
          });
        }
      }
      res.status = 'CANCELLED';
      res.releasedAt = new Date();
      res.releasedBy = userId;
      res.releaseReason = `Order ${order.orderNo} Cancelled: ${reason}`;
      await res.save();
    }

    order.orderStatus = 'CANCELLED';
    order.cancelledReason = reason;
    order.cancelledBy = userId;
    order.cancelledAt = new Date();

    if (!order.timeline) order.timeline = [];
    order.timeline.push({
      status: 'CANCELLED',
      event: 'Order Cancelled',
      timestamp: new Date(),
      userId,
      description: `Order cancelled. Reason: ${reason}. Stock reservations released.`,
    });

    await order.save();

    AuditLogService.record({
      actorId: userId ? new Types.ObjectId(userId) : new Types.ObjectId(),
      action: 'ORDER_CANCELLED',
      targetCollection: 'orders',
      targetId: order._id,
      module: 'ORDER_PROCESSING',
      diff: { reason },
    }).catch(() => {});

    logger.info(`[OrderProcessingService] Cancelled order ${order.orderNo}. Reservations released.`);
    return order;
  }
}
export default OrderProcessingService;
