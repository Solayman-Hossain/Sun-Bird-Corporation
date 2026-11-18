import { Types } from 'mongoose';
import { OrderModel, IOrder } from '../models/Order';
import { CourierConsignmentModel } from '../models/CourierConsignment';
import { OrderSettingsModel, IOrderSettings } from '../models/OrderSettings';
import { NotFoundError } from '../errors/AppError';

export class OrderTimelineReportService {
  /**
   * 1. Add Chronological Timeline Event to an Order
   */
  public static async addTimelineEvent(
    orderId: string,
    event: string,
    description: string,
    userId?: Types.ObjectId,
    metadata?: Record<string, any>
  ): Promise<IOrder> {
    const order = await OrderModel.findById(orderId);
    if (!order) throw new NotFoundError('Order', orderId);

    if (!order.timeline) order.timeline = [];
    order.timeline.push({
      status: order.orderStatus,
      event,
      timestamp: new Date(),
      userId,
      description,
      metadata,
    });

    await order.save();
    return order;
  }

  /**
   * 2. Get Order Timeline
   */
  public static async getOrderTimeline(orderId: string): Promise<any[]> {
    const order = await OrderModel.findById(orderId).select('timeline orderNo orderStatus').lean();
    if (!order) throw new NotFoundError('Order', orderId);
    return order.timeline || [];
  }

  /**
   * 3. Order Reports Engine
   */
  public static async getOrderReports(
    reportType: string,
    filters: Record<string, any> = {},
    orgId?: string
  ): Promise<any> {
    const matchQuery: Record<string, any> = {};
    const targetOrg = orgId || filters.organizationId;
    if (targetOrg) matchQuery.organizationId = new Types.ObjectId(targetOrg);
    if (filters.warehouseId) matchQuery.warehouseId = new Types.ObjectId(filters.warehouseId);
    if (filters.startDate || filters.endDate) {
      matchQuery.createdAt = {};
      if (filters.startDate) matchQuery.createdAt.$gte = new Date(filters.startDate);
      if (filters.endDate) matchQuery.createdAt.$lte = new Date(filters.endDate);
    }

    switch (reportType.toLowerCase()) {
      case 'summary':
      default: {
        const [statusBreakdown, channelBreakdown, totals] = await Promise.all([
          OrderModel.aggregate([
            { $match: matchQuery },
            { $group: { _id: '$orderStatus', count: { $sum: 1 }, totalAmount: { $sum: '$grandTotal' } } },
          ]),
          OrderModel.aggregate([
            { $match: matchQuery },
            {
              $group: {
                _id: { $ifNull: ['$orderSource', '$orderChannel'] },
                count: { $sum: 1 },
                totalAmount: { $sum: '$grandTotal' },
              },
            },
          ]),
          OrderModel.aggregate([
            { $match: matchQuery },
            {
              $group: {
                _id: null,
                totalOrders: { $sum: 1 },
                grossValue: { $sum: '$grandTotal' },
                totalPaid: { $sum: { $ifNull: ['$paidAmount', 0] } },
                totalDue: { $sum: { $ifNull: ['$dueAmount', 0] } },
              },
            },
          ]),
        ]);

        return {
          totals: totals[0] || { totalOrders: 0, grossValue: 0, totalPaid: 0, totalDue: 0 },
          byStatus: statusBreakdown,
          byChannel: channelBreakdown,
        };
      }

      case 'fulfillment': {
        const [pickingStats, packingStats, dispatchStats] = await Promise.all([
          OrderModel.aggregate([
            { $match: matchQuery },
            { $group: { _id: '$pickingStatus', count: { $sum: 1 } } },
          ]),
          OrderModel.aggregate([
            { $match: matchQuery },
            { $group: { _id: '$packingStatus', count: { $sum: 1 } } },
          ]),
          OrderModel.aggregate([
            { $match: matchQuery },
            { $group: { _id: '$dispatchStatus', count: { $sum: 1 } } },
          ]),
        ]);

        return {
          picking: pickingStats,
          packing: packingStats,
          dispatch: dispatchStats,
        };
      }

      case 'delivery': {
        const [deliveryStats, consignmentStats] = await Promise.all([
          OrderModel.aggregate([
            { $match: matchQuery },
            { $group: { _id: '$deliveryStatus', count: { $sum: 1 } } },
          ]),
          CourierConsignmentModel.aggregate([
            { $group: { _id: '$deliveryStatus', count: { $sum: 1 }, totalCod: { $sum: '$codAmount' } } },
          ]),
        ]);

        return {
          ordersByDeliveryStatus: deliveryStats,
          courierConsignments: consignmentStats,
        };
      }

      case 'cancellation': {
        const reasons = await OrderModel.aggregate([
          { $match: { ...matchQuery, orderStatus: 'CANCELLED' } },
          { $group: { _id: { $ifNull: ['$cancelledReason', 'Unspecified'] }, count: { $sum: 1 }, totalLoss: { $sum: '$grandTotal' } } },
          { $sort: { count: -1 } },
        ]);

        return {
          totalCancelled: reasons.reduce((sum, r) => sum + r.count, 0),
          reasons,
        };
      }

      case 'cod': {
        const codSummary = await OrderModel.aggregate([
          { $match: { ...matchQuery, paymentMethod: 'COD' } },
          {
            $group: {
              _id: '$codStatus',
              count: { $sum: 1 },
              totalAmount: { $sum: '$grandTotal' },
              collectedAmount: { $sum: { $ifNull: ['$codCollectionAmount', 0] } },
            },
          },
        ]);

        return {
          codBreakdown: codSummary,
        };
      }
    }
  }

