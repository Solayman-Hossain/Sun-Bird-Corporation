import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { OrderProcessingService } from '../services/OrderProcessingService';
import { OrderPaymentVerificationService } from '../services/OrderPaymentVerificationService';
import { OrderReservationService } from '../services/OrderReservationService';
import { OrderPickingPackingService } from '../services/OrderPickingPackingService';
import { OrderDispatchDeliveryService } from '../services/OrderDispatchDeliveryService';
import { OrderTimelineReportService } from '../services/OrderTimelineReportService';
import { OrderModel } from '../models/Order';
import { ValidationError } from '../errors/AppError';

export class OrderProcessingController {
  /**
   * 1. Dashboard Metrics & KPI Cards
   */
  public static async getDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = (req.user as any)?.organizationId || (req.query.organizationId as string);
      const data = await OrderProcessingService.getOrderDashboard({
        organizationId: orgId,
        warehouseId: req.query.warehouseId as string,
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
        orderChannel: req.query.orderChannel as string,
        orderSource: req.query.orderSource as string,
        orderStatus: req.query.orderStatus as string,
        paymentStatus: req.query.paymentStatus as string,
      });

      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  /**
   * 2. List Orders
   */
  public static async listOrders(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt(String(req.query.page || '1'), 10);
      const limit = parseInt(String(req.query.limit || '20'), 10);
      const orgId = (req.user as any)?.organizationId || (req.query.organizationId as string);

      const filters: Record<string, any> = {
        organizationId: orgId,
        warehouseId: req.query.warehouseId,
        orderStatus: req.query.orderStatus,
        paymentStatus: req.query.paymentStatus,
        paymentMethod: req.query.paymentMethod,
        orderChannel: req.query.orderChannel,
        orderSource: req.query.orderSource,
        customerId: req.query.customerId,
        search: req.query.search,
      };

      const result = await OrderProcessingService.listOrders(filters, page, limit);
      res.status(200).json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  /**
   * 3. Create Manual Sales Order
   */
  public static async createManualOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user as any;
      const userId = user?.userId ? new Types.ObjectId(user.userId) : new Types.ObjectId();
      const orgId = user?.organizationId ? new Types.ObjectId(user.organizationId) : undefined;

      const order = await OrderProcessingService.createManualSalesOrder(req.body, userId, orgId);
      res.status(201).json({ success: true, data: order });
    } catch (err) {
      next(err);
    }
  }

  /**
   * 4. Get Order By ID
   */
  public static async getOrderById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orderId = String(req.params.id);
      const orgId = (req.user as any)?.organizationId;

      const order = await OrderProcessingService.getOrderById(orderId, orgId);
      res.status(200).json({ success: true, data: order });
    } catch (err) {
      next(err);
    }
  }

  /**
   * 5. Update Status
   */
  public static async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orderId = String(req.params.id);
      const { status, reason } = req.body;
      const user = req.user as any;
      const userId = user?.userId ? new Types.ObjectId(user.userId) : undefined;
      const orgId = user?.organizationId;

      if (!status) throw new ValidationError('Status is required');

      const order = await OrderProcessingService.updateOrderStatus(orderId, status, reason, userId, orgId);
      res.status(200).json({ success: true, data: order });
    } catch (err) {
      next(err);
    }
  }

  /**
   * 6. Confirm Order
   */
  public static async confirmOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orderId = String(req.params.id);
      const user = req.user as any;
      const userId = user?.userId ? new Types.ObjectId(user.userId) : undefined;
      const orgId = user?.organizationId;

      const order = await OrderProcessingService.updateOrderStatus(
        orderId,
        'CONFIRMED',
        req.body?.reason || 'Order confirmed by authorized operator',
        userId,
        orgId
      );
      res.status(200).json({ success: true, data: order });
    } catch (err) {
      next(err);
    }
  }

  /**
   * 7. Place Order on Hold
   */
  public static async holdOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orderId = String(req.params.id);
      const { reason } = req.body;
      const user = req.user as any;
      const userId = user?.userId ? new Types.ObjectId(user.userId) : new Types.ObjectId();
      const orgId = user?.organizationId;

      if (!reason) throw new ValidationError('Hold reason is required');

      const order = await OrderProcessingService.holdOrder(orderId, reason, userId, orgId);
      res.status(200).json({ success: true, data: order });
    } catch (err) {
      next(err);
    }
  }

  /**
   * 8. Release Hold
   */
  public static async releaseHold(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orderId = String(req.params.id);
      const { reason } = req.body;
      const user = req.user as any;
      const userId = user?.userId ? new Types.ObjectId(user.userId) : new Types.ObjectId();
      const orgId = user?.organizationId;

      const order = await OrderProcessingService.releaseHoldOrder(
        orderId,
        reason || 'Hold condition resolved',
        userId,
        orgId
      );
      res.status(200).json({ success: true, data: order });
    } catch (err) {
      next(err);
    }
  }

  /**
   * 9. Cancel Order
   */
  public static async cancelOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orderId = String(req.params.id);
      const { reason } = req.body;
      const user = req.user as any;
      const userId = user?.userId ? new Types.ObjectId(user.userId) : new Types.ObjectId();
      const orgId = user?.organizationId;

      if (!reason) throw new ValidationError('Cancellation reason is required');

      const order = await OrderProcessingService.cancelOrder(orderId, reason, userId, orgId);
      res.status(200).json({ success: true, data: order });
    } catch (err) {
      next(err);
    }
  }

  /**
   * 10. Record Payment
   */
  public static async recordPayment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orderId = String(req.params.id);
      const user = req.user as any;
      const userId = user?.userId ? new Types.ObjectId(user.userId) : undefined;
      const orgId = user?.organizationId;

      const order = await OrderPaymentVerificationService.recordOrderPayment(orderId, req.body, userId, orgId);
      res.status(200).json({ success: true, data: order });
    } catch (err) {
      next(err);
    }
  }

  /**
   * 11. Verify Payment
   */
  public static async verifyPayment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orderId = String(req.params.id);
      const paymentNumber = String(req.params.paymentNumber);
      const user = req.user as any;
      const verifiedBy = user?.userId ? new Types.ObjectId(user.userId) : new Types.ObjectId();
      const orgId = user?.organizationId;

      const order = await OrderPaymentVerificationService.verifyOrderPayment(
        orderId,
        paymentNumber,
        verifiedBy,
        orgId
      );
      res.status(200).json({ success: true, data: order });
    } catch (err) {
      next(err);
    }
  }

  /**
   * 12. Reject Payment
   */
  public static async rejectPayment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orderId = String(req.params.id);
      const paymentNumber = String(req.params.paymentNumber);
      const { reason } = req.body;
      const user = req.user as any;
      const rejectedBy = user?.userId ? new Types.ObjectId(user.userId) : new Types.ObjectId();
      const orgId = user?.organizationId;

      if (!reason) throw new ValidationError('Rejection reason is required');

      const order = await OrderPaymentVerificationService.rejectOrderPayment(
        orderId,
        paymentNumber,
        reason,
        rejectedBy,
        orgId
      );
      res.status(200).json({ success: true, data: order });
    } catch (err) {
      next(err);
    }
  }

  /**
   * 13. Record COD Collection
   */
  public static async recordCodCollection(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orderId = String(req.params.id);
      const user = req.user as any;
      const userId = user?.userId ? new Types.ObjectId(user.userId) : new Types.ObjectId();
      const orgId = user?.organizationId;

      const order = await OrderPaymentVerificationService.recordCodCollection(orderId, req.body, userId, orgId);
      res.status(200).json({ success: true, data: order });
    } catch (err) {
      next(err);
    }
  }

  /**
   * 14. Check Stock Availability (Pre-Order / General Inquiry)
   */
  public static async checkPreOrderStockAvailability(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { items, warehouseId } = req.body;
      const orgId = (req.user as any)?.organizationId;
      const stock = await OrderReservationService.checkStockAvailability(
        items || [],
        warehouseId,
        orgId
      );
      res.status(200).json({ success: true, data: stock });
    } catch (err) {
      next(err);
    }
  }

  /**
   * 14b. Check Order-Specific Stock Availability
   */
  public static async checkStockAvailability(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orderId = String(req.params.id);
      const order = await OrderModel.findById(orderId).lean();
      if (!order) throw new ValidationError('Order not found');

      const items = order.items.map((i) => ({ sku: i.sku, productId: i.productId.toString(), warehouseId: i.warehouseId?.toString() }));
      const stock = await OrderReservationService.checkStockAvailability(
        items,
        order.warehouseId?.toString(),
        order.organizationId?.toString()
      );
      res.status(200).json({ success: true, data: stock });
    } catch (err) {
      next(err);
    }
  }

  /**
   * 15. Reserve Stock
   */
  public static async reserveStock(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orderId = String(req.params.id);
      const targetWarehouseId = req.body.warehouseId;
      const user = req.user as any;
      const userId = user?.userId ? new Types.ObjectId(user.userId) : undefined;
      const orgId = user?.organizationId;

      const result = await OrderReservationService.reserveOrderStock(orderId, targetWarehouseId, userId, orgId);
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  /**
   * 16. Release Reservation
   */
  public static async releaseReservation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orderId = String(req.params.id);
      const user = req.user as any;
      const userId = user?.userId ? new Types.ObjectId(user.userId) : undefined;
      const orgId = user?.organizationId;

      const order = await OrderReservationService.releaseOrderReservation(orderId, userId, orgId);
      res.status(200).json({ success: true, data: order });
    } catch (err) {
      next(err);
    }
  }

  /**
   * 17. Create Picking List
   */
  public static async createPickingList(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orderId = String(req.params.id);
      const { warehouseId, pickerId, pickerName } = req.body;
      const user = req.user as any;
      const userId = user?.userId ? new Types.ObjectId(user.userId) : undefined;
      const orgId = user?.organizationId;

      const picking = await OrderPickingPackingService.createPickingList(
        orderId,
        warehouseId,
        pickerId ? new Types.ObjectId(pickerId) : undefined,
        pickerName,
        userId,
        orgId
      );
      res.status(201).json({ success: true, data: picking });
    } catch (err) {
      next(err);
    }
  }

  /**
   * 18a. Scan & Update Individual Picking Item
   */
  public static async updatePickingItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orderId = String(req.params.id);
      const pickingId = String(req.params.pickingId);
      const { sku, pickedQty, barcode } = req.body;

      const session = await OrderPickingPackingService.updatePickingItem(
        orderId,
        pickingId,
        sku,
        pickedQty,
        barcode
      );
      res.status(200).json({ success: true, data: session });
    } catch (err) {
      next(err);
    }
  }

  /**
   * 18. Complete Picking
   */
  public static async completePicking(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orderId = String(req.params.id);
      const pickingId = String(req.params.pickingId);
      const user = req.user as any;
      const userId = user?.userId ? new Types.ObjectId(user.userId) : undefined;
      const orgId = user?.organizationId;

      const order = await OrderPickingPackingService.completePicking(orderId, pickingId, userId, orgId);
      res.status(200).json({ success: true, data: order });
    } catch (err) {
      next(err);
    }
  }

  /**
   * 19. Create Packing Session
   */
  public static async createPacking(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orderId = String(req.params.id);
      const { warehouseId, packerId, packerName, packages } = req.body;
      const user = req.user as any;
      const userId = user?.userId ? new Types.ObjectId(user.userId) : undefined;
      const orgId = user?.organizationId;

      const packing = await OrderPickingPackingService.createPackingSession(
        orderId,
        warehouseId,
        packerId ? new Types.ObjectId(packerId) : undefined,
        packerName,
        packages,
        userId,
        orgId
      );
      res.status(201).json({ success: true, data: packing });
    } catch (err) {
      next(err);
    }
  }

  /**
   * 20. Dispatch Order
   */
  public static async dispatchOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orderId = String(req.params.id);
      const user = req.user as any;
      const userId = user?.userId ? new Types.ObjectId(user.userId) : undefined;
      const orgId = user?.organizationId;

      const order = await OrderDispatchDeliveryService.createDispatch(orderId, req.body, userId, orgId);
      res.status(200).json({ success: true, data: order });
    } catch (err) {
      next(err);
    }
  }

  /**
   * 21. Confirm Delivery
   */
  public static async confirmDelivery(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orderId = String(req.params.id);
      const user = req.user as any;
      const userId = user?.userId ? new Types.ObjectId(user.userId) : undefined;
      const orgId = user?.organizationId;

      const order = await OrderDispatchDeliveryService.confirmDelivery(orderId, req.body, userId, orgId);
      res.status(200).json({ success: true, data: order });
    } catch (err) {
      next(err);
    }
  }

  /**
   * 22. Record Partial Delivery
   */
  public static async recordPartialDelivery(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orderId = String(req.params.id);
      const user = req.user as any;
      const userId = user?.userId ? new Types.ObjectId(user.userId) : undefined;
      const orgId = user?.organizationId;

      const order = await OrderDispatchDeliveryService.recordPartialDelivery(orderId, req.body, userId, orgId);
      res.status(200).json({ success: true, data: order });
    } catch (err) {
      next(err);
    }
  }

  /**
   * 23. Generate Delivery Challan
   */
  public static async generateChallan(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orderId = String(req.params.id);
      const user = req.user as any;
      const userId = user?.userId ? new Types.ObjectId(user.userId) : undefined;
      const orgId = user?.organizationId;

      const challan = await OrderDispatchDeliveryService.createDeliveryChallanForOrder(orderId, userId, orgId);
      res.status(201).json({ success: true, data: challan });
    } catch (err) {
      next(err);
    }
  }

  /**
   * 24. Generate Sales Invoice
   */
  public static async generateInvoice(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orderId = String(req.params.id);
      const user = req.user as any;
      const userId = user?.userId ? new Types.ObjectId(user.userId) : undefined;
      const orgId = user?.organizationId;

      const invoice = await OrderDispatchDeliveryService.createSalesInvoiceForOrder(orderId, userId, orgId);
      res.status(201).json({ success: true, data: invoice });
    } catch (err) {
      next(err);
    }
  }

  /**
   * 25. Get Timeline
   */
  public static async getTimeline(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orderId = String(req.params.id);
      const timeline = await OrderTimelineReportService.getOrderTimeline(orderId);
      res.status(200).json({ success: true, data: timeline });
    } catch (err) {
      next(err);
    }
  }

  /**
   * 26. Get Customer Order History
   */
  public static async getCustomerHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const customerId = String(req.params.customerId);
      const orders = await OrderModel.find({ customerId: new Types.ObjectId(customerId) })
        .sort({ createdAt: -1 })
        .limit(20)
        .lean();
      res.status(200).json({ success: true, data: orders });
    } catch (err) {
      next(err);
    }
  }

  /**
   * 27. Reports
   */
  public static async getReports(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const reportType = String(req.params.reportType || 'summary');
      const orgId = (req.user as any)?.organizationId;
      const reports = await OrderTimelineReportService.getOrderReports(reportType, req.query, orgId);
      res.status(200).json({ success: true, data: reports });
    } catch (err) {
      next(err);
    }
  }

  /**
   * 28. Get Settings
   */
  public static async getSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = (req.user as any)?.organizationId;
      const settings = await OrderTimelineReportService.getOrderSettings(orgId);
      res.status(200).json({ success: true, data: settings });
    } catch (err) {
      next(err);
    }
  }

  /**
   * 29. Update Settings
   */
  public static async updateSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = (req.user as any)?.organizationId;
      const settings = await OrderTimelineReportService.updateOrderSettings(req.body, orgId);
      res.status(200).json({ success: true, data: settings });
    } catch (err) {
      next(err);
    }
  }

  /**
   * 30. Public Order Tracking (Secure Customer Facing)
   */
  public static async trackOrderPublic(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const trackingCode = String(req.params.code || req.query.code || '');
      if (!trackingCode) throw new ValidationError('Tracking code is required');

      const data = await OrderTimelineReportService.trackOrderCustomerFacing(trackingCode);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }
}
export default OrderProcessingController;