  /**
   * 4. Get & Update Order Settings per Organization
   */
  public static async getOrderSettings(orgId?: string): Promise<IOrderSettings> {
    const oId = orgId ? new Types.ObjectId(orgId) : new Types.ObjectId();
    let settings = await OrderSettingsModel.findOne({ organizationId: oId });
    if (!settings) {
      settings = await OrderSettingsModel.create({
        organizationId: oId,
        orderPrefix: 'SBC-ORD',
        autoConfirmOnlineOrders: false,
        autoReserveOnConfirm: true,
        autoInvoiceOnDelivery: true,
        requirePaymentVerificationForBank: true,
        codMaxLimit: 50000,
        courierPartners: ['PATHAO', 'STEADFAST', 'OWN_FLEET'],
      });
    }
    return settings;
  }

  public static async updateOrderSettings(
    dto: Partial<IOrderSettings>,
    orgId?: string
  ): Promise<IOrderSettings> {
    const oId = orgId ? new Types.ObjectId(orgId) : new Types.ObjectId();
    const settings = await OrderSettingsModel.findOneAndUpdate(
      { organizationId: oId },
      { $set: dto },
      { upsert: true, new: true }
    );
    return settings;
  }

  /**
   * 5. Secure Customer-Facing Public Order Tracking
   */
  public static async trackOrderCustomerFacing(trackingQuery: string): Promise<any> {
    const query = trackingQuery.trim().toUpperCase();

    // Find order by orderNo or consignment tracking code
    let order = await OrderModel.findOne({
      $or: [{ orderNo: query }, { externalReference: query }],
    }).lean();

    let consignment: any = null;

    if (!order) {
      // Check courier tracking
      consignment = await CourierConsignmentModel.findOne({
        $or: [{ trackingCode: query }, { consignmentId: query }],
      }).lean();

      if (consignment) {
        order = await OrderModel.findById(consignment.orderId).lean();
      }
    } else {
      consignment = await CourierConsignmentModel.findOne({ orderId: order._id }).lean();
    }

    if (!order) {
      throw new NotFoundError('Order or Consignment', trackingQuery);
    }

    // Determine current progression step (1 to 5)
    let currentStep = 1; // Order Received
    const status = order.orderStatus || 'PENDING';
    if (['CONFIRMED', 'PROCESSING', 'RESERVED'].includes(status)) currentStep = 2;
    if (['PICKING', 'PICKED', 'PACKING', 'PACKED', 'READY_FOR_DISPATCH'].includes(status)) currentStep = 3;
    if (['DISPATCHED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY'].includes(status)) currentStep = 4;
    if (['DELIVERED', 'COMPLETED'].includes(status)) currentStep = 5;

    // Mask sensitive recipient name e.g. "Kamal Hossain" -> "K***l H***n"
    const mask = (str: string) => {
      if (!str) return 'Customer';
      const parts = str.split(' ');
      return parts.map((p) => (p.length > 2 ? `${p[0]}***${p[p.length - 1]}` : p)).join(' ');
    };

    return {
      orderNumber: order.orderNo,
      orderDate: order.createdAt,
      status: order.orderStatus,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      currentStep,
      courier: consignment ? consignment.courierPartner : 'Sun Bird Express Logistics',
      trackingCode: consignment ? consignment.trackingCode : (order.orderNo || 'N/A'),
      deliveryStatus: consignment ? consignment.deliveryStatus : order.deliveryStatus,
      shippingDistrict: order.shippingAddress ? order.shippingAddress.split(',').pop()?.trim() : 'Dhaka',
      maskedCustomerName: mask(order.shippingAddress || 'Customer'),
      items: order.items.map((i) => ({
        sku: i.sku,
        productName: i.productName || i.sku,
        qty: i.qty,
        uom: i.uom,
      })),
      timeline: (order.timeline || []).map((t) => ({
        event: t.event,
        status: t.status,
        timestamp: t.timestamp,
        description: t.description,
      })),
    };
  }
}
export default OrderTimelineReportService;
